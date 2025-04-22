
import { AgentState, AgentCallbacks, PipelineStep } from '../../../types/index.js';
import { sqlChain, dbSchema } from '../utils/modelConfig.js';
import { AgentStep, StepMessage } from '../../../constants/agentSteps.js';

export const generateSqlStep: PipelineStep = {
    name: AgentStep.GENERATE_SQL,
    message: StepMessage[AgentStep.GENERATE_SQL],
    execute: async (state: AgentState) => {
        const sqlQuery = await sqlChain.invoke({
            schema: dbSchema,
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
