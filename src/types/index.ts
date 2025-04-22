import { Prisma } from '../../generated/prisma/index.js';

// SQL Executor Types
export interface SqlQueryResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    query?: string;
}

export interface SqlValidationResult {
    isValid: boolean;
    error?: string;
}

// Agent Types
export type ThoughtCallback = (thought: string) => void;
export type SqlQueryCallback = (sqlQuery: string) => void;
export type QueryResultCallback = (result: Record<string, string>[]) => void;
export type AnswerCallback = (answer: string) => void;
export type CompleteCallback = () => void;

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
 * Interface for agent callbacks used to stream the agent's progress
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

export interface PipelineStep {
    name: string;
    message: string;
    execute: (state: AgentState) => Promise<AgentState>;
    onSuccess: (state: AgentState, callbacks: AgentCallbacks) => boolean;
}

// Socket Types
export interface SocketQuestionData {
    query: string;
}

export interface SocketThoughtData {
    thought: string;
}

export interface SocketSqlQueryData {
    sqlQuery: string;
}

export interface SocketQueryResultData {
    result: Record<string, string>[];
}

export interface SocketAnswerChunkData {
    chunk: string;
}

export interface SocketErrorData {
    message: string;
}

// Database Types
export type Customer = Prisma.customerGetPayload<{}>;
export type Address = Prisma.addressGetPayload<{}>;
export type Order = Prisma.orderGetPayload<{}>;

export type CustomerWithRelations = Prisma.customerGetPayload<{
    include: {
        address: true;
        orders: true;
    }
}>;
