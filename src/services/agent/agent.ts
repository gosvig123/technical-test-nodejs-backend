import dotenv from 'dotenv';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
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
    IAgentQuestionInput,
    IAgentChainResult
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





/**
 * Creates the LangChain chains for the agent
 * Uses LangChain's RunnableSequence to create composable chains for analyzing questions,
 * generating SQL queries, and formulating answers.
 * @returns The LangChain chains
 */
const createChains = () => {
    const schema = getDatabaseSchemaForPrompt();

    // Create prompt templates
    const analyzePrompt = PromptTemplate.fromTemplate(ANALYZE_PROMPT_TEMPLATE);
    const sqlPrompt = PromptTemplate.fromTemplate(SQL_PROMPT_TEMPLATE);
    const answerPrompt = PromptTemplate.fromTemplate(ANSWER_PROMPT_TEMPLATE);

    // Create a chain for analyzing the question
    const analyzeChain = RunnableSequence.from([
        analyzePrompt,
        model,
        new StringOutputParser()
    ]);

    // Create a chain for generating SQL queries
    const sqlChain = RunnableSequence.from([
        sqlPrompt,
        model,
        new StringOutputParser()
    ]);

    // Create a chain for generating the final answer
    const answerChain = RunnableSequence.from([
        answerPrompt,
        model,
        new StringOutputParser()
    ]);

    // Create a combined chain for the entire process
    const agentChain = RunnableSequence.from([
        // First, format the input for the analyze chain
        async (input: IAgentQuestionInput) => {
            return {
                schema,
                question: input.question
            };
        },
        // Then run the analyze chain
        async (input: { schema: string, question: string }) => {
            const analysis = await analyzeChain.invoke(input);
            return {
                ...input,
                analysis
            };
        },
        // Then check confidence and generate SQL if confidence is high enough
        async (input: { schema: string, question: string, analysis: string }) => {
            // Extract confidence score
            const confidenceMatch = input.analysis.match(/\[CONFIDENCE: (0\.\d+)\]/);
            const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0;

            if (confidence >= 0.4) {
                // Generate SQL query
                const sqlQuery = await sqlChain.invoke(input);

                // Sanitize SQL query
                const sanitizedQuery = sqlQuery.trim()
                    .replace(/;+$/, ''); // Remove trailing semicolons

                return {
                    ...input,
                    confidence,
                    sqlQuery: sanitizedQuery
                };
            } else {
                return {
                    ...input,
                    confidence,
                    sqlQuery: null
                };
            }
        }
    ]);

    return { analyzeChain, sqlChain, answerChain, agentChain, schema };
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
export const runAgent = async (
    question: string,
    onThought: ThoughtCallback,
    onSqlQuery: SqlQueryCallback,
    onQueryResult: QueryResultCallback,
    onAnswer: AnswerCallback,
    onComplete: CompleteCallback
): Promise<void> => {
    try {
        // Create chains and get schema
        const { answerChain, agentChain } = createChains();

        // Step 1: Run the agent chain to analyze and generate SQL
        onThought("Analyzing your question...");

        // Run the agent chain
        const result = await agentChain.invoke({ question }) as IAgentChainResult;

        // Send the analysis to the client
        onThought(result.analysis);

        // If confidence is too low, return early
        if (result.confidence < 0.4) {
            const response = "I need a specific question about customer data to help you. " +
                           "Please ask about customers, their orders, or addresses.";

            onAnswer(response);
            return;
        }

        // Get the SQL query from the result
        const sqlQuery = result.sqlQuery;
        if (!sqlQuery) {
            throw new Error("Failed to generate SQL query");
        }

        // Send the SQL query to the client
        onThought("Generating SQL query...");
        onSqlQuery(sqlQuery);

        // Step 3: Execute SQL query
        onThought("Executing SQL query...");

        try {
            // Execute the query safely
            const queryResult = await executeSafeReadQuery<Record<string, string>[]>(sqlQuery);

            if (!queryResult.success) {
                throw new Error(queryResult.error);
            }

            onQueryResult(queryResult.data as Record<string, string>[]);

            // Step 4: Generate answer
            onThought("Generating answer...");
            // Generate the answer using the answer chain
            const answer = await answerChain.invoke({
                question,
                sqlQuery,
                queryResult: safeStringify(queryResult.data as Record<string, string>[])
            });

            onAnswer(answer);
        } catch (err) {
            const error = err instanceof Error ? err.message : 'Unknown error executing query';
            onThought(`Error executing query: ${error}`);
            onAnswer(`I encountered an error: ${error}`);
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        onThought(`Error: ${errorMsg}`);
        onAnswer('I encountered an error while processing your question.');
    } finally {
        onComplete();
    }
};

// For backward compatibility
export const streamingLangChainAgent = runAgent;
