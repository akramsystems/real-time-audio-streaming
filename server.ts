import express from "express";
import { WebSocketServer } from "ws";
import { createWebSocketHandler } from "./src/streaming/handler";

const app = express();
const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
    console.log("Client connected");
    createWebSocketHandler(ws);
});
