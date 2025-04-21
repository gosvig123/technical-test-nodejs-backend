import { Server, Socket } from 'socket.io';
import { streamingLangChainAgent } from '../agent/agent.js';

// Define interface for socket authentication
interface AuthenticatedSocket extends Socket {
    isAuthenticated?: boolean;
}

/**
 * Authenticates a socket connection using the API key
 * @param socket The socket connection to authenticate
 * @returns True if authenticated, false otherwise
 */
const authenticateSocket = (socket: AuthenticatedSocket): boolean => {
    const apiKey = socket.handshake.auth.apiKey || socket.handshake.query.apiKey;

    if (!apiKey || apiKey !== process.env.API_KEY) {
        console.log('Socket authentication failed');
        socket.emit('error', { message: 'Authentication failed. Valid API key required.' });
        socket.disconnect(true);
        return false;
    }

    socket.isAuthenticated = true;
    return true;
};

/**
 * Sets up the Socket.io server with event handlers
 * @param io The Socket.io server instance
 */
export const setupSocketServer = (io: Server): void => {
    // Middleware for authentication
    io.use((socket: AuthenticatedSocket, next) => {
        if (authenticateSocket(socket)) {
            next();
        } else {
            next(new Error('Authentication failed'));
        }
    });

    // Connection event handler
    io.on('connection', (socket: AuthenticatedSocket) => {
        console.log(`Client connected: ${socket.id}`);



        // Handle question event using the LLM-powered agent
        socket.on('question', async (data: { query: string }) => {
            if (!socket.isAuthenticated) {
                socket.emit('error', { message: 'Not authenticated' });
                return;
            }

            if (!data || !data.query) {
                socket.emit('error', { message: 'Query is required' });
                return;
            }

            console.log(`Received question from ${socket.id}: ${data.query}`);

            // Stream the response to the client using the LLM agent
            streamingLangChainAgent(
                data.query,
                // Callback for thoughts/reasoning
                (thought: string) => {
                    socket.emit('thought', { thought });
                    socket.emit('answerChunk', { chunk: thought });
                },
                // Callback for SQL query
                (sqlQuery: string) => {
                    socket.emit('sqlQuery', { sqlQuery });
                },
                // Callback for query result
                (result: any) => {
                    socket.emit('queryResult', { result });
                },
                // Callback for final answer
                (answer: string) => {
                    socket.emit('answer', { answer });
                    socket.emit('answerChunk', { chunk: `\n\nFinal Answer: ${answer}` });
                },
                // Callback for completion
                () => {
                    socket.emit('answerComplete');
                }
            );
        });

        // Disconnection event handler
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });

        // Error event handler
        socket.on('error', (error) => {
            console.error(`Socket error for ${socket.id}:`, error);
        });
    });
};
