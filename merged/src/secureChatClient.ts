import { CURRENT_USER } from './data';
import { addMessage, setEncryptionStatus, showBanner } from './state';
import type { ChatMessage } from './types';
import {
  decryptMessage,
  encryptMessage,
  exportPublicKey,
  generateKeyPair,
  importPublicKey,
  type EncryptedMessage,
  type KeyPair,
  type SerializedPublicKey,
} from './crypto';

interface PeerProfile {
  studentId: string;
  name: string;
  initials: string;
}

interface Peer {
  id: string;
  publicKey: CryptoKey;
  profile: PeerProfile;
}

type ChannelMessage =
  | {
      type: 'peer-announcement';
      clientId: string;
      publicKey: SerializedPublicKey;
      profile: PeerProfile;
    }
  | {
      type: 'encrypted-message';
      from: string;
      to: string;
      encrypted: EncryptedMessage;
      timestamp: number;
    };

class SecureChatClient {
  private clientId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  private keyPair: KeyPair | null = null;
  private channel: BroadcastChannel | null = null;
  private peers = new Map<string, Peer>();
  private announceTimer: number | null = null;

  async init(): Promise<void> {
    if (!window.crypto?.subtle) {
      setEncryptionStatus({ ready: false, connected: false, peerCount: 0, label: 'WebCrypto unavailable' });
      return;
    }

    if (!('BroadcastChannel' in window)) {
      setEncryptionStatus({ ready: false, connected: false, peerCount: 0, label: 'Tab relay unavailable' });
      return;
    }

    this.keyPair = await generateKeyPair();
    this.channel = new BroadcastChannel('contritrack-secure-chat');
    this.channel.onmessage = (event: MessageEvent<ChannelMessage>) => {
      this.handleMessage(event.data).catch((error) => {
        console.error('Secure chat message handling failed:', error);
      });
    };

    window.addEventListener('beforeunload', () => this.channel?.close());
    this.refreshStatus();
    await this.announce();
    this.announceTimer = window.setInterval(() => this.announce(), 3000);
  }

  async sendMessage(content: string): Promise<boolean> {
    if (!this.channel || !this.keyPair) {
      showBanner('Secure chat is not ready yet. Try again in a moment.', 'error');
      return false;
    }

    if (this.peers.size === 0) {
      await this.announce();
      showBanner('Open this app in another browser tab before sending an encrypted message.', 'info');
      return false;
    }

    const timestamp = Date.now();
    for (const peer of this.peers.values()) {
      const encrypted = await encryptMessage(content, peer.publicKey, this.keyPair.publicKey);
      this.channel.postMessage({
        type: 'encrypted-message',
        from: this.clientId,
        to: peer.id,
        encrypted,
        timestamp,
      });
    }

    addMessage(buildMessage(content, CURRENT_USER.id, CURRENT_USER.name, timestamp, true));
    return true;
  }

  private async announce(): Promise<void> {
    if (!this.channel || !this.keyPair) return;

    this.channel.postMessage({
      type: 'peer-announcement',
      clientId: this.clientId,
      publicKey: await exportPublicKey(this.keyPair.publicKey),
      profile: {
        studentId: CURRENT_USER.id,
        name: CURRENT_USER.name,
        initials: CURRENT_USER.initials,
      },
    });
  }

  private async handleMessage(message: ChannelMessage): Promise<void> {
    if (message.type === 'peer-announcement') {
      if (message.clientId === this.clientId) return;
      const isNewPeer = await this.upsertPeer(message.clientId, message.publicKey, message.profile);
      if (isNewPeer) await this.announce();
      this.refreshStatus();
      return;
    }

    if (message.to !== this.clientId || !this.keyPair) return;

    try {
      const content = await decryptMessage(message.encrypted, this.keyPair.privateKey);
      const peer = this.peers.get(message.from);
      addMessage(buildMessage(content, message.from, peer?.profile.name ?? 'Encrypted peer', message.timestamp, true));
    } catch (error) {
      console.error('Unable to decrypt message:', error);
      addMessage(buildMessage('[Unable to decrypt encrypted message]', message.from, 'Encrypted peer', message.timestamp, false));
    }
  }

  private async upsertPeer(id: string, publicKey: SerializedPublicKey, profile: PeerProfile): Promise<boolean> {
    const isNewPeer = !this.peers.has(id);
    this.peers.set(id, {
      id,
      publicKey: await importPublicKey(publicKey),
      profile,
    });
    return isNewPeer;
  }

  private refreshStatus(): void {
    setEncryptionStatus({
      ready: Boolean(this.keyPair),
      connected: Boolean(this.channel),
      peerCount: this.peers.size,
      label: this.peers.size > 0 ? `E2E linked to ${this.peers.size} tab${this.peers.size === 1 ? '' : 's'}` : 'E2E ready',
    });
  }
}

function buildMessage(
  content: string,
  senderId: string,
  senderName: string,
  timestamp: number,
  encrypted: boolean,
): ChatMessage {
  return {
    id: `secure-msg-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    senderId,
    senderName,
    content,
    timestamp: new Date(timestamp).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
    encrypted,
  };
}

export const secureChatClient = new SecureChatClient();
