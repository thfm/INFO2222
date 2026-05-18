import type { Student, Group, TutorCourse, Tutorial } from './types';
import { state, setState } from './state';
import { TUTOR_COURSES } from './data';
import { renderLineChart, renderDonutChart } from './charts';
import { showFlagListModal, showEmailPreviewModal, showStudentDrillDown } from './modals';

let tutorChartsInit = false;
let expandedCourses: Set<string> = new Set(['INFO1111']);

function getStatusLabel(status: string): string {
  return status === 'green' ? 'On Track' : status === 'amber' ? 'Low Activity' : 'Inactive';
}

function getCourseByPath(courseId: string): TutorCourse | undefined {
  return TUTOR_COURSES.find((c) => c.id === courseId);
}

function getTutorialByPath(courseId: string, tutorialId: string): Tutorial | undefined {
  return getCourseByPath(courseId)?.tutorials.find((t) => t.id === tutorialId);
}

function getGroupByPath(courseId: string, tutorialId: string, groupId: string): Group | undefined {
  return getTutorialByPath(courseId, tutorialId)?.groups.find((g) => g.id === groupId);
}

function getAllFlags() {
  const flags = [];
  for (const course of TUTOR_COURSES) {
    for (const tut of course.tutorials) {
      for (const grp of tut.groups) {
        for (const flag of grp.flags) {
          flags.push(flag);
        }
      }
    }
  }
  return flags;
}

function hasCourseFlags(courseId: string): boolean {
  const course = getCourseByPath(courseId);
  if (!course) return false;
  return course.tutorials.some((t) => t.groups.some((g) => g.flags.length > 0));
}

export function renderTutorView(container: HTMLElement): void {
  tutorChartsInit = false;

  const path = state.selectedTutorPath;
  const currentGroup = path ? getGroupByPath(path.courseId, path.tutorialId, path.groupId) : null;

  container.innerHTML = `
    <div class="tutor-layout">
      <aside class="tutor-sidebar">
        <div class="tutor-sidebar__header">
          <div class="tutor-sidebar__title">My Courses</div>
          ${state.flagCount > 0 ? `
            <button class="flag-badge-btn" id="tutor-flag-list-btn" title="View all flags">
              <span class="flag-badge">${state.flagCount}</span>
              <span class="flag-badge-label">Flag${state.flagCount !== 1 ? 's' : ''}</span>
            </button>
          ` : ''}
        </div>
        <nav class="sidebar-tree" id="sidebar-tree">
          ${renderSidebarTree()}
        </nav>
      </aside>
      <main class="tutor-main">
        ${path && currentGroup ? `
          <div class="tutor-main__topbar">
            ${renderBreadcrumb()}
            <div class="tutor-topbar-actions">
              <div class="view-toggle">
                <button class="view-toggle-btn ${state.tutorView === 'graphs' ? 'view-toggle-btn--active' : ''}" id="toggle-graphs">Charts</button>
                <button class="view-toggle-btn ${state.tutorView === 'text' ? 'view-toggle-btn--active' : ''}" id="toggle-text">Table</button>
              </div>
              ${currentGroup.flags.length > 0 ? `
                <button class="btn btn--sm btn--warning" id="view-flags-btn">
                  <span class="btn-flag-icon">⚑</span> ${currentGroup.flags.length} Active Flag
                </button>
              ` : ''}
            </div>
          </div>
          ${renderDashboard(currentGroup)}
        ` : `
          <div class="tutor-empty-state">
            <div class="tutor-empty-state__icon">◈</div>
            <h3 class="tutor-empty-state__title">Select a Group</h3>
            <p class="tutor-empty-state__text">Choose a course, tutorial, and group from the sidebar to view contribution data.</p>
          </div>
        `}
      </main>
    </div>
  `;

  bindTutorEvents(container);

  if (path && currentGroup && state.tutorView === 'graphs') {
    setTimeout(() => {
      renderLineChart('tutor-line-chart', currentGroup.students);
      renderDonutChart('tutor-donut-chart', currentGroup.students);
      tutorChartsInit = true;
    }, 150);
  }
}

