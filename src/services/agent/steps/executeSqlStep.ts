/**
 * Step 3: Execute SQL query
 */
import { AgentState, AgentCallbacks, PipelineStep } from '../../../types/index.js';
import { executeSafeReadQuery } from '../sqlExecutor.js';

export const executeSqlStep: PipelineStep = {
    name: 'executeSql',
    message: 'Executing SQL query...',
    execute: async (state: AgentState) => {
        if (!state.sqlQuery) {
            throw new Error('No SQL query to execute');
        }

        const result = await executeSafeReadQuery<Record<string, string>[]>(state.sqlQuery);

        if (!result.success) {
            throw new Error(result.error);
        }

        return { ...state, queryResult: result.data as Record<string, string>[] };
    },
    onSuccess: (state: AgentState, callbacks: AgentCallbacks) => {
        if (state.queryResult) {
            callbacks.onQueryResult(state.queryResult);
        }
        return true;
    }
};
