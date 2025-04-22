import { Server, Socket } from 'socket.io';
import { runAgent } from '../services/agent/agent.js';
import { stringifyWithBigInt } from '../utils/stringUtils.js';
import { SocketQuestionData } from '../types/index.js';
import { config } from '../config/index.js';
import { AgentStep } from '../constants/agentSteps.js';


export const setupSocketServer = (io: Server): void => {
    // Middleware for authentication
    io.use((socket, next) => {
        const apiKey = socket.handshake.auth.apiKey || socket.handshake.query.apiKey;

        if (!apiKey || apiKey !== config.api.key) {
            return next(new Error('Authentication error: Invalid API key'));
        }

        next();
    });

    // Connection event handler
    io.on('connection', (socket: Socket) => {
        console.log(`Client connected: ${socket.id}`);

        // Handle question event using the LangChain-powered agent
        socket.on(AgentStep.QUESTION, async (data: SocketQuestionData) => {
            if (!data || !data.query) {
                socket.emit(AgentStep.ERROR, { message: 'Query is required' });
                return;
            }

            try {
                await runAgent(
                    data.query,

                    (thought) => socket.emit(AgentStep.THOUGHT, { thought }),
                    (sqlQuery) => socket.emit(AgentStep.SQL_QUERY, { sqlQuery }),
                    (result) => socket.emit(AgentStep.QUERY_RESULT, {
                        result: JSON.parse(stringifyWithBigInt(result))
                    }),
                    (answer) => socket.emit(AgentStep.ANSWER_CHUNK, { chunk: answer }),
                    () => socket.emit(AgentStep.ANSWER_COMPLETE)
                );
            } catch (error) {
                console.error('Error processing question:', error);
                socket.emit(AgentStep.ERROR, { message: 'Error processing your question' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
};

