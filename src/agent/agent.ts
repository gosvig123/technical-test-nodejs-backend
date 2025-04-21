import dotenv from 'dotenv';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { SqlService } from '../services/sql/sqlService.js';
import { PromptService } from '../services/prompt/promptService.js';

// Load environment variables
dotenv.config();

// Initialize LangChain model
const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.NEBIUS_API_KEY,
    modelName: process.env.OPENAI_MODEL || 'meta-llama/Llama-3.3-70B-Instruct',
    temperature: 0,
    configuration: {
        baseURL: process.env.OPENAI_BASE_URL || 'https://api.studio.nebius.com/v1/'
    }
});

/**
 * Interface for agent response
 */
export interface IAgentResponse {
    answer: string;
    sqlQuery?: string;
    queryResult?: any;
    thoughts?: string[];
    error?: string | null;
}

/**
 * Interface for agent callbacks
 */
export interface IAgentCallbacks {
    onThought?: (thought: string) => void;
    onSqlQuery?: (sqlQuery: string) => void;
    onQueryResult?: (result: any) => void;
    onAnswer?: (answer: string) => void;
}

/**
 * Creates the LangChain chains for the agent
 * @returns The LangChain chains
 */
const createChains = () => {
    // Get the database schema dynamically
    const schema = SqlService.getDatabaseSchemaForPrompt();

    // Create prompt templates
    const promptTemplates = PromptService.createPromptTemplates();

    // Create chains using the prompt templates
    const analyzeChain = RunnableSequence.from([
        promptTemplates.analyzePrompt,
        model,
        new StringOutputParser()
    ]);

    const sqlChain = RunnableSequence.from([
        promptTemplates.sqlPrompt,
        model,
        new StringOutputParser()
    ]);

    const answerChain = RunnableSequence.from([
        promptTemplates.answerPrompt,
        model,
        new StringOutputParser()
    ]);

    return { analyzeChain, sqlChain, answerChain, schema };
};

/**
 * Core agent logic function that both streaming and non-streaming versions use
 * @param question The natural language question
 * @param callbacks Optional callbacks for streaming responses
 * @returns The agent's response
 */
const executeAgentLogic = async (
    question: string,
    callbacks?: IAgentCallbacks
): Promise<IAgentResponse> => {
    try {
        // Create chains and get schema
        const { analyzeChain, sqlChain, answerChain, schema } = createChains();

        // Step 1: Analyze the question
        callbacks?.onThought?.("Analyzing your question...");
        const analysis = await analyzeChain.invoke({ schema, question });
        callbacks?.onThought?.(analysis);

        // Step 2: Generate SQL query
        callbacks?.onThought?.("Generating SQL query...");
        let sqlQuery = await sqlChain.invoke({ schema, question, analysis });
        sqlQuery = SqlService.cleanupSqlQuery(sqlQuery);
        callbacks?.onSqlQuery?.(sqlQuery);

        // Step 3: Execute SQL query
        callbacks?.onThought?.("Executing SQL query...");

        try {
            // Use the SqlService to execute the query
            const queryResult = await SqlService.executeSafeReadQuery(sqlQuery);

            if (!queryResult.success) {
                throw new Error(queryResult.error);
            }

            callbacks?.onQueryResult?.(queryResult.data);

            // Step 4: Generate answer
            callbacks?.onThought?.("Generating answer...");
            const answer = await answerChain.invoke({
                question,
                sqlQuery,
                queryResult: SqlService.safeStringify(queryResult.data)
            });

            callbacks?.onAnswer?.(answer);

            return {
                answer,
                sqlQuery,
                queryResult: queryResult.data,
                thoughts: [analysis],
                error: null
            };
        } catch (err) {
            const error = err instanceof Error ? err.message : 'Unknown error executing query';
            callbacks?.onThought?.(`Error executing query: ${error}`);

            return {
                answer: `I encountered an error: ${error}`,
                sqlQuery,
                thoughts: [analysis],
                error
            };
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        callbacks?.onThought?.(`Error: ${errorMsg}`);

        return {
            answer: 'I encountered an error while processing your question.',
            thoughts: [],
            error: errorMsg
        };
    }
};

/**
 * Run the LLM-powered agent to answer a natural language question using LangChain
 * @param question The natural language question
 * @returns The agent's response including answer, SQL query, query result, and thoughts
 */
const runLangChainAgent = async (question: string): Promise<IAgentResponse> => {
    return executeAgentLogic(question);
};

/**
 * Run the LLM-powered agent with streaming response
 * @param question The natural language question
 * @param onThought Callback for thoughts/reasoning
 * @param onSqlQuery Callback for the generated SQL query
 * @param onQueryResult Callback for the query result
 * @param onAnswer Callback for the final answer
 * @param onComplete Callback when the streaming is complete
 */
const streamingLangChainAgent = async (
    question: string,
    onThought: (thought: string) => void,
    onSqlQuery: (sqlQuery: string) => void,
    onQueryResult: (result: any) => void,
    onAnswer: (answer: string) => void,
    onComplete: () => void
): Promise<void> => {
    try {
        await executeAgentLogic(question, {
            onThought,
            onSqlQuery,
            onQueryResult,
            onAnswer
        });
    } finally {
        onComplete();
    }
};

// Export functions
export {
    runLangChainAgent,
    streamingLangChainAgent
};
