export type ContributionStatus = 'green' | 'amber' | 'red';
export type FlagStatus = 'voting' | 'passed' | 'dismissed';
export type ViewMode = 'student' | 'tutor';

export interface Student {
  id: string;
  name: string;
  initials: string;
  status: ContributionStatus;
  lastActive: string;
  messagesThisWeek: number;
  filesUploaded: number;
  activityScore: number;
  daysInactive: number;
  weeklyActivity: number[]; // 8 weeks of data
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  encrypted?: boolean;
}

export interface Course {
  id: string;
  name: string;
  dueText: string;
  daysUntilDue: number;
}

export interface Flag {
  id: string;
  targetStudentId: string;
  targetName: string;
  initiatorId: string;
  initiatorName: string;
  groupId: string;
  groupName: string;
  courseId: string;
  courseName: string;
  tutorialName: string;
  votes: Record<string, boolean | null>; // studentId -> true/false/null (pending)
  status: FlagStatus;
  createdAt: string;
  emailPreview?: string;
}

export interface Group {
  id: string;
  name: string;
  students: Student[];
  flags: Flag[];
}

export interface Tutorial {
  id: string;
  name: string;
  groups: Group[];
}

export interface TutorCourse {
  id: string;
  name: string;
  tutorials: Tutorial[];
}
