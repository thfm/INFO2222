/**
 * End-to-end encryption utilities for the browser
 */

/**
 * Generate an RSA key pair for this client
 */
async function generateKeyPair() {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true, // extractable
        ["encrypt", "decrypt"]
    );

    return {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
    };
}

/**
 * Export public key to JSON for transmission
 */
async function exportPublicKey(publicKey) {
    const exported = await window.crypto.subtle.exportKey("jwk", publicKey);
    return {
        type: "RSA-OAEP",
        exported,
    };
}

/**
 * Import a public key from JSON
 */
async function importPublicKey(serialized) {
    return await window.crypto.subtle.importKey(
        "jwk",
        serialized.exported,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        ["encrypt"]
    );
}

/**
 * Encrypt a message with a public key
 */
async function encryptMessage(message, publicKey, senderPublicKey) {
    const encoder = new TextEncoder();
    const messageData = encoder.encode(message);

    const ciphertext = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        messageData
    );

    // Convert ciphertext to base64 for transmission
    const ciphertextArray = new Uint8Array(ciphertext);
    const ciphertextBase64 = btoa(String.fromCharCode(...ciphertextArray));

    const senderPublicKeySerialized = await exportPublicKey(senderPublicKey);

    return {
        ciphertext: ciphertextBase64,
        iv: "",
        senderPublicKey: senderPublicKeySerialized,
    };
}

/**
 * Decrypt a message with private key
 */
async function decryptMessage(encrypted, privateKey) {
    // Convert base64 back to Uint8Array
    const binaryString = atob(encrypted.ciphertext);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const decrypted = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        bytes.buffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

/**
 * Get sender's public key from encrypted message
 */
async function getSenderPublicKey(encrypted) {
    return await importPublicKey(encrypted.senderPublicKey);
}
