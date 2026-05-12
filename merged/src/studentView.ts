import type { Student } from './types';
import { state, setState, showBanner, subscribe, dismissBanner } from './state';
import { COURSES, GROUP_MEMBERS, CURRENT_USER } from './data';
import { renderLineChart, renderDonutChart } from './charts';
import { showFlagConfirmModal, showVoteModal, showEmailPreviewModal, showStudentDrillDown } from './modals';
import { secureChatClient } from './secureChatClient';

let unsubscribe: (() => void) | null = null;
let chartInitialized = false;

function getStatusColor(status: string): string {
  return status === 'green' ? '#22c55e' : status === 'amber' ? '#f59e0b' : '#ef4444';
}

function getStatusLabel(status: string): string {
  return status === 'green' ? 'On Track' : status === 'amber' ? 'Low Activity' : 'Inactive';
}

function formatTime(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
}

export function renderStudentView(container: HTMLElement): void {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  chartInitialized = false;

  container.innerHTML = `
    <div class="student-layout">
      ${renderBanner()}
      ${renderCourseTabs()}
      <div class="student-content">
        <div class="student-main">
          <div class="student-main__header">
            <div class="student-main__header-left">
              <h2 class="student-main__title">Group Chat &amp; Activity</h2>
              <div class="student-main__subtitle">INFO2222 — Group 05</div>
            </div>
            <div class="student-main__header-right">
              <div class="encryption-status ${state.encryption.connected ? 'encryption-status--connected' : 'encryption-status--offline'}" id="encryption-status" title="Chat messages are encrypted in the browser before being relayed">
                <span class="encryption-status__dot"></span>
                <span class="encryption-status__label">${state.encryption.label}</span>
                <span class="encryption-status__peers">${state.encryption.peerCount}</span>
              </div>
              <button class="btn btn--sm btn--outline" id="view-charts-btn">View Charts</button>
            </div>
          </div>
          <div class="student-main__body">
            <div id="chatbox-area" class="chatbox-area">
              ${renderChatMessages()}
            </div>
          <div class="chat-input-area">
              <div class="chat-security-note">Messages sent from here are end-to-end encrypted. Open a second tab to exchange encrypted messages.</div>
              <div class="chat-input-wrap">
                <div class="chat-input__avatar">${CURRENT_USER.initials}</div>
                <input type="text" id="chat-input" class="chat-input__field" placeholder="Message your group securely..." maxlength="2000" />
                <button class="chat-send-btn" id="chat-send-btn" title="Send">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="student-sidebar">
          <div class="sidebar-section">
            <div class="sidebar-section__header">
              <h3 class="sidebar-section__title">Group Members</h3>
              <div class="sidebar-section__count">${GROUP_MEMBERS.length}</div>
            </div>
            <div id="members-list" class="members-list">
              ${GROUP_MEMBERS.map(renderMemberCard).join('')}
            </div>
          </div>
        </div>
      </div>
      <div id="charts-panel" class="charts-panel charts-panel--hidden">
        <div class="charts-panel__header">
          <h3 class="charts-panel__title">Contribution Analytics</h3>
          <button class="btn btn--sm btn--outline" id="hide-charts-btn">Hide Charts</button>
        </div>
        <div class="charts-grid">
          <div class="chart-card">
            <div class="chart-card__title">Weekly Activity Trend</div>
            <div class="chart-card__body">
              <canvas id="line-chart" height="280"></canvas>
            </div>
          </div>
          <div class="chart-card">
            <div class="chart-card__title">Contribution Split</div>
            <div class="chart-card__body">
              <canvas id="donut-chart" height="280"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  bindStudentEvents(container);
  scrollChatToBottom();

  unsubscribe = subscribe((newState) => {
    const bannerEl = container.querySelector('#banner-area');
    if (bannerEl) bannerEl.outerHTML = renderBanner();

    const encryptionEl = container.querySelector('#encryption-status');
    if (encryptionEl) {
      encryptionEl.className = `encryption-status ${newState.encryption.connected ? 'encryption-status--connected' : 'encryption-status--offline'}`;
      const label = encryptionEl.querySelector('.encryption-status__label');
      const peers = encryptionEl.querySelector('.encryption-status__peers');
      if (label) label.textContent = newState.encryption.label;
      if (peers) peers.textContent = String(newState.encryption.peerCount);
    }

    const newBannerEl = container.querySelector('#banner-area');
    if (newBannerEl) {
      const dismissBtn = newBannerEl.querySelector('#banner-dismiss');
      dismissBtn?.addEventListener('click', () => {
        dismissBanner();
      });
    }

    const chatArea = container.querySelector('#chatbox-area');
    if (chatArea) {
      const renderedCount = chatArea.querySelectorAll('.chat-message').length;
      const stateCount = state.messages.length;

      if (renderedCount < stateCount) {
        const newMessages = state.messages.slice(renderedCount);
        for (const msg of newMessages) {
          const el = buildMessageElement(msg);
          chatArea.appendChild(el);
        }
      }
      scrollChatToBottom();
    }
  });
}

function renderBanner(): string {
  if (!state.bannerMessage) return `<div id="banner-area"></div>`;
  const icons: Record<string, string> = { info: 'ⓘ', warning: '⚠', success: '✓', error: '✗' };
  const icon = icons[state.bannerType ?? 'info'] ?? 'ⓘ';
  return `
    <div id="banner-area" class="banner banner--${state.bannerType}">
      <span class="banner__icon">${icon}</span>
      <span class="banner__message">${state.bannerMessage}</span>
      <button class="banner__dismiss" id="banner-dismiss" title="Dismiss">✕</button>
    </div>
  `;
}

function renderCourseTabs(): string {
  const tabs = COURSES.map((course) => {
    const active = course.id === state.selectedCourseId;
    const urgency = course.daysUntilDue <= 3 ? 'urgent' : course.daysUntilDue <= 7 ? 'soon' : '';
    return `
      <button class="course-tab ${active ? 'course-tab--active' : ''}" data-course-id="${course.id}">
        <span class="course-tab__name">${course.name}</span>
        <span class="course-tab__due ${urgency ? `course-tab__due--${urgency}` : ''}">${course.dueText}</span>
      </button>
    `;
  }).join('');

  return `
    <div class="course-tabs-bar">
      <div class="course-tabs">${tabs}</div>
      <div class="course-tabs__info">
        <span class="course-tabs__group-label">Group 05</span>
        <span class="course-tabs__semester">Sem 1, 2026</span>
      </div>
    </div>
  `;
}

function renderChatMessages(): string {
  return state.messages.map((msg) => {
    const isSelf = msg.senderId === CURRENT_USER.id;
    const member = GROUP_MEMBERS.find((m) => m.id === msg.senderId);
    const initials = member?.initials ?? msg.senderName.split(' ').map((n) => n[0]).join('').slice(0, 2);
    const statusClass = member ? `status--${member.status}` : '';
    return `
          <div class="chat-message ${isSelf ? 'chat-message--self' : ''}">
        ${!isSelf ? `<div class="chat-message__avatar ${statusClass}">${initials}</div>` : ''}
        <div class="chat-message__content">
          ${!isSelf ? `<div class="chat-message__sender">${msg.senderName}</div>` : ''}
          <div class="chat-message__bubble ${isSelf ? 'chat-message__bubble--self' : ''}">${escapeHtml(msg.content)}</div>
          ${msg.encrypted ? '<div class="chat-message__secure">End-to-end encrypted</div>' : ''}
          <div class="chat-message__time">${msg.timestamp}</div>
        </div>
        ${isSelf ? `<div class="chat-message__avatar chat-message__avatar--self ${statusClass}">${initials}</div>` : ''}
      </div>
    `;
  }).join('');
}

export function renderMemberCard(student: Student): string {
  const isSelf = student.id === CURRENT_USER.id;
  const statusLabel = getStatusLabel(student.status);
  const canFlag = !isSelf && student.status !== 'green';
  return `
    <div class="member-card member-card--${student.status} ${isSelf ? 'member-card--self' : ''}" data-student-id="${student.id}">
      <div class="member-card__top">
        <div class="member-card__avatar-wrap">
          <div class="member-card__avatar member-card__avatar--${student.status}">${student.initials}</div>
          <div class="member-card__status-dot member-card__status-dot--${student.status}"></div>
        </div>
        <div class="member-card__info">
          <div class="member-card__name">${student.name}${isSelf ? ' <span class="you-tag">You</span>' : ''}</div>
          <div class="member-card__last-active">${student.lastActive}</div>
        </div>
        <div class="pill pill--${student.status} member-card__pill">${statusLabel}</div>
      </div>
      <div class="member-card__stats">
        <div class="member-card__stat">
          <div class="member-card__stat-val">${student.messagesThisWeek}</div>
          <div class="member-card__stat-key">msgs</div>
        </div>
        <div class="member-card__stat">
          <div class="member-card__stat-val">${student.filesUploaded}</div>
          <div class="member-card__stat-key">files</div>
        </div>
        <div class="member-card__stat">
          <div class="member-card__stat-val member-card__stat-val--score">${student.activityScore}</div>
          <div class="member-card__stat-key">score</div>
        </div>
      </div>
      <div class="member-card__activity-bar">
        <div class="member-card__activity-fill member-card__activity-fill--${student.status}" style="width: ${student.activityScore}%"></div>
      </div>
      <div class="member-card__actions">
        <button class="btn btn--xs btn--ghost drill-down-btn" data-student-id="${student.id}">View Details</button>
        ${canFlag
          ? `<button class="btn btn--xs btn--danger-ghost flag-btn" data-student-id="${student.id}" title="Flag contribution concern">⚑ Flag</button>`
          : isSelf
          ? `<span class="member-card__self-note">Your activity</span>`
          : `<span class="member-card__good-note">✓ Contributing</span>`
        }
      </div>
    </div>
  `;
}

function buildMessageElement(msg: import('./types').ChatMessage): HTMLDivElement {
  const isSelf = msg.senderId === CURRENT_USER.id;
  const member = GROUP_MEMBERS.find((m) => m.id === msg.senderId);
  const initials = member?.initials ?? msg.senderName.split(' ').map((n) => n[0]).join('').slice(0, 2);
  const statusClass = member ? `status--${member.status}` : '';

  const wrapper = document.createElement('div');
  wrapper.className = `chat-message chat-message--new ${isSelf ? 'chat-message--self' : ''}`;

  const avatar = document.createElement('div');
  avatar.className = `chat-message__avatar ${statusClass}${isSelf ? ' chat-message__avatar--self' : ''}`;
  avatar.textContent = initials;

  const content = document.createElement('div');
  content.className = 'chat-message__content';

  if (!isSelf) {
    const sender = document.createElement('div');
    sender.className = 'chat-message__sender';
    sender.textContent = msg.senderName;
    content.appendChild(sender);
  }

  const bubble = document.createElement('div');
  bubble.className = `chat-message__bubble ${isSelf ? 'chat-message__bubble--self' : ''}`;
  bubble.textContent = msg.content;
  content.appendChild(bubble);

  const time = document.createElement('div');
  time.className = 'chat-message__time';
  time.textContent = msg.timestamp;

  if (msg.encrypted) {
    const secure = document.createElement('div');
    secure.className = 'chat-message__secure';
    secure.textContent = 'End-to-end encrypted';
    content.appendChild(secure);
  }

  content.appendChild(time);

  if (!isSelf) {
    wrapper.appendChild(avatar);
    wrapper.appendChild(content);
  } else {
    wrapper.appendChild(content);
    wrapper.appendChild(avatar);
  }

  return wrapper;
}

function scrollChatToBottom(): void {
  setTimeout(() => {
    const chatArea = document.getElementById('chatbox-area');
    if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
  }, 50);
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function bindStudentEvents(container: HTMLElement): void {
  // Course tab switching
  container.querySelectorAll('.course-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const courseId = (tab as HTMLElement).dataset.courseId!;
      setState({ selectedCourseId: courseId });
      container.querySelectorAll('.course-tab').forEach((t) => t.classList.remove('course-tab--active'));
      tab.classList.add('course-tab--active');
    });
  });

  // Chat send
  const sendBtn = container.querySelector('#chat-send-btn');
  const chatInput = container.querySelector('#chat-input') as HTMLInputElement;

  const sendMessage = async () => {
    const content = chatInput?.value.trim();
    if (!content) return;
    chatInput.disabled = true;
    const sent = await secureChatClient.sendMessage(content);
    if (sent) {
      chatInput.value = '';
      scrollChatToBottom();
    }
    chatInput.disabled = false;
    chatInput.focus();
  };

  sendBtn?.addEventListener('click', sendMessage);
  chatInput?.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') sendMessage();
  });

  // View charts toggle
  container.querySelector('#view-charts-btn')?.addEventListener('click', () => {
    const panel = container.querySelector('#charts-panel');
    panel?.classList.remove('charts-panel--hidden');
    if (!chartInitialized) {
      setTimeout(() => {
        renderLineChart('line-chart', GROUP_MEMBERS);
        renderDonutChart('donut-chart', GROUP_MEMBERS);
        chartInitialized = true;
      }, 100);
    }
  });

  container.querySelector('#hide-charts-btn')?.addEventListener('click', () => {
    container.querySelector('#charts-panel')?.classList.add('charts-panel--hidden');
  });

  // Member card flag buttons
  container.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const flagBtn = target.closest('.flag-btn') as HTMLElement | null;
    const drillBtn = target.closest('.drill-down-btn') as HTMLElement | null;

    if (flagBtn) {
      const studentId = flagBtn.dataset.studentId!;
      const student = GROUP_MEMBERS.find((s) => s.id === studentId)!;
      handleFlagFlow(student);
    }

    if (drillBtn) {
      const studentId = drillBtn.dataset.studentId!;
      const student = GROUP_MEMBERS.find((s) => s.id === studentId)!;
      showStudentDrillDown(student);
    }
  });

  // Banner dismiss
  container.querySelector('#banner-dismiss')?.addEventListener('click', () => {
    dismissBanner();
  });
}

function handleFlagFlow(student: Student): void {
  showFlagConfirmModal(student, () => {
    // Build flag
    const flag = {
      id: `flag-${Date.now()}`,
      targetStudentId: student.id,
      targetName: student.name,
      initiatorId: CURRENT_USER.id,
      initiatorName: CURRENT_USER.name,
      groupId: 'group-05',
      groupName: 'Group 05',
      courseId: state.selectedCourseId,
      courseName: state.selectedCourseId,
      tutorialName: 'Tutorial 07',
      votes: {
        'student-1': true,  // initiator auto-votes yes
        'student-4': null,
        'student-5': null,
      } as Record<string, boolean | null>,
      status: 'voting' as const,
      createdAt: new Date().toISOString(),
      emailPreview: generateEmailPreview(student),
    };

    setState({ activeFlag: flag });

    showVoteModal(flag, (passed) => {
      if (passed) {
        setState({ flagCount: state.flagCount + 1 });
        showBanner(`Flag escalated — tutor has been notified about ${student.name}'s contribution.`, 'warning');
        setTimeout(() => {
          showEmailPreviewModal(flag);
        }, 400);
      } else {
        showBanner(`Flag for ${student.name} was dismissed — not enough votes to escalate.`, 'info');
      }
    });
  });
}

