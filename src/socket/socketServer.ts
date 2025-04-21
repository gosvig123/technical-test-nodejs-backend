import { Server, Socket } from 'socket.io';
import { streamingLangChainAgent } from '../agent/agent.js';
import { SqlService } from '../services/sql/sqlService.js';

/**
 * Sets up the Socket.io server with event handlers
 */
export const setupSocketServer = (io: Server): void => {
    // Connection event handler
    io.on('connection', (socket: Socket) => {
        console.log(`Client connected: ${socket.id}`);

        // Handle question event using the LLM-powered agent
        socket.on('question', async (data: { query: string }) => {
            if (!data || !data.query) {
                socket.emit('error', { message: 'Query is required' });
                return;
            }

            console.log(`Received question from ${socket.id}: ${data.query}`);

            try {
                await streamingLangChainAgent(
                    data.query,
                    (thought) => socket.emit('thought', { thought }),
                    (sqlQuery) => socket.emit('sqlQuery', { sqlQuery }),
                    (result) => socket.emit('queryResult', { 
                        result: JSON.parse(SqlService.safeStringify(result)) 
                    }),
                    (answer) => socket.emit('answerChunk', { chunk: answer }),
                    () => socket.emit('answerComplete')
                );
            } catch (error) {
                console.error('Error processing question:', error);
                socket.emit('error', { message: 'Error processing your question' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
};

