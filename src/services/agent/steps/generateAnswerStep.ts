
import { AgentState, AgentCallbacks, PipelineStep } from '../../../types/index.js';
import { answerChain } from '../utils/modelConfig.js';
import { stringifyWithBigInt } from '../../../utils/stringUtils.js';

export const generateAnswerStep: PipelineStep = {
    name: 'generateAnswer',
    message: 'Generating answer...',
    execute: async (state: AgentState) => {
        if (!state.sqlQuery || !state.queryResult) {
            throw new Error('Missing SQL query or query results');
        }

        const answer = await answerChain.invoke({
            question: state.question,
            sqlQuery: state.sqlQuery,
            queryResult: stringifyWithBigInt(state.queryResult)
        });

        return { ...state, answer };
    },
    onSuccess: (state: AgentState, callbacks: AgentCallbacks) => {
        if (state.answer) {
            callbacks.onAnswer(state.answer);
        }
        return true;
    }
};
