import { Server, Socket } from 'socket.io';
import { runAgent } from '../services/agent/agent.js';
import { safeStringify } from '../utils/stringUtils.js';
import { ISocketQuestionData } from '../types/index.js';

/**
 * Sets up the Socket.io server with event handlers
 */
export const setupSocketServer = (io: Server): void => {
    // Connection event handler
    io.on('connection', (socket: Socket) => {
        console.log(`Client connected: ${socket.id}`);

        // Handle question event using the LangChain-powered agent
        socket.on('question', async (data: ISocketQuestionData) => {
            if (!data || !data.query) {
                socket.emit('error', { message: 'Query is required' });
                return;
            }

            try {
                await runAgent(
                    data.query,
                    // Simplified callbacks without unnecessary type assertions
                    (thought) => socket.emit('thought', { thought }),
                    (sqlQuery) => socket.emit('sqlQuery', { sqlQuery }),
                    (result) => socket.emit('queryResult', {
                        result: JSON.parse(safeStringify(result))
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

