import dotenv from 'dotenv';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { ANALYZE_PROMPT_TEMPLATE, SQL_PROMPT_TEMPLATE, ANSWER_PROMPT_TEMPLATE } from './prompts.js';
import { getDatabaseSchemaForPrompt } from './dbSchema.js';
import { executeSafeReadQuery, safeStringify } from './sqlExecutor.js';
import {
    ThoughtCallback,
    SqlQueryCallback,
    QueryResultCallback,
    AnswerCallback,
    CompleteCallback,
    AgentState,
    AgentCallbacks,
    PipelineStep
} from '../../types/index.js';

// Load environment variables
dotenv.config();

// Initialize LangChain model
const model = new ChatOpenAI({
    apiKey: process.env.NEBIUS_API_KEY,
    modelName: "meta-llama/Llama-3.3-70B-Instruct",
    temperature: 0,
    configuration: {
        baseURL: 'https://api.studio.nebius.com/v1/'
    }
});

// Get database schema for prompts once
const schema = getDatabaseSchemaForPrompt();

// Create prompt templates once
const analyzePrompt = PromptTemplate.fromTemplate(ANALYZE_PROMPT_TEMPLATE);
const sqlPrompt = PromptTemplate.fromTemplate(SQL_PROMPT_TEMPLATE);
const answerPrompt = PromptTemplate.fromTemplate(ANSWER_PROMPT_TEMPLATE);

// Create the chains once at module level
const analyzeChain = analyzePrompt.pipe(model).pipe(new StringOutputParser());
const sqlChain = sqlPrompt.pipe(model).pipe(new StringOutputParser());
const answerChain = answerPrompt.pipe(model).pipe(new StringOutputParser());

/**
 * Helper function to create a pipeline step
 */
const createStep = (config: {
    name: string;
    message: string;
    execute: (state: AgentState) => Promise<AgentState>;
    onSuccess: (state: AgentState, callbacks: AgentCallbacks) => boolean;
}): PipelineStep => config;

/**
 * Create the agent pipeline steps
 */
const createPipeline = (): PipelineStep[] => [
    // Step 1: Analyze the question
    createStep({
        name: 'analyze',
        message: 'Analyzing your question...',
        execute: async (state) => {
            const analysis = await analyzeChain.invoke({
                schema,
                question: state.question
            });

            // Extract confidence score
            const confidenceMatch = analysis.match(/\[CONFIDENCE: (0\.\d+)\]/);
            const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0;

            return {
                ...state,
                analysis,
                confidence,
                shouldContinue: confidence >= 0.4
            };
        },
        onSuccess: (state, callbacks) => {
            if (state.analysis) {
                callbacks.onThought(state.analysis);
            }
            if (!state.shouldContinue) {
                callbacks.onAnswer("I need a specific question about customer data to help you. " +
                                 "Please ask about customers, their orders, or addresses.");
            }
            return state.shouldContinue || false;
        }
    }),

    // Step 2: Generate SQL query
    createStep({
        name: 'generateSql',
        message: 'Generating SQL query...',
        execute: async (state) => {
            const sqlQuery = await sqlChain.invoke({
                schema,
                question: state.question,
                analysis: state.analysis
            });

            // Sanitize SQL query
            const sanitizedQuery = sqlQuery.trim().replace(/;+$/, '');

            return { ...state, sqlQuery: sanitizedQuery };
        },
        onSuccess: (state, callbacks) => {
            if (state.sqlQuery) {
                callbacks.onSqlQuery(state.sqlQuery);
            }
            return true;
        }
    }),

    // Step 3: Execute SQL query
    createStep({
        name: 'executeSql',
        message: 'Executing SQL query...',
        execute: async (state) => {
            if (!state.sqlQuery) {
                throw new Error('No SQL query to execute');
            }

            const result = await executeSafeReadQuery<Record<string, string>[]>(state.sqlQuery);

            if (!result.success) {
                throw new Error(result.error);
            }

            return { ...state, queryResult: result.data as Record<string, string>[] };
        },
        onSuccess: (state, callbacks) => {
            if (state.queryResult) {
                callbacks.onQueryResult(state.queryResult);
            }
            return true;
        }
    }),

    // Step 4: Generate answer
    createStep({
        name: 'generateAnswer',
        message: 'Generating answer...',
        execute: async (state) => {
            if (!state.sqlQuery || !state.queryResult) {
                throw new Error('Missing SQL query or query results');
            }

            const answer = await answerChain.invoke({
                question: state.question,
                sqlQuery: state.sqlQuery,
                queryResult: safeStringify(state.queryResult)
            });

            return { ...state, answer };
        },
        onSuccess: (state, callbacks) => {
            if (state.answer) {
                callbacks.onAnswer(state.answer);
            }
            return true;
        }
    })
];

/**
 * Process a question through the pipeline
 *
 * This function implements the core agent logic required by the project:
 * 1. Uses LangChain for LLM integration (via the chains defined above)
 * 2. Processes natural language questions about customer data
 * 3. Generates and executes SQL queries against the database
 * 4. Streams results in real-time through callbacks
 * 5. Handles errors gracefully at each step
 *
 * @param question The natural language question
 * @param onThought Callback for thoughts/reasoning
 * @param onSqlQuery Callback for the generated SQL query
 * @param onQueryResult Callback for the query result
 * @param onAnswer Callback for the final answer
 * @param onComplete Callback when the streaming is complete
 */
export const runAgent = async (
    question: string,
    onThought: ThoughtCallback,
    onSqlQuery: SqlQueryCallback,
    onQueryResult: QueryResultCallback,
    onAnswer: AnswerCallback,
    onComplete: CompleteCallback
): Promise<void> => {
    const callbacks: AgentCallbacks = {
        onThought,
        onSqlQuery,
        onQueryResult,
        onAnswer,
        onComplete
    };
    const pipeline = createPipeline();

    try {
        // Initialize state with the question
        let state: AgentState = { question };

        // Process each step in the pipeline
        for (const step of pipeline) {
            try {
                // Announce the current step
                callbacks.onThought(step.message);

                // Execute the step
                state = await step.execute(state);

                // Process the result
                const shouldContinue = step.onSuccess(state, callbacks);
                if (!shouldContinue) break;

            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                callbacks.onThought(`Error in ${step.name}: ${errorMsg}`);
                callbacks.onAnswer(`I encountered an error: ${errorMsg}`);
                return;
            }
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        callbacks.onThought(`Error: ${errorMsg}`);
        callbacks.onAnswer('I encountered an error while processing your question.');
    } finally {
        callbacks.onComplete();
    }
};

// Export runAgent as streamingLangChainAgent for backward compatibility
export const streamingLangChainAgent = runAgent;
