/**
 * Main agent implementation file
 * This file orchestrates the pipeline steps and handles the agent execution
 */
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
import { analyzeStep } from './steps/analyzeStep.js';
import { generateSqlStep } from './steps/generateSqlStep.js';
import { executeSqlStep } from './steps/executeSqlStep.js';
import { generateAnswerStep } from './steps/generateAnswerStep.js';

/**
 * Create the agent pipeline steps
 */
const createPipeline = (): PipelineStep[] => [
    analyzeStep,
    generateSqlStep,
    executeSqlStep,
    generateAnswerStep
];

/**
 * Process a question through the pipeline
 *
 * This function implements the core agent logic required by the project:
 * 1. Uses LangChain for LLM integration (via the chains defined above)
 * 2. Processes natural language questions about customer data
 * 3. Generates and executes SQL queries against the database
 * 4. Streams results in real-time through callbacks
 * 5. Handles errors gracefully at each step
 *
 * @param question The natural language question
 * @param onThought Callback for thoughts/reasoning
 * @param onSqlQuery Callback for the generated SQL query
 * @param onQueryResult Callback for the query result
 * @param onAnswer Callback for the final answer
 * @param onComplete Callback when the streaming is complete
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
    const pipeline = createPipeline();

    try {
        // Initialize state with the question
        let state: AgentState = { question };

        // Process each step in the pipeline
        for (const step of pipeline) {
            try {
                // Announce the current step
                callbacks.onThought(step.message);

                // Execute the step
                state = await step.execute(state);

                // Process the result
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

// Export runAgent as streamingLangChainAgent for backward compatibility
export const streamingLangChainAgent = runAgent;
