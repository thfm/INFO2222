/**
 * Message types for WebSocket communication
 */

export interface SerializedPublicKey {
    type: string;
    exported: JsonWebKey;
}

export interface EncryptedMessage {
    ciphertext: string;
    iv: string;
    senderPublicKey: SerializedPublicKey;
}

export type WebSocketMessage =
    | {
        type: "register";
        clientId: string;
        publicKey: SerializedPublicKey;
    }
    | {
        type: "clients-list";
        clients: Array<{
            id: string;
            publicKey: SerializedPublicKey;
        }>;
    }
    | {
        type: "message";
        from: string;
        to: string;
        encrypted: EncryptedMessage;
        timestamp: number;
    }
    | {
        type: "client-joined";
        clientId: string;
        publicKey: SerializedPublicKey;
    }
    | {
        type: "client-left";
        clientId: string;
    };
