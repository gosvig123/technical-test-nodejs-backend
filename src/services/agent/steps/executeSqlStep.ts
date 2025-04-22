/**
 * Step 3: Execute SQL query
 * Uses Prisma for SQL execution with minimal validation
 */
import { AgentState, AgentCallbacks, PipelineStep } from '../../../types/index.js';
import prisma from '../../../db/index.js';

export const executeSqlStep: PipelineStep = {
    name: 'executeSql',
    message: 'Executing SQL query...',
    execute: async (state: AgentState) => {
        if (!state.sqlQuery) {
            throw new Error('No SQL query to execute');
        }

        const query = state.sqlQuery.trim();

        try {
            // Execute the query directly with Prisma
            // The result will be cast to the expected type in the AgentState
            const result = await prisma.$queryRawUnsafe(query) as Record<string, string>[];

            // Return the result with the correct type
            return { ...state, queryResult: result };
        } catch (error) {
            // Log the error for debugging
            const errorMsg = error instanceof Error ? error.message : 'Unknown error executing query';
            console.error('SQL execution error:', errorMsg);
            console.error('Query attempted:', query);

            throw new Error(`SQL execution error: ${errorMsg}`);
        }
    },
    onSuccess: (state: AgentState, callbacks: AgentCallbacks) => {
        if (state.queryResult) {
            callbacks.onQueryResult(state.queryResult);
        }
        return true;
    }
};
