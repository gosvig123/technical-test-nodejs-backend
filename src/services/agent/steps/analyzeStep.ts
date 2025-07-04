
import { AgentState, AgentCallbacks, PipelineStep } from '../../../types/index.js';
import { analyzeChain, dbSchema } from '../utils/modelConfig.js';
import { config } from '../../../config/index.js';
import { AgentStep, StepMessage } from '../../../constants/agentSteps.js';

export const analyzeStep: PipelineStep = {
    name: AgentStep.ANALYZE,
    message: StepMessage[AgentStep.ANALYZE],
    execute: async (state: AgentState) => {
        const analysis = await analyzeChain.invoke({
            schema: dbSchema,
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
