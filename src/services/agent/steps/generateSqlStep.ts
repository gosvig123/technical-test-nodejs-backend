/**
 * Step 2: Generate SQL query
 */
import { AgentState, AgentCallbacks, PipelineStep } from '../../../types/index.js';
import { sqlChain, schema } from '../utils/model.js';

export const generateSqlStep: PipelineStep = {
    name: 'generateSql',
    message: 'Generating SQL query...',
    execute: async (state: AgentState) => {
        const sqlQuery = await sqlChain.invoke({
            schema,
            question: state.question,
            analysis: state.analysis
        });

        // Sanitize SQL query
        const sanitizedQuery = sqlQuery.trim().replace(/;+$/, '');

        return { ...state, sqlQuery: sanitizedQuery };
    },
    onSuccess: (state: AgentState, callbacks: AgentCallbacks) => {
        if (state.sqlQuery) {
            callbacks.onSqlQuery(state.sqlQuery);
        }
        return true;
    }
};
