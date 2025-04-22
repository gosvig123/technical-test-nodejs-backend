import { Server, Socket } from 'socket.io';
import { streamingLangChainAgent } from '../services/agent/agent.js';
import { safeStringify } from '../services/agent/sqlExecutor.js';
import {
    ISocketQuestionData,
    ISocketThoughtData,
    ISocketSqlQueryData,
    ISocketQueryResultData,
    ISocketAnswerChunkData,
    ISocketErrorData
} from '../types/index.js';

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
                socket.emit('error', { message: 'Query is required' } as ISocketErrorData);
                return;
            }

            try {
                await streamingLangChainAgent(
                    data.query,
                    (thought) => socket.emit('thought', { thought } as ISocketThoughtData),
                    (sqlQuery) => socket.emit('sqlQuery', { sqlQuery } as ISocketSqlQueryData),
                    (result) => socket.emit('queryResult', {
                        result: JSON.parse(safeStringify(result))
                    } as ISocketQueryResultData),
                    (answer) => socket.emit('answerChunk', { chunk: answer } as ISocketAnswerChunkData),
                    () => socket.emit('answerComplete')
                );
            } catch (error) {
                console.error('Error processing question:', error);
                socket.emit('error', { message: 'Error processing your question' } as ISocketErrorData);
            }
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
};

