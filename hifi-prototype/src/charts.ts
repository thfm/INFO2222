import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
  DoughnutController,
  ArcElement,
  BarController,
  BarElement,
} from 'chart.js';

import type { Student } from './types';
import { state } from './state';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
  DoughnutController,
  ArcElement,
  BarController,
  BarElement
);

const STUDENT_COLORS = [
  '#0ff5c0',
  '#60a5fa',
  '#f472b6',
  '#fb923c',
  '#a78bfa',
  '#34d399',
  '#fbbf24',
];

const STATUS_COLORS: Record<string, string> = {
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
};

const chartInstances: Map<string, Chart> = new Map();

function destroyChart(canvasId: string): void {
  const existing = chartInstances.get(canvasId);
  if (existing) {
    existing.destroy();
    chartInstances.delete(canvasId);
  }
}

function getTextColor(): string {
  return state.isDarkMode ? '#c9cde8' : '#1a1d2e';
}

function getGridColor(): string {
  return state.isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
}

function getTickColor(): string {
  return state.isDarkMode ? '#6b7280' : '#9ca3af';
}

export function renderLineChart(canvasId: string, students: Student[]): void {
  destroyChart(canvasId);

  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return;

  const weeks = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Wk 7', 'Wk 8'];

  const datasets = students.map((student, i) => ({
    label: student.name,
    data: student.weeklyActivity,
    borderColor: STUDENT_COLORS[i % STUDENT_COLORS.length],
    backgroundColor: STUDENT_COLORS[i % STUDENT_COLORS.length] + '18',
    pointBackgroundColor: STUDENT_COLORS[i % STUDENT_COLORS.length],
    pointBorderColor: STUDENT_COLORS[i % STUDENT_COLORS.length],
    pointRadius: 4,
    pointHoverRadius: 6,
    borderWidth: 2.5,
    tension: 0.4,
    fill: false,
  }));

  const chart = new Chart(canvas, {
    type: 'line',
    data: { labels: weeks, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: getTextColor(),
            font: { family: 'DM Sans', size: 12 },
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
          },
        },
        tooltip: {
          backgroundColor: state.isDarkMode ? '#1e2235' : '#ffffff',
          titleColor: state.isDarkMode ? '#f1f5f9' : '#1a1d2e',
          bodyColor: state.isDarkMode ? '#94a3b8' : '#64748b',
          borderColor: state.isDarkMode ? '#2d3354' : '#e2e8f0',
          borderWidth: 1,
          padding: 12,
          titleFont: { family: 'DM Sans', weight: 'bold' as const },
          bodyFont: { family: 'DM Sans' },
        },
      },
      scales: {
        x: {
          grid: { color: getGridColor() },
          ticks: {
            color: getTickColor(),
            font: { family: 'DM Sans', size: 11 },
          },
          border: { display: false },
        },
        y: {
          grid: { color: getGridColor() },
          ticks: {
            color: getTickColor(),
            font: { family: 'DM Sans', size: 11 },
            stepSize: 5,
          },
          border: { display: false },
          min: 0,
        },
      },
    },
  });

  chartInstances.set(canvasId, chart);
}

export function renderDonutChart(canvasId: string, students: Student[]): void {
  destroyChart(canvasId);

  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return;

  const totalActivity = students.reduce((sum, s) => sum + s.activityScore, 0);

  const chart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: students.map((s) => s.name),
      datasets: [
        {
          data: students.map((s) => s.activityScore),
          backgroundColor: students.map((s) => STATUS_COLORS[s.status] + 'cc'),
          borderColor: students.map((s) => STATUS_COLORS[s.status]),
          borderWidth: 2,
          hoverOffset: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      animation: { duration: 600 },
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: getTextColor(),
            font: { family: 'DM Sans', size: 12 },
            padding: 14,
            usePointStyle: true,
            generateLabels(chart) {
              const meta = chart.getDatasetMeta(0);
              return students.map((s, i) => ({
                text: `${s.name} — ${Math.round((s.activityScore / totalActivity) * 100)}%`,
                fillStyle: STATUS_COLORS[s.status] + 'cc',
                strokeStyle: STATUS_COLORS[s.status],
                lineWidth: 1,
                hidden: !!(meta.data[i] as unknown as { hidden?: boolean })?.hidden,
                index: i,
                fontColor: getTextColor(),
                pointStyle: 'circle',
              }));
            },
          },
        },
        tooltip: {
          backgroundColor: state.isDarkMode ? '#1e2235' : '#ffffff',
          titleColor: state.isDarkMode ? '#f1f5f9' : '#1a1d2e',
          bodyColor: state.isDarkMode ? '#94a3b8' : '#64748b',
          borderColor: state.isDarkMode ? '#2d3354' : '#e2e8f0',
          borderWidth: 1,
          padding: 12,
          titleFont: { family: 'DM Sans', weight: 'bold' as const },
          bodyFont: { family: 'DM Sans' },
          callbacks: {
            label(ctx) {
              const pct = Math.round((ctx.parsed / totalActivity) * 100);
              return ` ${ctx.label}: ${ctx.parsed} pts (${pct}%)`;
            },
          },
        },
      },
    },
  });

  chartInstances.set(canvasId, chart);
}

export function renderStudentActivityChart(canvasId: string, student: Student): void {
  destroyChart(canvasId);

  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return;

  const weeks = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Wk 7', 'Wk 8'];
  const color = STATUS_COLORS[student.status];

  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: weeks,
      datasets: [
        {
          label: 'Activity',
          data: student.weeklyActivity,
          backgroundColor: color + '80',
          borderColor: color,
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: state.isDarkMode ? '#1e2235' : '#ffffff',
          titleColor: state.isDarkMode ? '#f1f5f9' : '#1a1d2e',
          bodyColor: state.isDarkMode ? '#94a3b8' : '#64748b',
          borderColor: state.isDarkMode ? '#2d3354' : '#e2e8f0',
          borderWidth: 1,
          padding: 10,
          bodyFont: { family: 'DM Sans' },
          titleFont: { family: 'DM Sans', weight: 'bold' as const },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: getTickColor(), font: { family: 'DM Sans', size: 11 } },
          border: { display: false },
        },
        y: {
          grid: { color: getGridColor() },
          ticks: { color: getTickColor(), font: { family: 'DM Sans', size: 11 } },
          border: { display: false },
          min: 0,
        },
      },
    },
  });

  chartInstances.set(canvasId, chart);
}

export function destroyAllCharts(): void {
  chartInstances.forEach((chart) => chart.destroy());
  chartInstances.clear();
}
