
import express from 'express';
import dotenv from 'dotenv';
import router from './router.js';
import http from 'http';
import { Server } from 'socket.io';
import { setupSocketServer } from './socket/socketServer.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io server
const io = new Server(server, {
    cors: {
        origin: '*', // In production, you should restrict this to specific origins
        methods: ['GET', 'POST']
    }
});

// Setup Socket.io event handlers
setupSocketServer(io);

app.use(express.json());
app.use(router);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Socket.io server is available at ws://localhost:${port}`);
});
