/**
 * Step 1: Analyze the question
 */
import { AgentState, AgentCallbacks, PipelineStep } from '../../../types/index.js';
import { analyzeChain, schema } from '../utils/model.js';
import { config } from '../../../config/index.js';

export const analyzeStep: PipelineStep = {
    name: 'analyze',
    message: 'Analyzing your question...',
    execute: async (state: AgentState) => {
        const analysis = await analyzeChain.invoke({
            schema,
            question: state.question
        });

        // Extract confidence score
        const confidenceMatch = analysis.match(/\[CONFIDENCE: (0\.\d+)\]/);
        const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0;

        return {
            ...state,
            analysis,
            confidence,
            shouldContinue: confidence >= config.agent.confidenceThreshold
        };
    },
    onSuccess: (state: AgentState, callbacks: AgentCallbacks) => {
        if (state.analysis) {
            callbacks.onThought(state.analysis);
        }
        if (!state.shouldContinue) {
            callbacks.onAnswer("I need a specific question about customer data to help you. " +
                             "Please ask about customers, their orders, or addresses.");
        }
        return state.shouldContinue || false;
    }
};
