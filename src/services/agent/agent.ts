import dotenv from 'dotenv';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import prisma from '../../db/index.js';
import { Prisma } from '../../../generated/prisma/index.js';
import { PromptTemplate } from '@langchain/core/prompts';
import { ANALYZE_PROMPT_TEMPLATE, SQL_PROMPT_TEMPLATE, ANSWER_PROMPT_TEMPLATE } from './prompts.js';

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
 * Interface for SQL query result
 */
interface ISqlQueryResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    query?: string;
}

/**
 * Validates a SQL query to ensure it's safe to execute
 * @param query The SQL query to validate
 * @returns Validation result with isValid flag and optional error message
 */
const validateSqlQuery = (query: string): { isValid: boolean; error?: string } => {
    // Basic validation checks
    if (!query) {
        return { isValid: false, error: 'Query is empty' };
    }

    // Ensure it's a SELECT query
    if (!query.trim().toLowerCase().startsWith('select')) {
        return { isValid: false, error: 'Only SELECT queries are allowed' };
    }

    // Check for dangerous keywords
    const dangerousKeywords = ['insert', 'update', 'delete', 'drop', 'truncate', 'alter'];
    const hasDisallowedKeywords = dangerousKeywords.some(keyword =>
        query.toLowerCase().includes(keyword)
    );

    if (hasDisallowedKeywords) {
        return { isValid: false, error: 'Query contains disallowed keywords' };
    }

    return { isValid: true };
};

/**
 * Safely executes a read-only SQL query
 * @param sqlQuery The SQL query to execute
 * @returns The query result
 */
