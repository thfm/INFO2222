import type { Student, Flag } from './types';
import { state, setState, showBanner } from './state';
import { renderStudentActivityChart } from './charts';
import { listStoredUsers, login, register } from './authClient';

function getOverlay(): HTMLElement {
  return document.getElementById('modal-overlay') as HTMLElement;
}

function openModal(html: string): void {
  const overlay = getOverlay();
  overlay.innerHTML = html;
  overlay.classList.add('active');
  requestAnimationFrame(() => {
    const modal = overlay.querySelector('.modal');
    if (modal) modal.classList.add('modal--visible');
  });
}

function closeModal(): void {
  const overlay = getOverlay();
  const modal = overlay.querySelector('.modal');
  if (modal) {
    modal.classList.remove('modal--visible');
    setTimeout(() => {
      overlay.classList.remove('active');
      overlay.innerHTML = '';
    }, 250);
  } else {
    overlay.classList.remove('active');
    overlay.innerHTML = '';
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function showAuthModal(): void {
  type Role = 'student' | 'tutor';
  let selectedRole: Role = 'student';

  const renderAuthContent = (mode: 'login' | 'register', role: Role, message = '') => `
    <div class="modal__header modal__header--success">
      <div class="modal__header-icon">⌁</div>
      <h3 class="modal__header-title">Secure Account Access</h3>
      <p class="modal__header-sub">Passwords are stored server-side with Argon2id, unique salts, and a pepper secret.</p>
    </div>
    <div class="modal__body">
      <div class="auth-role-toggle">
        <button class="auth-role-btn ${role === 'student' ? 'auth-role-btn--active' : ''}" id="auth-role-student" type="button">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Student
        </button>
        <button class="auth-role-btn ${role === 'tutor' ? 'auth-role-btn--active' : ''}" id="auth-role-tutor" type="button">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          Tutor
        </button>
      </div>
      <div class="auth-tabs">
        <button class="auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}" id="auth-login-tab">Login</button>
        <button class="auth-tab ${mode === 'register' ? 'auth-tab--active' : ''}" id="auth-register-tab">Register</button>
      </div>
      <form class="auth-form" id="auth-form">
        <label class="auth-field">
          <span>Username</span>
          <input class="auth-input" id="auth-username" name="username" autocomplete="username" minlength="3" maxlength="32" required />
        </label>
        <label class="auth-field">
          <span>Password</span>
          <input class="auth-input" id="auth-password" name="password" type="password" autocomplete="${mode === 'register' ? 'new-password' : 'current-password'}" minlength="12" maxlength="128" required />
        </label>
        ${message ? `<div class="auth-message">${message}</div>` : ''}
        <button class="btn btn--primary auth-submit" id="auth-submit" type="submit">
          ${mode === 'register' ? 'Create Secure Account' : 'Login Securely'}
        </button>
      </form>
      <div class="auth-storage-panel">
        <div class="auth-storage-panel__top">
          <div>
            <div class="auth-storage-panel__title">Stored password records</div>
            <div class="auth-storage-panel__sub">Demo-only view of hashes saved in SQLite.</div>
          </div>
          <button class="btn btn--xs btn--outline" id="auth-load-users" type="button">View Hashes</button>
        </div>
        <div class="auth-hash-list" id="auth-hash-list"></div>
      </div>
    </div>
  `;

  const html = `<div class="modal modal--auth">${renderAuthContent('register', selectedRole)}</div>`;
  openModal(html);

  let mode: 'login' | 'register' = 'register';

  const rebind = () => {
    setTimeout(() => {
      document.getElementById('auth-role-student')?.addEventListener('click', () => {
        selectedRole = 'student';
        const modal = getOverlay().querySelector('.modal')!;
        modal.innerHTML = renderAuthContent(mode, selectedRole);
        rebind();
      });

      document.getElementById('auth-role-tutor')?.addEventListener('click', () => {
        selectedRole = 'tutor';
        const modal = getOverlay().querySelector('.modal')!;
        modal.innerHTML = renderAuthContent(mode, selectedRole);
        rebind();
      });

      document.getElementById('auth-login-tab')?.addEventListener('click', () => {
        mode = 'login';
        const modal = getOverlay().querySelector('.modal')!;
        modal.innerHTML = renderAuthContent(mode, selectedRole);
        rebind();
      });

      document.getElementById('auth-register-tab')?.addEventListener('click', () => {
        mode = 'register';
        const modal = getOverlay().querySelector('.modal')!;
        modal.innerHTML = renderAuthContent(mode, selectedRole);
        rebind();
      });

      document.getElementById('auth-load-users')?.addEventListener('click', async () => {
        const list = document.getElementById('auth-hash-list');
        if (!list) return;
        list.innerHTML = '<div class="auth-hash-empty">Loading stored hashes...</div>';
        try {
          const users = await listStoredUsers();
          list.innerHTML = users.length
            ? users.map((user) => `
              <div class="auth-hash-row">
                <div class="auth-hash-row__meta">${escapeHtml(user.username)} · ${escapeHtml(user.algorithm)}</div>
                <code class="auth-hash-row__hash">${escapeHtml(user.password_hash)}</code>
              </div>
            `).join('')
            : '<div class="auth-hash-empty">No users registered yet.</div>';
        } catch (error) {
          list.innerHTML = `<div class="auth-message auth-message--error">${escapeHtml((error as Error).message)}</div>`;
        }
      });

      document.getElementById('auth-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submit = document.getElementById('auth-submit') as HTMLButtonElement | null;
        const username = (document.getElementById('auth-username') as HTMLInputElement | null)?.value.trim() ?? '';
        const password = (document.getElementById('auth-password') as HTMLInputElement | null)?.value ?? '';
        if (submit) {
          submit.disabled = true;
          submit.textContent = mode === 'register' ? 'Creating...' : 'Checking...';
        }

        try {
          const user = mode === 'register'
            ? await register(username, password)
            : await login(username, password);
          // Lock the view to the role the user selected in the toggle
          setState({ authUser: user, view: selectedRole });
          closeModal();
          showBanner(`Signed in as ${user.username} (${selectedRole}). Password storage is protected by ${user.algorithm}.`, 'success');
          if (state.consentGiven === null) {
            setTimeout(() => showConsentModal(), 350);
          }
        } catch (error) {
          const modal = getOverlay().querySelector('.modal')!;
          modal.innerHTML = renderAuthContent(mode, selectedRole, escapeHtml((error as Error).message));
          rebind();
        }
      });
    }, 50);
  };

  rebind();
}

export function showConsentModal(): void {
  const html = `
    <div class="modal modal--consent">
      <div class="modal__header">
        <div class="modal__logo">
          <span class="modal__logo-icon">◈</span>
          <span class="modal__logo-text">ContriTrack</span>
        </div>
      </div>
      <div class="modal__body">
        <h2 class="modal__title">Welcome to ContriTrack</h2>
        <p class="modal__subtitle">University Group Contribution Tracking Platform</p>
        <div class="consent-description">
          <p>ContriTrack helps ensure fair contribution in university group projects by providing transparent tracking of:</p>
          <ul class="consent-list">
            <li><span class="consent-icon consent-icon--green">✓</span> Chat message frequency and engagement</li>
            <li><span class="consent-icon consent-icon--green">✓</span> File uploads and collaborative edits</li>
            <li><span class="consent-icon consent-icon--green">✓</span> Login activity and last-active timestamps</li>
            <li><span class="consent-icon consent-icon--green">✓</span> Weekly activity trends over the project period</li>
          </ul>
        </div>
        <div class="consent-notice">
          <div class="consent-notice__icon">ⓘ</div>
          <div class="consent-notice__text">
            <strong>Privacy Notice:</strong> Activity data is visible only to your group members and assigned tutor.
            Data is used solely for contribution assessment and is not shared with third parties.
            You may request data deletion at the end of your enrolment.
          </div>
        </div>
      </div>
      <div class="modal__footer modal__footer--consent">
        <button class="btn btn--outline" id="consent-decline">Decline</button>
        <button class="btn btn--primary" id="consent-accept">Accept &amp; Continue</button>
      </div>
    </div>
  `;
  openModal(html);

  setTimeout(() => {
    document.getElementById('consent-accept')?.addEventListener('click', () => {
      setState({ consentGiven: true });
      closeModal();
      showBanner('Welcome to ContriTrack! Your contribution tracking is now active.', 'success');
    });

    document.getElementById('consent-decline')?.addEventListener('click', () => {
      closeModal();
      showAccessDenied();
    });
  }, 50);
}

function showAccessDenied(): void {
  const app = document.getElementById('app')!;
  app.innerHTML = `
    <div class="access-denied">
      <div class="access-denied__icon">⊘</div>
      <h1 class="access-denied__title">Access Denied</h1>
      <p class="access-denied__text">
        You have declined the ContriTrack data collection consent.<br>
        Access to the platform requires consent to activity tracking.
      </p>
      <p class="access-denied__sub">
        To reconsider, please reload the page or contact your tutor for assistance.
      </p>
      <button class="btn btn--primary" onclick="location.reload()">Reload Page</button>
    </div>
  `;
}

export function showFlagConfirmModal(student: Student, onConfirm: () => void): void {
  const html = `
    <div class="modal modal--sm">
      <div class="modal__header modal__header--danger">
        <div class="modal__header-icon">⚑</div>
        <h3 class="modal__header-title">Flag Contribution Concern</h3>
      </div>
      <div class="modal__body">
        <p class="modal__text">You are about to flag <strong>${student.name}</strong> for insufficient contribution to the group project.</p>
        <div class="flag-warning">
          <div class="flag-warning__icon">!</div>
          <div class="flag-warning__text">
            This action will initiate a group vote. If all members agree, the concern will be escalated to your tutor automatically.
          </div>
        </div>
        <div class="student-summary">
          <div class="student-summary__avatar student-summary__avatar--${student.status}">
            ${student.initials}
          </div>
          <div class="student-summary__info">
            <div class="student-summary__name">${student.name}</div>
            <div class="student-summary__stats">
              Activity score: <strong>${student.activityScore}/100</strong> &nbsp;•&nbsp;
              Last active: <strong>${student.lastActive}</strong>
            </div>
          </div>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="flag-cancel">Cancel</button>
        <button class="btn btn--danger" id="flag-confirm">Yes, Flag ${student.name}</button>
      </div>
    </div>
  `;
  openModal(html);

  setTimeout(() => {
    document.getElementById('flag-cancel')?.addEventListener('click', closeModal);
    document.getElementById('flag-confirm')?.addEventListener('click', () => {
      closeModal();
      setTimeout(onConfirm, 200);
    });
  }, 50);
}

export function showVoteModal(flag: Flag, onVoteComplete: (passed: boolean) => void): void {
  const renderVoteContent = (localVotes: Record<string, boolean | null>, simulated: boolean) => {
    const voterIds = Object.keys(localVotes).filter((id) => id !== flag.initiatorId);
    const allVoted = Object.values(localVotes).every((v) => v !== null);
    const passingVotes = Object.values(localVotes).filter((v) => v === true).length;
    const totalVoters = Object.keys(localVotes).length;
    const userVote = localVotes[state.selectedCourseId] ?? localVotes['student-1'];
    const userHasVoted = userVote !== null && userVote !== undefined;

    const voteRows = Object.entries(localVotes).map(([id, vote]) => {
      let label = 'Pending';
      let cls = 'vote-status--pending';
      if (vote === true) { label = 'Yes'; cls = 'vote-status--yes'; }
      if (vote === false) { label = 'No'; cls = 'vote-status--no'; }
      const isInitiator = id === flag.initiatorId;
      return `
        <div class="vote-row">
          <div class="vote-row__member">
            <div class="vote-row__dot vote-row__dot--${vote === true ? 'yes' : vote === false ? 'no' : 'pending'}"></div>
            ${isInitiator ? `${flag.initiatorName} <span class="vote-row__tag">Initiator</span>` : `Member ${id.slice(-1)}`}
          </div>
          <div class="vote-status ${cls}">${label}</div>
        </div>
      `;
    }).join('');

    const progressPct = Math.round((passingVotes / totalVoters) * 100);

    return `
      <div class="modal__header modal__header--vote">
        <div class="modal__header-icon">⚑</div>
        <h3 class="modal__header-title">Active Contribution Flag</h3>
      </div>
      <div class="modal__body">
        <p class="modal__text">
          <strong>${flag.initiatorName}</strong> has flagged <strong>${flag.targetName}</strong> for insufficient contribution.
          All group members must vote for this to be escalated.
        </p>
        <div class="vote-progress-wrapper">
          <div class="vote-progress-label">
            <span>Votes in favour</span>
            <span>${passingVotes}/${totalVoters}</span>
          </div>
          <div class="vote-progress-bar">
            <div class="vote-progress-fill" style="width: ${progressPct}%"></div>
          </div>
        </div>
        <div class="vote-list">${voteRows}</div>
        ${!userHasVoted && !simulated ? `
          <div class="vote-action">
            <p class="vote-action__question">Do you believe <strong>${flag.targetName}</strong>'s contribution warrants escalation?</p>
            <div class="vote-action__buttons">
              <button class="btn btn--danger-outline" id="vote-no">No</button>
              <button class="btn btn--success" id="vote-yes">Yes, Escalate</button>
            </div>
          </div>
        ` : ''}
        ${userHasVoted && !allVoted && !simulated ? `
          <div class="vote-pending-notice">
            <div>Your vote has been recorded. Waiting for other members...</div>
            <button class="btn btn--outline btn--sm" id="simulate-votes">Simulate All Votes</button>
          </div>
        ` : ''}
        ${allVoted || simulated ? `
          <div class="vote-outcome vote-outcome--${passingVotes === totalVoters ? 'pass' : 'dismiss'}">
            <div class="vote-outcome__icon">${passingVotes === totalVoters ? '✓' : '✗'}</div>
            <div class="vote-outcome__text">
              ${passingVotes === totalVoters
                ? 'Unanimous vote — flag will be escalated to your tutor.'
                : 'Not all members agreed — flag has been dismissed.'}
            </div>
          </div>
        ` : ''}
      </div>
      <div class="modal__footer">
        ${allVoted || simulated ? `<button class="btn btn--primary" id="vote-finish">${passingVotes === totalVoters ? 'Proceed to Escalation' : 'Close'}</button>` : `<button class="btn btn--outline" id="vote-close">Close</button>`}
      </div>
    `;
  };

  let localVotes = { ...flag.votes };
  let simulated = false;

  const html = `<div class="modal modal--vote">${renderVoteContent(localVotes, simulated)}</div>`;
  openModal(html);

  const rebind = () => {
    setTimeout(() => {
      document.getElementById('vote-close')?.addEventListener('click', closeModal);

      document.getElementById('vote-yes')?.addEventListener('click', () => {
        localVotes['student-1'] = true;
        const modal = getOverlay().querySelector('.modal')!;
        modal.innerHTML = renderVoteContent(localVotes, simulated);
        rebind();
      });

      document.getElementById('vote-no')?.addEventListener('click', () => {
        localVotes['student-1'] = false;
        const modal = getOverlay().querySelector('.modal')!;
        modal.innerHTML = renderVoteContent(localVotes, simulated);
        rebind();
      });

      document.getElementById('simulate-votes')?.addEventListener('click', () => {
        // Simulate unanimous yes for demo purposes
        Object.keys(localVotes).forEach((id) => {
          if (localVotes[id] === null) localVotes[id] = true;
        });
        simulated = true;
        const modal = getOverlay().querySelector('.modal')!;
        modal.innerHTML = renderVoteContent(localVotes, simulated);
        rebind();
      });

      document.getElementById('vote-finish')?.addEventListener('click', () => {
        const passingVotes = Object.values(localVotes).filter((v) => v === true).length;
        const totalVoters = Object.keys(localVotes).length;
        const passed = passingVotes === totalVoters;
        closeModal();
        setTimeout(() => onVoteComplete(passed), 200);
      });
    }, 50);
  };

  rebind();
}

export function showEmailPreviewModal(flag: Flag): void {
  const emailText = flag.emailPreview ?? 'No email preview available.';
  const lines = emailText.split('\n');
  const headerLines = lines.slice(0, 4);
  const bodyLines = lines.slice(4);

  const headerHtml = headerLines.map((line) => {
    if (line.startsWith('From:') || line.startsWith('To:') || line.startsWith('Subject:')) {
      const [key, ...rest] = line.split(':');
      return `<div class="email-header-row"><span class="email-header-key">${key}:</span><span class="email-header-val">${rest.join(':').trim()}</span></div>`;
    }
    return `<div class="email-header-row"><span class="email-header-val">${line}</span></div>`;
  }).join('');

  const bodyHtml = bodyLines.map((line) => {
    if (line.startsWith('---')) return `<div class="email-section-divider">${line.replace(/---/g, '').trim()}</div>`;
    if (line.trim() === '') return '<div class="email-blank-line"></div>';
    return `<div class="email-body-line">${line}</div>`;
  }).join('');

  const html = `
    <div class="modal modal--email">
      <div class="modal__header modal__header--success">
        <div class="modal__header-icon">✉</div>
        <h3 class="modal__header-title">Tutor Notification Email</h3>
        <p class="modal__header-sub">The following email has been sent to your tutor.</p>
      </div>
      <div class="modal__body">
        <div class="email-preview">
          <div class="email-preview__header">${headerHtml}</div>
          <div class="email-preview__body">${bodyHtml}</div>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="email-close">Close</button>
        <button class="btn btn--primary" id="email-done">Done</button>
      </div>
    </div>
  `;
  openModal(html);

  setTimeout(() => {
    document.getElementById('email-close')?.addEventListener('click', closeModal);
    document.getElementById('email-done')?.addEventListener('click', closeModal);
  }, 50);
}

export function showFlagListModal(flags: Flag[]): void {
  const flagItems = flags.map((flag) => {
    const pendingCount = Object.values(flag.votes).filter((v) => v === null).length;
    const yesCount = Object.values(flag.votes).filter((v) => v === true).length;
    const totalVotes = Object.keys(flag.votes).length;
    const statusLabel = flag.status === 'voting' ? 'Voting in Progress' : flag.status === 'passed' ? 'Escalated' : 'Dismissed';
    const statusClass = flag.status === 'voting' ? 'amber' : flag.status === 'passed' ? 'green' : 'red';
    return `
      <div class="flag-list-item">
        <div class="flag-list-item__top">
          <div class="flag-list-item__target">
            <div class="flag-list-item__avatar">${flag.targetName.split(' ').map((n) => n[0]).join('')}</div>
            <div>
              <div class="flag-list-item__name">${flag.targetName}</div>
              <div class="flag-list-item__meta">${flag.courseName} / ${flag.tutorialName} / ${flag.groupName}</div>
            </div>
          </div>
          <div class="pill pill--${statusClass}">${statusLabel}</div>
        </div>
        <div class="flag-list-item__bottom">
          <span>Raised by <strong>${flag.initiatorName}</strong></span>
          <span>Votes: <strong>${yesCount}/${totalVotes}</strong> (${pendingCount} pending)</span>
          <span class="flag-list-item__date">${new Date(flag.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>
    `;
  }).join('');

  const html = `
    <div class="modal modal--flag-list">
      <div class="modal__header">
        <div class="modal__header-icon">⚑</div>
        <h3 class="modal__header-title">Active Contribution Flags</h3>
        <p class="modal__header-sub">${flags.length} flag${flags.length !== 1 ? 's' : ''} requiring attention</p>
      </div>
      <div class="modal__body">
        <div class="flag-list">
          ${flags.length > 0 ? flagItems : '<p class="empty-state">No active flags.</p>'}
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="flag-list-close">Close</button>
      </div>
    </div>
  `;
  openModal(html);

  setTimeout(() => {
    document.getElementById('flag-list-close')?.addEventListener('click', closeModal);
  }, 50);
}

export function showStudentDrillDown(student: Student): void {
  const statusLabel = student.status === 'green' ? 'On Track' : student.status === 'amber' ? 'Low Activity' : 'Inactive';
  const html = `
    <div class="modal modal--drilldown">
      <div class="modal__header">
        <div class="student-dd-hero">
          <div class="student-dd-avatar student-dd-avatar--${student.status}">${student.initials}</div>
          <div class="student-dd-info">
            <h3 class="student-dd-name">${student.name}</h3>
            <div class="pill pill--${student.status}">${statusLabel}</div>
          </div>
        </div>
      </div>
      <div class="modal__body">
        <div class="dd-stats-grid">
          <div class="dd-stat">
            <div class="dd-stat__value">${student.activityScore}</div>
            <div class="dd-stat__label">Activity Score</div>
          </div>
          <div class="dd-stat">
            <div class="dd-stat__value">${student.messagesThisWeek}</div>
            <div class="dd-stat__label">Messages This Week</div>
          </div>
          <div class="dd-stat">
            <div class="dd-stat__value">${student.filesUploaded}</div>
            <div class="dd-stat__label">Files Uploaded</div>
          </div>
          <div class="dd-stat">
            <div class="dd-stat__value dd-stat__value--${student.daysInactive > 5 ? 'red' : student.daysInactive > 1 ? 'amber' : 'green'}">${student.daysInactive}d</div>
            <div class="dd-stat__label">Days Inactive</div>
          </div>
        </div>
        <div class="dd-chart-section">
          <div class="dd-chart-title">Weekly Activity Trend</div>
          <div class="dd-chart-wrap">
            <canvas id="dd-chart-${student.id}" height="180"></canvas>
          </div>
        </div>
        <div class="dd-last-active">
          Last active: <strong>${student.lastActive}</strong>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--outline" id="dd-close">Close</button>
      </div>
    </div>
  `;
  openModal(html);

  setTimeout(() => {
    document.getElementById('dd-close')?.addEventListener('click', closeModal);
    renderStudentActivityChart(`dd-chart-${student.id}`, student);
  }, 100);
}
