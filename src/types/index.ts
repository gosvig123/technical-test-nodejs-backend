/**
 * This file contains all the type definitions used throughout the application
 */

import { Prisma } from '../../generated/prisma/index.js';

// ===== SQL Executor Types =====

/**
 * Interface for SQL query result
 */
export interface ISqlQueryResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    query?: string;
}

/**
 * Interface for SQL query validation result
 */
export interface ISqlValidationResult {
    isValid: boolean;
    error?: string;
}

// ===== Agent Types =====

/**
 * Callback function for agent thoughts/reasoning
 */
export type ThoughtCallback = (thought: string) => void;

/**
 * Callback function for SQL queries
 */
export type SqlQueryCallback = (sqlQuery: string) => void;

/**
 * Callback function for query results
 */
export type QueryResultCallback = (result: Record<string, string>[]) => void;

/**
 * Callback function for final answers
 */
export type AnswerCallback = (answer: string) => void;

/**
 * Callback function for completion
 */
export type CompleteCallback = () => void;

/**
 * Agent input for question analysis
 */
export interface IAgentQuestionInput {
    question: string;
}

/**
 * Agent input with schema information
 */
export interface IAgentSchemaInput extends IAgentQuestionInput {
    schema: string;
}

/**
 * Agent input with analysis
 */
export interface IAgentAnalysisInput extends IAgentSchemaInput {
    analysis: string;
}

/**
 * Agent input with SQL query
 */
export interface IAgentSqlInput extends IAgentAnalysisInput {
    confidence: number;
    sqlQuery: string | null;
}

/**
 * Agent input for answer generation
 */
export interface IAgentAnswerInput {
    question: string;
    sqlQuery: string;
    queryResult: string;
}

/**
 * Agent chain result
 */
export interface IAgentChainResult extends IAgentSqlInput {}

// ===== Socket Types =====

/**
 * Socket question event data
 */
export interface ISocketQuestionData {
    query: string;
}

/**
 * Socket thought event data
 */
export interface ISocketThoughtData {
    thought: string;
}

/**
 * Socket SQL query event data
 */
export interface ISocketSqlQueryData {
    sqlQuery: string;
}

/**
 * Socket query result event data
 */
export interface ISocketQueryResultData {
    result: Record<string, any>[];
}

/**
 * Socket answer chunk event data
 */
export interface ISocketAnswerChunkData {
    chunk: string;
}

/**
 * Socket error event data
 */
export interface ISocketErrorData {
    message: string;
}

// ===== Database Types =====

/**
 * Customer model type from Prisma
 */
export type Customer = Prisma.customerGetPayload<{}>;

/**
 * Address model type from Prisma
 */
export type Address = Prisma.addressGetPayload<{}>;

/**
 * Order model type from Prisma
 */
export type Order = Prisma.ordersGetPayload<{}>;

/**
 * Customer with related data
 */
export type CustomerWithRelations = Prisma.customerGetPayload<{
    include: {
        address: true;
        orders: true;
    }
}>;
