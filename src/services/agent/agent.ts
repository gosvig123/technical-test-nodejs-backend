
import {
    ThoughtCallback,
    SqlQueryCallback,
    QueryResultCallback,
    AnswerCallback,
    CompleteCallback,
    AgentState,
    AgentCallbacks,
    PipelineStep
} from '../../types/index.js';
// AgentStep is used in the step files
import { analyzeStep } from './steps/analyzeStep.js';
import { generateSqlStep } from './steps/generateSqlStep.js';
import { executeSqlStep } from './steps/executeSqlStep.js';
import { generateAnswerStep } from './steps/generateAnswerStep.js';

/**
 * Process a question through the pipeline using LangChain for LLM integration
 * Generates SQL queries from natural language and streams results in real-time
 */
export const runAgent = async (
    question: string,
    onThought: ThoughtCallback,
    onSqlQuery: SqlQueryCallback,
    onQueryResult: QueryResultCallback,
    onAnswer: AnswerCallback,
    onComplete: CompleteCallback
): Promise<void> => {
    const callbacks: AgentCallbacks = {
        onThought,
        onSqlQuery,
        onQueryResult,
        onAnswer,
        onComplete
    };


    const pipeline: PipelineStep[] = [
        analyzeStep,
        generateSqlStep,
        executeSqlStep,
        generateAnswerStep
    ];

    try {

        let state: AgentState = { question };


        for (const step of pipeline) {
            try {

                callbacks.onThought(step.message);


                state = await step.execute(state);


                const shouldContinue = step.onSuccess(state, callbacks);
                if (!shouldContinue) break;

            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                callbacks.onThought(`Error in ${step.name}: ${errorMsg}`);
                callbacks.onAnswer(`I encountered an error: ${errorMsg}`);
                return;
            }
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        callbacks.onThought(`Error: ${errorMsg}`);
        callbacks.onAnswer('I encountered an error while processing your question.');
    } finally {
        callbacks.onComplete();
    }
};
