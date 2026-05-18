/**
 * Chat application with end-to-end encryption
 */

class ChatClient {
    constructor(windowNumber) {
        this.windowNumber = windowNumber;
        this.clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.keyPair = null;
        this.ws = null;
        this.connectedClients = new Map(); // clientId -> publicKey
        this.messagesCount = 0;

        // DOM elements
        this.clientIdEl = document.getElementById(`clientId${windowNumber}`);
        this.statusEl = document.getElementById(`status${windowNumber}`);
        this.messagesEl = document.getElementById(`messages${windowNumber}`);
        this.inputEl = document.getElementById(`input${windowNumber}`);
        this.sendBtn = document.getElementById(`send${windowNumber}`);
        this.clientsListEl = document.getElementById(`clientsList${windowNumber}`);

        this.init();
    }

    async init() {
        try {
            // Generate encryption keys
            this.keyPair = await generateKeyPair();
            this.clientIdEl.textContent = this.clientId.substr(0, 20) + "...";

            // Connect to WebSocket
            this.connect();

            // Setup event listeners
            this.sendBtn.addEventListener("click", () => this.sendMessage());
            this.inputEl.addEventListener("keypress", (e) => {
                if (e.key === "Enter") this.sendMessage();
            });
        } catch (error) {
            console.error("Initialization error:", error);
            this.updateStatus("Error initializing", "disconnected");
        }
    }

    connect() {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const url = `${protocol}//${window.location.host}/ws`;

        this.ws = new WebSocket(url);

        this.ws.onopen = async () => {
            console.log(`Chat ${this.windowNumber}: Connected to server`);
            this.updateStatus("Connected", "connected");
            this.inputEl.disabled = false;
            this.sendBtn.disabled = false;

            // Send registration message with public key
            const publicKeySerialized = await exportPublicKey(this.keyPair.publicKey);
            this.ws.send(
                JSON.stringify({
                    type: "register",
                    clientId: this.clientId,
                    publicKey: publicKeySerialized,
                })
            );
        };

        this.ws.onmessage = async (event) => {
            try {
                const message = JSON.parse(event.data);
                await this.handleMessage(message);
            } catch (error) {
                console.error("Error handling message:", error);
            }
        };

        this.ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            this.updateStatus("Connection error", "disconnected");
        };

        this.ws.onclose = () => {
            console.log(`Chat ${this.windowNumber}: Disconnected`);
            this.updateStatus("Disconnected", "disconnected");
            this.inputEl.disabled = true;
            this.sendBtn.disabled = true;
            this.connectedClients.clear();
            this.updateClientsList();

            // Try to reconnect after 3 seconds
            setTimeout(() => this.connect(), 3000);
        };
    }

    async handleMessage(message) {
        switch (message.type) {
            case "clients-list":
                this.handleClientsList(message.clients);
                break;
            case "client-joined":
                this.handleClientJoined(message);
                break;
            case "client-left":
                this.handleClientLeft(message);
                break;
            case "message":
                await this.handleIncomingMessage(message);
                break;
        }
    }

    handleClientsList(clients) {
        this.connectedClients.clear();
        for (const client of clients) {
            if (client.id !== this.clientId) {
                importPublicKey(client.publicKey).then((key) => {
                    this.connectedClients.set(client.id, key);
                });
            }
        }
        this.updateClientsList();
    }

    async handleClientJoined(message) {
        if (message.clientId !== this.clientId) {
            const publicKey = await importPublicKey(message.publicKey);
            this.connectedClients.set(message.clientId, publicKey);
            this.updateClientsList();
        }
    }

    handleClientLeft(message) {
        this.connectedClients.delete(message.clientId);
        this.updateClientsList();
    }

    async handleIncomingMessage(message) {
        try {
            // Decrypt the message
            const decryptedText = await decryptMessage(message.encrypted, this.keyPair.privateKey);

            this.addMessageToUI(decryptedText, "received", message.from);
        } catch (error) {
            console.error("Error decrypting message:", error);
            this.addMessageToUI("[Failed to decrypt message]", "received", message.from);
        }
    }

    async sendMessage() {
        const text = this.inputEl.value.trim();
        if (!text) return;

        if (this.connectedClients.size === 0) {
            alert("No other clients connected");
            return;
        }

        try {
            // Send to all connected clients
            for (const [clientId, publicKey] of this.connectedClients) {
                const encrypted = await encryptMessage(
                    text,
                    publicKey,
                    this.keyPair.publicKey
                );

                this.ws.send(
                    JSON.stringify({
                        type: "message",
                        from: this.clientId,
                        to: clientId,
                        encrypted: encrypted,
                        timestamp: Date.now(),
                    })
                );
            }

            this.addMessageToUI(text, "sent");
            this.inputEl.value = "";
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Error sending message");
        }
    }

    addMessageToUI(text, type, fromClientId = null) {
        if (this.messagesEl.querySelector(".empty-state")) {
            this.messagesEl.innerHTML = "";
        }

        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${type}`;

        const time = new Date().toLocaleTimeString();
        const shortFromId = fromClientId ? fromClientId.substr(0, 12) + "..." : "You";

        messageDiv.innerHTML = `
            <div>
                <div class="message-bubble">${escapeHtml(text)}</div>
                <div class="message-time">${type === "sent" ? time : `${shortFromId} - ${time}`}</div>
            </div>
        `;

        this.messagesEl.appendChild(messageDiv);
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
        this.messagesCount++;
    }

    updateStatus(text, status) {
        this.statusEl.textContent = text;
        this.statusEl.className = `status ${status}`;
    }

    updateClientsList() {
        this.clientsListEl.innerHTML = `<strong>Connected (${this.connectedClients.size}):</strong>`;
        for (const clientId of this.connectedClients.keys()) {
            const clientItem = document.createElement("div");
            clientItem.className = "client-item";
            clientItem.textContent = clientId.substr(0, 16) + "...";
            this.clientsListEl.appendChild(clientItem);
        }
    }
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Initialize both chat clients when page loads
document.addEventListener("DOMContentLoaded", () => {
    new ChatClient(1);
    new ChatClient(2);
});
