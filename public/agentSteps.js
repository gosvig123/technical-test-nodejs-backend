/**
 * Client-side constants for agent steps and socket event types
 * These should match the server-side constants in src/constants/agentSteps.ts
 */
const AgentStep = {
  // Socket events for client-server communication
  QUESTION: 'question',
  THOUGHT: 'thought',
  SQL_QUERY: 'sqlQuery',
  QUERY_RESULT: 'queryResult',
  ANSWER_CHUNK: 'answerChunk',
  ANSWER_COMPLETE: 'answerComplete',
  ERROR: 'error',
  
  // Status messages
  CONNECTED: 'Connected to server',
  DISCONNECTED: 'Disconnected from server',
  PROCESSING: 'Processing question...',
  COMPLETED: 'Query completed'
};
