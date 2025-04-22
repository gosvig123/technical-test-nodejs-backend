
import { AgentState, AgentCallbacks, PipelineStep } from '../../../types/index.js';
import prisma from '../../../connector/index.js';
import { AgentStep, StepMessage } from '../../../constants/agentSteps.js';

export const executeSqlStep: PipelineStep = {
    name: AgentStep.EXECUTE_SQL,
    message: StepMessage[AgentStep.EXECUTE_SQL],
    execute: async (state: AgentState) => {
        if (!state.sqlQuery) {
            throw new Error('No SQL query to execute');
        }

        const query = state.sqlQuery.trim();

        try {
            // Execute the query directly with Prisma
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
