import type { Flag, ViewMode, ChatMessage } from './types';
import { CHAT_MESSAGES } from './data';

interface AppState {
  view: ViewMode;
  authUser: { id: number; username: string; algorithm: string } | null;
  consentGiven: boolean | null;
  isDarkMode: boolean;
  selectedCourseId: string;
  activeFlag: Flag | null;
  bannerMessage: string | null;
  bannerType: 'info' | 'warning' | 'success' | 'error' | null;
  messages: ChatMessage[];
  selectedTutorPath: { courseId: string; tutorialId: string; groupId: string } | null;
  tutorView: 'graphs' | 'text';
  showFlagPanel: boolean;
  flagCount: number;
  encryption: {
    ready: boolean;
    connected: boolean;
    peerCount: number;
    label: string;
  };
}

type Listener = (state: AppState) => void;

const listeners: Listener[] = [];

export const state: AppState = {
  view: 'student',
  authUser: null,
  consentGiven: null,
  isDarkMode: true,
  selectedCourseId: 'INFO2222',
  activeFlag: null,
  bannerMessage: null,
  bannerType: null,
  messages: [...CHAT_MESSAGES],
  selectedTutorPath: {
    courseId: 'INFO1111',
    tutorialId: 'tut13',
    groupId: 'tut13-grp03',
  },
  tutorView: 'graphs',
  showFlagPanel: false,
  flagCount: 1,
  encryption: {
    ready: false,
    connected: false,
    peerCount: 0,
    label: 'Preparing secure chat...',
  },
};

export function setState(updates: Partial<AppState>): void {
  Object.assign(state, updates);
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn: Listener): () => void {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export function addMessage(msg: ChatMessage): void {
  state.messages = [...state.messages, msg];
  listeners.forEach((fn) => fn(state));
}

export function showBanner(message: string, type: AppState['bannerType']): void {
  setState({ bannerMessage: message, bannerType: type });
}

export function dismissBanner(): void {
  setState({ bannerMessage: null, bannerType: null });
}

export function setEncryptionStatus(updates: Partial<AppState['encryption']>): void {
  state.encryption = { ...state.encryption, ...updates };
  listeners.forEach((fn) => fn(state));
}