function generateEmailPreview(student: Student): string {
  return `From: ContriTrack System <no-reply@contritrack.edu.au>
To: tutor@university.edu.au
Subject: [${state.selectedCourseId} - Tutorial 07 - Group 05] Contribution Flag Escalation Notice

Dear Tutor,

A peer contribution flag has been escalated to your attention for the following student:

  Student:  ${student.name}
  Course:   ${state.selectedCourseId}
  Tutorial: Tutorial 07
  Group:    Group 05

The flag was initiated by ${CURRENT_USER.name} on ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })} and has received a unanimous vote from all participating group members.

--- CONTRIBUTION EVIDENCE ---

  Messages sent (last 4 weeks): ${student.messagesThisWeek}
  Files uploaded: ${student.filesUploaded}
  Last active: ${student.lastActive}
  Activity score: ${student.activityScore} / 100

Group members report that ${student.name} has not maintained adequate contribution to the project, with ${student.daysInactive} day(s) of inactivity and significantly lower output than the group average.

--- NEXT STEPS ---

As the allocated tutor, please review this case and take appropriate action, which may include:
  • Contacting the student directly
  • Scheduling a check-in meeting
  • Applying a contribution adjustment if warranted

You can view full contribution data and chat logs in the ContriTrack dashboard.

This is an automated notification. Do not reply to this email.

— ContriTrack, University of Sydney`;
}
