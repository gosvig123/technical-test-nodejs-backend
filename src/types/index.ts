/**
 * This file contains all the type definitions used throughout the application
 */

import { Prisma } from '../../generated/prisma/index.js';

// ===== SQL Executor Types =====

/**
 * SQL query result
 */
export interface SqlQueryResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    query?: string;
}

/**
 * SQL query validation result
 */
export interface SqlValidationResult {
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
 * Interface for agent state
 */
export interface AgentState {
    question: string;
    analysis?: string;
    confidence?: number;
    shouldContinue?: boolean;
    sqlQuery?: string;
    queryResult?: Record<string, string>[];
    answer?: string;
}

/**
 * Interface for agent callbacks
 *
 * This interface defines the callbacks used to stream the agent's progress
 * to the client. Each callback is called at a specific point in the pipeline:
 * - onThought: When the agent is thinking/analyzing
 * - onSqlQuery: When the agent generates an SQL query
 * - onQueryResult: When the agent gets results from the database
 * - onAnswer: When the agent generates the final answer
 * - onComplete: When the agent completes the process
 */
export interface AgentCallbacks {
    onThought: ThoughtCallback;
    onSqlQuery: SqlQueryCallback;
    onQueryResult: QueryResultCallback;
    onAnswer: AnswerCallback;
    onComplete: CompleteCallback;
}

/**
 * Interface for a pipeline step
 */
export interface PipelineStep {
    name: string;
    message: string;
    execute: (state: AgentState) => Promise<AgentState>;
    onSuccess: (state: AgentState, callbacks: AgentCallbacks) => boolean;
}

// ===== Socket Types =====

/**
 * Socket question event data
 */
export interface SocketQuestionData {
    query: string;
}

/**
 * Socket thought event data
 */
export interface SocketThoughtData {
    thought: string;
}

/**
 * Socket SQL query event data
 */
export interface SocketSqlQueryData {
    sqlQuery: string;
}

/**
 * Socket query result event data
 */
export interface SocketQueryResultData {
    result: Record<string, string>[];
}

/**
 * Socket answer chunk event data
 */
export interface SocketAnswerChunkData {
    chunk: string;
}

/**
 * Socket error event data
 */
export interface SocketErrorData {
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
export type Order = Prisma.orderGetPayload<{}>;

/**
 * Customer with related data
 */
export type CustomerWithRelations = Prisma.customerGetPayload<{
    include: {
        address: true;
        orders: true;
    }
}>;