const executeSafeReadQuery = async <T = Record<string, string>>(sqlQuery: string): Promise<ISqlQueryResult<T>> => {
    try {
        // Add validation check
        const validation = validateSqlQuery(sqlQuery);
        if (!validation.isValid) {
            return {
                success: false,
                error: validation.error,
                query: sqlQuery
            };
        }

        // Execute the query
        const result = await prisma.$queryRawUnsafe<T>(sqlQuery);

        return {
            success: true,
            data: result,
            query: sqlQuery
        };
    } catch (error) {
        console.error('Error executing query:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error executing query';

        return {
            success: false,
            error: errorMessage,
            query: sqlQuery
        };
    }
};

/**
 * Safely stringify objects with BigInt values
 * @param obj The object to stringify
 * @returns The stringified object
 */
const safeStringify = (obj: Record<string, string> | Record<string, string>[]): string => {
    return JSON.stringify(obj, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
    );
};

/**
 * Get a formatted database schema string for use in prompts
 * This method dynamically extracts schema information from Prisma's metadata
 * @returns A string representation of the database schema
 */
const getDatabaseSchemaForPrompt = (): string => {
    // Get model names from Prisma's metadata
    const modelNames = Object.keys(Prisma.ModelName).map(key =>
        (Prisma.ModelName as Record<string, string>)[key]
    );

    let schema = '';

    // Add tables and columns
    for (const modelName of modelNames) {
        schema += `Table: ${modelName}\n`;

        // Get column information dynamically from Prisma's DMMF
        const dmmf = Prisma.dmmf;
        const model = dmmf.datamodel.models.find(m =>
            m.name.toLowerCase() === modelName.toLowerCase()
        );

        if (model) {
            // Map Prisma types to SQL types
            const typeMap: Record<string, string> = {
                'Int': 'integer',
                'String': 'string',
                'Boolean': 'boolean',
                'DateTime': 'date',
                'Float': 'decimal',
                'Decimal': 'decimal'
            };

            // Extract column information
            const columnStrings = model.fields
                .filter(field => field.kind === 'scalar') // Only include scalar fields, not relations
                .map(field => {
                    const type = typeMap[field.type] || 'string';
                    return `${field.name} (${type})`;
                });

            schema += `Columns: ${columnStrings.join(', ')}\n\n`;
        }
    }

    // Add relationships
    schema += 'Relationships:\n';

    // Extract relationships dynamically from DMMF
    const relationships = [];
    const dmmf = Prisma.dmmf;

    for (const model of dmmf.datamodel.models) {
        const modelName = model.name.toLowerCase();

        // Find relation fields
        const relationFields = model.fields.filter(field => field.kind === 'object');

        for (const field of relationFields) {
            const targetModel = field.type.toLowerCase();
            const relationType = field.isList ? 'one-to-many' : 'many-to-one';

            relationships.push({
                source: modelName,
                target: targetModel,
                type: relationType,
                field: field.name
            });
        }
    }

    // Add relationship strings
    for (const rel of relationships) {
        const typeStr = rel.type === 'one-to-many' ? 'has many' : 'belongs to';
        schema += `- ${rel.source} ${typeStr} ${rel.target} (${rel.type} relationship via ${rel.field})\n`;
    }

    return schema;
};

/**
 * Interface for agent response
 */
export interface IAgentResponse {
    answer: string;
    sqlQuery?: string;
    queryResult?: Record<string, string>[];
    thoughts?: string[];
    error?: string | null;
}

/**
 * Interface for agent callbacks
 */
export interface IAgentCallbacks {
    onThought?: (thought: string) => void;
    onSqlQuery?: (sqlQuery: string) => void;
    onQueryResult?: (result: Record<string, string>[]) => void;
    onAnswer?: (answer: string) => void;
    onComplete?: () => void;
}



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
        async (input: { question: string }) => {
            return {
                schema,
                question: input.question
            };
        },
        // Then run the analyze chain
        async (input) => {
            const analysis = await analyzeChain.invoke(input);
            return {
                ...input,
                analysis
            };
        },
        // Then check confidence and generate SQL if confidence is high enough
        async (input) => {
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
        const { answerChain, agentChain } = createChains();

        // Step 1: Run the agent chain to analyze and generate SQL
        callbacks?.onThought?.("Analyzing your question...");

        // Run the agent chain
        const result = await agentChain.invoke({ question });

        // Send the analysis to the client
        callbacks?.onThought?.(result.analysis);

        // If confidence is too low, return early
        if (result.confidence < 0.4) {
            const response = "I need a specific question about customer data to help you. " +
                           "Please ask about customers, their orders, or addresses.";

            callbacks?.onAnswer?.(response);

            return {
                answer: response,
                thoughts: [result.analysis],
                error: null
            };
        }

        // Get the SQL query from the result
        const sqlQuery = result.sqlQuery;
        if (!sqlQuery) {
            throw new Error("Failed to generate SQL query");
        }

        // Send the SQL query to the client
        callbacks?.onThought?.("Generating SQL query...");
        callbacks?.onSqlQuery?.(sqlQuery);

        // Step 3: Execute SQL query
        callbacks?.onThought?.("Executing SQL query...");

        try {
            // Execute the query safely
            const queryResult = await executeSafeReadQuery<Record<string, string>[]>(sqlQuery);

            if (!queryResult.success) {
                throw new Error(queryResult.error);
            }

            callbacks?.onQueryResult?.(queryResult.data as Record<string, string>[]);

            // Step 4: Generate answer
            callbacks?.onThought?.("Generating answer...");
            const answer = await answerChain.invoke({
                question,
                sqlQuery,
                queryResult: safeStringify(queryResult.data as Record<string, string>[])
            });

            callbacks?.onAnswer?.(answer);

            return {
                answer,
                sqlQuery,
                queryResult: queryResult.data,
                thoughts: [result.analysis],
                error: null
            };
        } catch (err) {
            const error = err instanceof Error ? err.message : 'Unknown error executing query';
            callbacks?.onThought?.(`Error executing query: ${error}`);

            return {
                answer: `I encountered an error: ${error}`,
                sqlQuery,
                thoughts: [result.analysis],
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
    onQueryResult: (result: Record<string, string>[]) => void,
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
    streamingLangChainAgent,
    safeStringify,
    executeSafeReadQuery
};