function renderSidebarTree(): string {
  return TUTOR_COURSES.map((course) => {
    const isExpanded = expandedCourses.has(course.id);
    const flagsExist = hasCourseFlags(course.id);

    const tutorials = isExpanded ? course.tutorials.map((tut) => {
      const tutSelected = state.selectedTutorPath?.tutorialId === tut.id;
      const groups = tut.groups.map((grp) => {
        const isSelected =
          state.selectedTutorPath?.courseId === course.id &&
          state.selectedTutorPath?.tutorialId === tut.id &&
          state.selectedTutorPath?.groupId === grp.id;

        const grpHasFlag = grp.flags.length > 0;
        const redCount = grp.students.filter((s) => s.status === 'red').length;
        const amberCount = grp.students.filter((s) => s.status === 'amber').length;

        return `
          <div class="tree-group ${isSelected ? 'tree-group--active' : ''}"
               data-course="${course.id}" data-tutorial="${tut.id}" data-group="${grp.id}">
            <div class="tree-group__name">
              ${grp.name}
              ${grpHasFlag ? `<span class="tree-flag-dot" title="Active flag"></span>` : ''}
            </div>
            <div class="tree-group__indicators">
              ${redCount > 0 ? `<span class="tree-indicator tree-indicator--red">${redCount}</span>` : ''}
              ${amberCount > 0 ? `<span class="tree-indicator tree-indicator--amber">${amberCount}</span>` : ''}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="tree-tutorial ${tutSelected ? 'tree-tutorial--open' : ''}">
          <div class="tree-tutorial__label">${tut.name}</div>
          <div class="tree-tutorial__groups">${groups}</div>
        </div>
      `;
    }).join('') : '';

    return `
      <div class="tree-course ${isExpanded ? 'tree-course--expanded' : ''}" data-course-toggle="${course.id}">
        <div class="tree-course__header">
          <div class="tree-course__chevron">${isExpanded ? '▾' : '▸'}</div>
          <div class="tree-course__name">${course.name}</div>
          ${flagsExist ? `<span class="tree-course-flag" title="Has active flags">⚑</span>` : ''}
        </div>
        <div class="tree-course__children">
          ${tutorials}
        </div>
      </div>
    `;
  }).join('');
}

function renderBreadcrumb(): string {
  const path = state.selectedTutorPath;
  if (!path) return '';
  const course = getCourseByPath(path.courseId);
  const tutorial = getTutorialByPath(path.courseId, path.tutorialId);
  const group = getGroupByPath(path.courseId, path.tutorialId, path.groupId);

  return `
    <nav class="breadcrumb">
      <span class="breadcrumb__item">${course?.name ?? ''}</span>
      <span class="breadcrumb__sep">›</span>
      <span class="breadcrumb__item">${tutorial?.name ?? ''}</span>
      <span class="breadcrumb__sep">›</span>
      <span class="breadcrumb__item breadcrumb__item--active">${group?.name ?? ''}</span>
    </nav>
  `;
}

function renderDashboard(group: Group): string {
  const students = group.students;
  const avgScore = Math.round(students.reduce((s, m) => s + m.activityScore, 0) / students.length);
  const greenCount = students.filter((s) => s.status === 'green').length;
  const amberCount = students.filter((s) => s.status === 'amber').length;
  const redCount = students.filter((s) => s.status === 'red').length;

  return `
    <div class="dashboard">
      <div class="dashboard-summary-row">
        <div class="summary-card">
          <div class="summary-card__val">${students.length}</div>
          <div class="summary-card__label">Members</div>
        </div>
        <div class="summary-card">
          <div class="summary-card__val summary-card__val--score">${avgScore}</div>
          <div class="summary-card__label">Avg Score</div>
        </div>
        <div class="summary-card">
          <div class="summary-card__val summary-card__val--green">${greenCount}</div>
          <div class="summary-card__label">On Track</div>
        </div>
        <div class="summary-card">
          <div class="summary-card__val summary-card__val--amber">${amberCount}</div>
          <div class="summary-card__label">Low Activity</div>
        </div>
        <div class="summary-card">
          <div class="summary-card__val summary-card__val--red">${redCount}</div>
          <div class="summary-card__label">Inactive</div>
        </div>
      </div>

      ${state.tutorView === 'graphs' ? `
        <div class="dashboard-charts">
          <div class="chart-card">
            <div class="chart-card__title">Weekly Activity Trend</div>
            <div class="chart-card__body">
              <canvas id="tutor-line-chart" height="260"></canvas>
            </div>
          </div>
          <div class="chart-card">
            <div class="chart-card__title">Contribution Split</div>
            <div class="chart-card__body">
              <canvas id="tutor-donut-chart" height="260"></canvas>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="contribution-table-section">
        <div class="contribution-table-header">
          <h4 class="contribution-table-title">Student Contributions</h4>
        </div>
        ${renderContributionTable(students)}
      </div>

      ${group.flags.length > 0 ? `
        <div class="flag-panel">
          <div class="flag-panel__header">
            <div class="flag-panel__icon">⚑</div>
            <div class="flag-panel__info">
              <div class="flag-panel__title">Active Contribution Flag</div>
              <div class="flag-panel__sub">Peer flag for ${group.flags[0].targetName} — voting in progress</div>
            </div>
            <button class="btn btn--sm btn--primary" id="view-email-preview-btn">View Email Preview</button>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

export function renderContributionTable(students: Student[]): string {
  const rows = students.map((student) => {
    const statusLabel = getStatusLabel(student.status);
    const scoreBar = `
      <div class="score-bar-wrap">
        <div class="score-bar">
          <div class="score-bar__fill score-bar__fill--${student.status}" style="width: ${student.activityScore}%"></div>
        </div>
        <span class="score-bar__val">${student.activityScore}</span>
      </div>
    `;
    return `
      <tr class="contrib-row contrib-row--${student.status}">
        <td class="contrib-cell contrib-cell--name">
          <div class="contrib-avatar contrib-avatar--${student.status}">${student.initials}</div>
          <span class="contrib-name">${student.name}</span>
        </td>
        <td class="contrib-cell contrib-cell--num">${student.messagesThisWeek}</td>
        <td class="contrib-cell contrib-cell--num">${student.filesUploaded}</td>
        <td class="contrib-cell contrib-cell--last">${student.lastActive}</td>
        <td class="contrib-cell contrib-cell--score">${scoreBar}</td>
        <td class="contrib-cell contrib-cell--status">
          <div class="pill pill--${student.status}">${statusLabel}</div>
        </td>
        <td class="contrib-cell contrib-cell--actions">
          <button class="btn btn--xs btn--ghost tutor-drill-btn" data-student-id="${student.id}" title="View details">Details</button>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="table-wrap">
      <table class="contrib-table">
        <thead>
          <tr>
            <th class="contrib-th">Name</th>
            <th class="contrib-th contrib-th--num">Messages</th>
            <th class="contrib-th contrib-th--num">Files</th>
            <th class="contrib-th">Last Active</th>
            <th class="contrib-th contrib-th--score">Activity Score</th>
            <th class="contrib-th">Status</th>
            <th class="contrib-th"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function bindTutorEvents(container: HTMLElement): void {
  // Sidebar tree: course toggle
  container.querySelectorAll('[data-course-toggle]').forEach((el) => {
    el.addEventListener('click', () => {
      const courseId = (el as HTMLElement).dataset.courseToggle!;
      if (expandedCourses.has(courseId)) {
        expandedCourses.delete(courseId);
      } else {
        expandedCourses.add(courseId);
      }
      const tree = container.querySelector('#sidebar-tree');
      if (tree) tree.innerHTML = renderSidebarTree();
      // Rebind after re-render
      bindTreeGroupEvents(container);
      bindCourseToggleEvents(container);
    });
  });

  bindTreeGroupEvents(container);

  // View toggle
  container.querySelector('#toggle-graphs')?.addEventListener('click', () => {
    if (state.tutorView !== 'graphs') {
      setState({ tutorView: 'graphs' });
      const path = state.selectedTutorPath;
      if (path) {
        const group = getGroupByPath(path.courseId, path.tutorialId, path.groupId);
        if (group) {
          const main = container.querySelector('.tutor-main');
          if (main) {
            main.innerHTML = `
              <div class="tutor-main__topbar">
                ${renderBreadcrumb()}
                <div class="tutor-topbar-actions">
                  <div class="view-toggle">
                    <button class="view-toggle-btn view-toggle-btn--active" id="toggle-graphs">Charts</button>
                    <button class="view-toggle-btn" id="toggle-text">Table</button>
                  </div>
                  ${group.flags.length > 0 ? `<button class="btn btn--sm btn--warning" id="view-flags-btn"><span class="btn-flag-icon">⚑</span> ${group.flags.length} Active Flag</button>` : ''}
                </div>
              </div>
              ${renderDashboard(group)}
            `;
            bindTutorMainEvents(main as HTMLElement, group);
            setTimeout(() => {
              renderLineChart('tutor-line-chart', group.students);
              renderDonutChart('tutor-donut-chart', group.students);
            }, 100);
          }
        }
      }
    }
  });

  container.querySelector('#toggle-text')?.addEventListener('click', () => {
    if (state.tutorView !== 'text') {
      setState({ tutorView: 'text' });
      const path = state.selectedTutorPath;
      if (path) {
        const group = getGroupByPath(path.courseId, path.tutorialId, path.groupId);
        if (group) {
          const main = container.querySelector('.tutor-main');
          if (main) {
            main.innerHTML = `
              <div class="tutor-main__topbar">
                ${renderBreadcrumb()}
                <div class="tutor-topbar-actions">
                  <div class="view-toggle">
                    <button class="view-toggle-btn" id="toggle-graphs">Charts</button>
                    <button class="view-toggle-btn view-toggle-btn--active" id="toggle-text">Table</button>
                  </div>
                  ${group.flags.length > 0 ? `<button class="btn btn--sm btn--warning" id="view-flags-btn"><span class="btn-flag-icon">⚑</span> ${group.flags.length} Active Flag</button>` : ''}
                </div>
              </div>
              ${renderDashboard(group)}
            `;
            bindTutorMainEvents(main as HTMLElement, group);
          }
        }
      }
    }
  });

  const path = state.selectedTutorPath;
  if (path) {
    const group = getGroupByPath(path.courseId, path.tutorialId, path.groupId);
    if (group) bindTutorMainEvents(container, group);
  }

  container.querySelector('#tutor-flag-list-btn')?.addEventListener('click', () => {
    const flags = getAllFlags();
    showFlagListModal(flags);
  });
}

function bindCourseToggleEvents(container: HTMLElement): void {
  container.querySelectorAll('[data-course-toggle]').forEach((el) => {
    el.addEventListener('click', () => {
      const courseId = (el as HTMLElement).dataset.courseToggle!;
      if (expandedCourses.has(courseId)) {
        expandedCourses.delete(courseId);
      } else {
        expandedCourses.add(courseId);
      }
      const tree = container.querySelector('#sidebar-tree');
      if (tree) tree.innerHTML = renderSidebarTree();
      bindTreeGroupEvents(container);
      bindCourseToggleEvents(container);
    });
  });
}

function bindTreeGroupEvents(container: HTMLElement): void {
  container.querySelectorAll('.tree-group').forEach((el) => {
    el.addEventListener('click', () => {
      const courseId = (el as HTMLElement).dataset.course!;
      const tutorialId = (el as HTMLElement).dataset.tutorial!;
      const groupId = (el as HTMLElement).dataset.group!;

      setState({ selectedTutorPath: { courseId, tutorialId, groupId }, tutorView: 'graphs' });

      container.querySelectorAll('.tree-group').forEach((g) => g.classList.remove('tree-group--active'));
      el.classList.add('tree-group--active');

      const group = getGroupByPath(courseId, tutorialId, groupId);
      if (!group) return;

      const main = container.querySelector('.tutor-main');
      if (!main) return;

      main.innerHTML = `
        <div class="tutor-main__topbar">
          ${renderBreadcrumb()}
          <div class="tutor-topbar-actions">
            <div class="view-toggle">
              <button class="view-toggle-btn view-toggle-btn--active" id="toggle-graphs">Charts</button>
              <button class="view-toggle-btn" id="toggle-text">Table</button>
            </div>
            ${group.flags.length > 0 ? `<button class="btn btn--sm btn--warning" id="view-flags-btn"><span class="btn-flag-icon">⚑</span> ${group.flags.length} Active Flag</button>` : ''}
          </div>
        </div>
        ${renderDashboard(group)}
      `;

      bindTutorMainEvents(main as HTMLElement, group);
      setTimeout(() => {
        renderLineChart('tutor-line-chart', group.students);
        renderDonutChart('tutor-donut-chart', group.students);
      }, 150);
    });
  });
}

function bindTutorMainEvents(main: HTMLElement, group: Group): void {
  main.querySelector('#toggle-graphs')?.addEventListener('click', () => {
    if (state.tutorView !== 'graphs') {
      setState({ tutorView: 'graphs' });
      main.innerHTML = `
        <div class="tutor-main__topbar">
          ${renderBreadcrumb()}
          <div class="tutor-topbar-actions">
            <div class="view-toggle">
              <button class="view-toggle-btn view-toggle-btn--active" id="toggle-graphs">Charts</button>
              <button class="view-toggle-btn" id="toggle-text">Table</button>
            </div>
            ${group.flags.length > 0 ? `<button class="btn btn--sm btn--warning" id="view-flags-btn"><span class="btn-flag-icon">⚑</span> ${group.flags.length} Active Flag</button>` : ''}
          </div>
        </div>
        ${renderDashboard(group)}
      `;
      bindTutorMainEvents(main, group);
      setTimeout(() => {
        renderLineChart('tutor-line-chart', group.students);
        renderDonutChart('tutor-donut-chart', group.students);
      }, 100);
    }
  });

  main.querySelector('#toggle-text')?.addEventListener('click', () => {
    if (state.tutorView !== 'text') {
      setState({ tutorView: 'text' });
      main.innerHTML = `
        <div class="tutor-main__topbar">
          ${renderBreadcrumb()}
          <div class="tutor-topbar-actions">
            <div class="view-toggle">
              <button class="view-toggle-btn" id="toggle-graphs">Charts</button>
              <button class="view-toggle-btn view-toggle-btn--active" id="toggle-text">Table</button>
            </div>
            ${group.flags.length > 0 ? `<button class="btn btn--sm btn--warning" id="view-flags-btn"><span class="btn-flag-icon">⚑</span> ${group.flags.length} Active Flag</button>` : ''}
          </div>
        </div>
        ${renderDashboard(group)}
      `;
      bindTutorMainEvents(main, group);
    }
  });

  main.querySelector('#view-flags-btn')?.addEventListener('click', () => {
    showFlagListModal(group.flags);
  });

  main.querySelector('#view-email-preview-btn')?.addEventListener('click', () => {
    if (group.flags.length > 0) showEmailPreviewModal(group.flags[0]);
  });

  main.querySelectorAll('.tutor-drill-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const studentId = (btn as HTMLElement).dataset.studentId!;
      const student = group.students.find((s) => s.id === studentId);
      if (student) showStudentDrillDown(student);
    });
  });
}
