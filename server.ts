import express from "express";
import { WebSocketServer } from "ws";
import { handleWebSocketConnection } from "./src/streaming/handler";

const app = express();
const PORT = 8080;

// Create an HTTP server with WebSocket support
const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
    console.log("Client connected");
    handleWebSocketConnection(ws);
});
