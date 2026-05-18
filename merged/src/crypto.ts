export interface SerializedPublicKey {
  type: 'RSA-OAEP';
  exported: JsonWebKey;
}

export interface EncryptedMessage {
  ciphertext: string;
  iv: string;
  wrappedKey: string;
  senderPublicKey: SerializedPublicKey;
}

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export async function generateKeyPair(): Promise<KeyPair> {
  return window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt'],
  );
}

export async function exportPublicKey(publicKey: CryptoKey): Promise<SerializedPublicKey> {
  return {
    type: 'RSA-OAEP',
    exported: await window.crypto.subtle.exportKey('jwk', publicKey),
  };
}

export async function importPublicKey(serialized: SerializedPublicKey): Promise<CryptoKey> {
  return window.crypto.subtle.importKey(
    'jwk',
    serialized.exported,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt'],
  );
}

export async function encryptMessage(
  message: string,
  recipientPublicKey: CryptoKey,
  senderPublicKey: CryptoKey,
): Promise<EncryptedMessage> {
  const aesKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedMessage = new TextEncoder().encode(message);
  const ciphertext = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encodedMessage);
  const rawAesKey = await window.crypto.subtle.exportKey('raw', aesKey);
  const wrappedKey = await window.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, recipientPublicKey, rawAesKey);

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
    wrappedKey: arrayBufferToBase64(wrappedKey),
    senderPublicKey: await exportPublicKey(senderPublicKey),
  };
}

export async function decryptMessage(encrypted: EncryptedMessage, privateKey: CryptoKey): Promise<string> {
  const wrappedKey = base64ToArrayBuffer(encrypted.wrappedKey);
  const rawAesKey = await window.crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, wrappedKey);
  const aesKey = await window.crypto.subtle.importKey('raw', rawAesKey, { name: 'AES-GCM' }, false, ['decrypt']);
  const plaintext = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToArrayBuffer(encrypted.iv) },
    aesKey,
    base64ToArrayBuffer(encrypted.ciphertext),
  );

  return new TextDecoder().decode(plaintext);
}

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
