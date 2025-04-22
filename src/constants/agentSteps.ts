/**
 * Enum for agent steps and socket event types
 * These constants are used throughout the application to ensure consistency
 * between server and client code.
 */
export enum AgentStep {
  // Socket events for client-server communication
  QUESTION = 'question',
  THOUGHT = 'thought',
  SQL_QUERY = 'sqlQuery',
  QUERY_RESULT = 'queryResult',
  ANSWER_CHUNK = 'answerChunk',
  ANSWER_COMPLETE = 'answerComplete',
  ERROR = 'error',
  
  // Pipeline step names
  ANALYZE = 'analyze',
  GENERATE_SQL = 'generateSql',
  EXECUTE_SQL = 'executeSql',
  GENERATE_ANSWER = 'generateAnswer',
  
  // Status messages
  CONNECTED = 'Connected to server',
  DISCONNECTED = 'Disconnected from server',
  PROCESSING = 'Processing question...',
  COMPLETED = 'Query completed'
}

/**
 * Step messages displayed to the user during the agent process
 */
export const StepMessage = {
  [AgentStep.ANALYZE]: 'Analyzing your question...',
  [AgentStep.GENERATE_SQL]: 'Generating SQL query...',
  [AgentStep.EXECUTE_SQL]: 'Executing SQL query...',
  [AgentStep.GENERATE_ANSWER]: 'Generating answer...'
};
