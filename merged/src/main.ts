import './styles.css';
import { state, setState, subscribe } from './state';
import { showAuthModal, showConsentModal } from './modals';
import { renderStudentView } from './studentView';
import { renderTutorView } from './tutorView';
import { secureChatClient } from './secureChatClient';

function renderApp(): void {
  const app = document.getElementById('app')!;

  app.innerHTML = `
    <div class="app-root ${state.isDarkMode ? 'dark' : 'light'}">
      <header class="app-header">
        <div class="app-header__left">
          <div class="app-logo">
            <span class="app-logo__icon">◈</span>
            <span class="app-logo__text">ContriTrack</span>
          </div>
        </div>
        <div class="app-header__center">
          <div class="view-toggle-bar">
            <button class="view-toggle-bar__btn ${state.view === 'student' ? 'view-toggle-bar__btn--active' : ''}" id="switch-student" title="Student view">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Student
            </button>
            <button class="view-toggle-bar__btn ${state.view === 'tutor' ? 'view-toggle-bar__btn--active' : ''}" id="switch-tutor" title="Tutor view">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              Tutor
            </button>
          </div>
        </div>
        <div class="app-header__right">
          ${state.flagCount > 0 && state.view === 'tutor' ? `
            <div class="header-flag-badge" title="${state.flagCount} active flag(s)">
              <span class="header-flag-icon">⚑</span>
              <span class="header-flag-count">${state.flagCount}</span>
            </div>
          ` : ''}
          <button class="theme-toggle-btn" id="theme-toggle" title="Toggle dark/light mode">
            ${state.isDarkMode
              ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
              : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
            }
            ${state.isDarkMode ? 'Light' : 'Dark'}
          </button>
          <div class="header-user">
            <div class="header-user__avatar">${state.view === 'student' ? 'AC' : 'TH'}</div>
            <div class="header-user__info">
              <div class="header-user__name">${state.authUser?.username ?? (state.view === 'student' ? 'Alex Chen' : 'Tutor Hayes')}</div>
              <div class="header-user__role">${state.authUser ? `Secured by ${state.authUser.algorithm}` : (state.view === 'student' ? 'Student' : 'Tutor')}</div>
            </div>
          </div>
        </div>
      </header>
      <div class="app-view" id="app-view"></div>
    </div>
  `;

  // Apply theme to root
  const root = document.documentElement;
  if (state.isDarkMode) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }

  bindHeaderEvents();
  renderCurrentView();
}

function renderCurrentView(): void {
  const viewContainer = document.getElementById('app-view');
  if (!viewContainer) return;

  viewContainer.style.opacity = '0';
  viewContainer.style.transition = 'opacity 300ms ease';

  setTimeout(() => {
    if (state.view === 'student') {
      renderStudentView(viewContainer);
    } else {
      renderTutorView(viewContainer);
    }
    viewContainer.style.opacity = '1';
  }, 50);
}

function bindHeaderEvents(): void {
  document.getElementById('switch-student')?.addEventListener('click', () => {
    if (state.view !== 'student') {
      setState({ view: 'student' });
    }
  });

  document.getElementById('switch-tutor')?.addEventListener('click', () => {
    if (state.view !== 'tutor') {
      setState({ view: 'tutor' });
    }
  });

  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    setState({ isDarkMode: !state.isDarkMode });
  });
}

function init(): void {
  let prevView = state.view;
  let prevDarkMode = state.isDarkMode;
  let prevFlagCount = state.flagCount;
  let prevAuthUser = state.authUser;

  subscribe(() => {
    if (
      state.view !== prevView ||
      state.isDarkMode !== prevDarkMode ||
      state.flagCount !== prevFlagCount ||
      state.authUser !== prevAuthUser
    ) {
      prevView = state.view;
      prevDarkMode = state.isDarkMode;
      prevFlagCount = state.flagCount;
      prevAuthUser = state.authUser;
      renderApp();
    }
  });

  renderApp();
  secureChatClient.init().catch((error) => {
    console.error('Secure chat initialization failed:', error);
  });

  if (!state.authUser) {
    setTimeout(() => showAuthModal(), 250);
  } else if (state.consentGiven === null) {
    setTimeout(() => showConsentModal(), 300);
  }
}

document.addEventListener('DOMContentLoaded', init);
