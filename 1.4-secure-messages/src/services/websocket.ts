import { WebSocketServer, WebSocket } from "ws";
import { WebSocketMessage } from "../types/messages";

interface ClientConnection {
    id: string;
    ws: WebSocket;
    publicKey: any;
}

const connectedClients = new Map<string, ClientConnection>();

export function initializeWebSocketHandler(wss: WebSocketServer) {
    wss.on("connection", (ws: WebSocket) => {
        console.log("New WebSocket connection");

        ws.on("message", (data: string) => {
            try {
                const message: WebSocketMessage = JSON.parse(data);
                handleWebSocketMessage(message, ws, wss);
            } catch (error) {
                console.error("Error parsing WebSocket message:", error);
            }
        });

        ws.on("close", () => {
            // Find and remove this client
            let clientId: string | null = null;
            for (const [id, client] of connectedClients.entries()) {
                if (client.ws === ws) {
                    clientId = id;
                    break;
                }
            }

            if (clientId) {
                connectedClients.delete(clientId);
                console.log(`Client ${clientId} disconnected`);

                // Notify other clients
                broadcastMessage(wss, {
                    type: "client-left",
                    clientId: clientId,
                });
            }
        });

        ws.on("error", (error) => {
            console.error("WebSocket error:", error);
        });
    });
}

function handleWebSocketMessage(message: WebSocketMessage, ws: WebSocket, wss: WebSocketServer) {
    switch (message.type) {
        case "register":
            handleClientRegistration(message, ws, wss);
            break;
        case "message":
            handleChatMessage(message, ws);
            break;
    }
}

function handleClientRegistration(
    message: Extract<WebSocketMessage, { type: "register" }>,
    ws: WebSocket,
    wss: WebSocketServer
) {
    const clientId = message.clientId;
    const publicKey = message.publicKey;

    console.log(`Client registered: ${clientId}`);

    // Store the client connection
    connectedClients.set(clientId, {
        id: clientId,
        ws: ws,
        publicKey: publicKey,
    });

    // Send list of all connected clients to the new client
    const clientsList = Array.from(connectedClients.values()).map((client) => ({
        id: client.id,
        publicKey: client.publicKey,
    }));

    ws.send(
        JSON.stringify({
            type: "clients-list",
            clients: clientsList,
        })
    );

    // Notify all other clients that a new client joined
    broadcastMessage(wss, {
        type: "client-joined",
        clientId: clientId,
        publicKey: publicKey,
    });
}

function handleChatMessage(
    message: Extract<WebSocketMessage, { type: "message" }>,
    ws: WebSocket
) {
    const recipientClient = connectedClients.get(message.to);

    if (recipientClient) {
        // Forward the encrypted message to the recipient
        recipientClient.ws.send(
            JSON.stringify({
                type: "message",
                from: message.from,
                to: message.to,
                encrypted: message.encrypted,
                timestamp: message.timestamp,
            })
        );
        console.log(`Message forwarded from ${message.from} to ${message.to}`);
    } else {
        console.log(`Recipient ${message.to} not found`);
        // Optionally send an error back to sender
        ws.send(
            JSON.stringify({
                type: "error",
                message: "Recipient not found",
            })
        );
    }
}

function broadcastMessage(wss: WebSocketServer, message: any) {
    const messageStr = JSON.stringify(message);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(messageStr);
        }
    });
}
