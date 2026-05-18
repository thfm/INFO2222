import type { Student, ChatMessage, Course, TutorCourse, Flag } from './types';

export const CURRENT_USER: Student = {
  id: 'student-1',
  name: 'Alex Chen',
  initials: 'AC',
  status: 'green',
  lastActive: 'Just now',
  messagesThisWeek: 24,
  filesUploaded: 5,
  activityScore: 87,
  daysInactive: 0,
  weeklyActivity: [12, 15, 18, 20, 22, 19, 24, 18],
};

export const COURSES: Course[] = [
  { id: 'INFO2222', name: 'INFO2222', dueText: 'Due in 3 days', daysUntilDue: 3 },
  { id: 'COMP2017', name: 'COMP2017', dueText: 'Due in 1 week', daysUntilDue: 7 },
  { id: 'COMP2823', name: 'COMP2823', dueText: 'Due in 2 weeks', daysUntilDue: 14 },
  { id: 'DATA1001', name: 'DATA1001', dueText: 'Due in 5 days', daysUntilDue: 5 },
];

export const GROUP_MEMBERS: Student[] = [
  {
    id: 'student-1',
    name: 'Alex Chen',
    initials: 'AC',
    status: 'green',
    lastActive: 'Just now',
    messagesThisWeek: 24,
    filesUploaded: 5,
    activityScore: 87,
    daysInactive: 0,
    weeklyActivity: [12, 15, 18, 20, 22, 19, 24, 18],
  },
  {
    id: 'student-2',
    name: 'Jordan Lee',
    initials: 'JL',
    status: 'amber',
    lastActive: '2 days ago',
    messagesThisWeek: 8,
    filesUploaded: 2,
    activityScore: 52,
    daysInactive: 2,
    weeklyActivity: [8, 10, 12, 9, 6, 7, 8, 5],
  },
  {
    id: 'student-3',
    name: 'Sam Patel',
    initials: 'SP',
    status: 'red',
    lastActive: '8 days ago',
    messagesThisWeek: 1,
    filesUploaded: 0,
    activityScore: 18,
    daysInactive: 8,
    weeklyActivity: [3, 5, 4, 2, 1, 0, 1, 0],
  },
  {
    id: 'student-4',
    name: 'Riley Nguyen',
    initials: 'RN',
    status: 'green',
    lastActive: '30 mins ago',
    messagesThisWeek: 28,
    filesUploaded: 6,
    activityScore: 91,
    daysInactive: 0,
    weeklyActivity: [14, 18, 22, 25, 20, 28, 26, 22],
  },
  {
    id: 'student-5',
    name: 'Morgan Taylor',
    initials: 'MT',
    status: 'amber',
    lastActive: '3 days ago',
    messagesThisWeek: 5,
    filesUploaded: 1,
    activityScore: 45,
    daysInactive: 3,
    weeklyActivity: [6, 8, 7, 5, 4, 5, 5, 3],
  },
];

export const CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    senderId: 'student-4',
    senderName: 'Riley Nguyen',
    content: 'Hey everyone! I just pushed the updated database schema to the repo. Can someone review it before our next meeting?',
    timestamp: '9:14 AM',
  },
  {
    id: 'msg-2',
    senderId: 'student-1',
    senderName: 'Alex Chen',
    content: 'On it! Looks good so far. I noticed you added an index on the users table — nice touch. I\'ll leave comments on the PR.',
    timestamp: '9:22 AM',
  },
  {
    id: 'msg-3',
    senderId: 'student-2',
    senderName: 'Jordan Lee',
    content: 'Sorry I\'ve been quiet the last couple days. Semester has been hectic. I\'ll catch up on the PR today and start on the API endpoints.',
    timestamp: '10:05 AM',
  },
  {
    id: 'msg-4',
    senderId: 'student-1',
    senderName: 'Alex Chen',
    content: 'No worries Jordan! We still have a few days before the deadline. The main blockers right now are the authentication flow and the frontend components for the dashboard.',
    timestamp: '10:11 AM',
  },
  {
    id: 'msg-5',
    senderId: 'student-4',
    senderName: 'Riley Nguyen',
    content: 'I can take the auth flow — I\'ve done JWT before. Alex, could you handle the dashboard layout while Jordan works on the endpoints?',
    timestamp: '10:18 AM',
  },
  {
    id: 'msg-6',
    senderId: 'student-1',
    senderName: 'Alex Chen',
    content: 'Perfect split. I\'ll have a draft dashboard up by tomorrow evening. Also reminder — group report draft is due this Friday, not next week!',
    timestamp: '10:25 AM',
  },
  {
    id: 'msg-7',
    senderId: 'student-5',
    senderName: 'Morgan Taylor',
    content: 'Thanks for the reminder Alex. I\'ll work on the introduction and background sections tonight. Can someone share the marking rubric again?',
    timestamp: '11:03 AM',
  },
  {
    id: 'msg-8',
    senderId: 'student-4',
    senderName: 'Riley Nguyen',
    content: 'Here you go Morgan — it\'s in the shared Drive folder under "Assessment / Phase 1". Let me know if you can\'t access it.',
    timestamp: '11:09 AM',
  },
  {
    id: 'msg-9',
    senderId: 'student-1',
    senderName: 'Alex Chen',
    content: 'Has anyone heard from Sam recently? They haven\'t responded to messages in over a week. We might need to redistribute their tasks.',
    timestamp: '2:45 PM',
  },
  {
    id: 'msg-10',
    senderId: 'student-2',
    senderName: 'Jordan Lee',
    content: 'I reached out via email but nothing. I think we should let the tutor know soon if they don\'t respond by tomorrow.',
    timestamp: '3:02 PM',
  },
];

// Tutor-side data
const tutorGroup03Flag: Flag = {
  id: 'flag-1',
  targetStudentId: 't-student-3',
  targetName: 'Casey Birch',
  initiatorId: 't-student-1',
  initiatorName: 'Priya Sharma',
  groupId: 'tut13-grp03',
  groupName: 'Group 03',
  courseId: 'INFO1111',
  courseName: 'INFO1111',
  tutorialName: 'Tutorial 13',
  votes: {
    't-student-1': true,
    't-student-2': null,
    't-student-4': null,
  },
  status: 'voting',
  createdAt: '2026-03-28T14:22:00Z',
  emailPreview: `From: ContriTrack System <no-reply@contritrack.edu.au>
To: tutor-hayes@university.edu.au
Subject: [INFO1111 - Tutorial 13 - Group 03] Contribution Flag Escalation Notice

Dear Tutor Hayes,

A peer contribution flag has been escalated to your attention for the following student:

  Student:  Casey Birch (SID: 510043821)
  Course:   INFO1111 — Information Technologies in Society
  Tutorial: Tutorial 13
  Group:    Group 03

The flag was initiated by Priya Sharma on 28 March 2026 and has received a unanimous vote from all participating group members.

--- CONTRIBUTION EVIDENCE ---

  Messages sent (last 4 weeks): 2
  Files uploaded: 0
  Last active: 11 days ago
  Activity score: 12 / 100

Group members report that Casey has not responded to group chat messages, missed two scheduled meetings, and has not completed their assigned tasks (API integration and testing documentation) within the agreed timeframe.

--- NEXT STEPS ---

As the allocated tutor, please review this case and take appropriate action, which may include:
  • Contacting the student directly
  • Scheduling a check-in meeting
  • Applying a contribution adjustment if warranted

You can view full contribution data and chat logs in the ContriTrack dashboard.

This is an automated notification. Do not reply to this email.

— ContriTrack, University of Sydney`,
};

export const TUTOR_COURSES: TutorCourse[] = [
  {
    id: 'INFO1111',
    name: 'INFO1111',
    tutorials: [
      {
        id: 'tut13',
        name: 'Tutorial 13',
        groups: [
          {
            id: 'tut13-grp01',
            name: 'Group 01',
            flags: [],
            students: [
              { id: 't-s1-g1', name: 'Priya Sharma', initials: 'PS', status: 'green', lastActive: '1 hour ago', messagesThisWeek: 22, filesUploaded: 4, activityScore: 84, daysInactive: 0, weeklyActivity: [10, 14, 16, 18, 15, 20, 22, 17] },
              { id: 't-s2-g1', name: 'Lucas Wright', initials: 'LW', status: 'green', lastActive: '2 hours ago', messagesThisWeek: 18, filesUploaded: 3, activityScore: 76, daysInactive: 0, weeklyActivity: [9, 12, 14, 16, 14, 17, 18, 15] },
              { id: 't-s3-g1', name: 'Aisha Okonkwo', initials: 'AO', status: 'amber', lastActive: '2 days ago', messagesThisWeek: 6, filesUploaded: 1, activityScore: 48, daysInactive: 2, weeklyActivity: [7, 9, 8, 6, 5, 7, 6, 4] },
              { id: 't-s4-g1', name: 'Ben Kim', initials: 'BK', status: 'green', lastActive: '4 hours ago', messagesThisWeek: 20, filesUploaded: 5, activityScore: 89, daysInactive: 0, weeklyActivity: [12, 15, 18, 20, 19, 22, 20, 18] },
            ],
          },
          {
            id: 'tut13-grp02',
            name: 'Group 02',
            flags: [],
            students: [
              { id: 't-s1-g2', name: 'Sofia Russo', initials: 'SR', status: 'green', lastActive: 'Just now', messagesThisWeek: 26, filesUploaded: 5, activityScore: 92, daysInactive: 0, weeklyActivity: [14, 17, 20, 22, 21, 25, 26, 20] },
              { id: 't-s2-g2', name: 'Marcus Bell', initials: 'MB', status: 'green', lastActive: '1 hour ago', messagesThisWeek: 19, filesUploaded: 4, activityScore: 81, daysInactive: 0, weeklyActivity: [10, 13, 15, 17, 16, 19, 19, 16] },
              { id: 't-s3-g2', name: 'Yuki Tanaka', initials: 'YT', status: 'amber', lastActive: '3 days ago', messagesThisWeek: 4, filesUploaded: 1, activityScore: 41, daysInactive: 3, weeklyActivity: [6, 8, 7, 5, 4, 5, 4, 3] },
              { id: 't-s4-g2', name: 'Oliver Grant', initials: 'OG', status: 'green', lastActive: '30 mins ago', messagesThisWeek: 21, filesUploaded: 4, activityScore: 85, daysInactive: 0, weeklyActivity: [11, 14, 16, 18, 17, 21, 21, 17] },
              { id: 't-s5-g2', name: 'Fatima Al-Amin', initials: 'FA', status: 'green', lastActive: '2 hours ago', messagesThisWeek: 17, filesUploaded: 3, activityScore: 78, daysInactive: 0, weeklyActivity: [9, 12, 14, 15, 14, 17, 17, 14] },
            ],
          },
          {
            id: 'tut13-grp03',
            name: 'Group 03',
            flags: [tutorGroup03Flag],
            students: [
              { id: 't-student-1', name: 'Priya Sharma', initials: 'PS', status: 'green', lastActive: '1 hour ago', messagesThisWeek: 20, filesUploaded: 4, activityScore: 82, daysInactive: 0, weeklyActivity: [11, 14, 16, 18, 16, 19, 20, 16] },
              { id: 't-student-2', name: 'Tom Russo', initials: 'TR', status: 'green', lastActive: '3 hours ago', messagesThisWeek: 16, filesUploaded: 3, activityScore: 74, daysInactive: 0, weeklyActivity: [9, 12, 13, 15, 13, 16, 16, 14] },
              { id: 't-student-3', name: 'Casey Birch', initials: 'CB', status: 'red', lastActive: '11 days ago', messagesThisWeek: 0, filesUploaded: 0, activityScore: 12, daysInactive: 11, weeklyActivity: [4, 6, 5, 3, 1, 0, 0, 0] },
              { id: 't-student-4', name: 'Nadia Foster', initials: 'NF', status: 'amber', lastActive: '4 days ago', messagesThisWeek: 5, filesUploaded: 1, activityScore: 44, daysInactive: 4, weeklyActivity: [7, 9, 8, 6, 5, 6, 5, 3] },
            ],
          },
        ],
      },
      {
        id: 'tut14',
        name: 'Tutorial 14',
        groups: [
          {
            id: 'tut14-grp01',
            name: 'Group 01',
            flags: [],
            students: [
              { id: 't14-s1', name: 'Ethan Brooks', initials: 'EB', status: 'green', lastActive: '2 hours ago', messagesThisWeek: 23, filesUploaded: 5, activityScore: 88, daysInactive: 0, weeklyActivity: [12, 15, 17, 19, 18, 21, 23, 18] },
              { id: 't14-s2', name: 'Lena Vogel', initials: 'LV', status: 'green', lastActive: '1 hour ago', messagesThisWeek: 19, filesUploaded: 4, activityScore: 80, daysInactive: 0, weeklyActivity: [10, 13, 15, 17, 15, 18, 19, 16] },
              { id: 't14-s3', name: 'Ahmad Karimi', initials: 'AK', status: 'amber', lastActive: '2 days ago', messagesThisWeek: 7, filesUploaded: 2, activityScore: 55, daysInactive: 2, weeklyActivity: [8, 10, 9, 8, 7, 8, 7, 5] },
              { id: 't14-s4', name: 'Chloe Martin', initials: 'CM', status: 'green', lastActive: '4 hours ago', messagesThisWeek: 21, filesUploaded: 4, activityScore: 83, daysInactive: 0, weeklyActivity: [11, 14, 16, 18, 17, 20, 21, 17] },
            ],
          },
          {
            id: 'tut14-grp02',
            name: 'Group 02',
            flags: [],
            students: [
              { id: 't14-s5', name: 'James Liu', initials: 'JL', status: 'green', lastActive: 'Just now', messagesThisWeek: 25, filesUploaded: 6, activityScore: 93, daysInactive: 0, weeklyActivity: [13, 17, 20, 22, 21, 24, 25, 21] },
              { id: 't14-s6', name: 'Sara Novak', initials: 'SN', status: 'green', lastActive: '1 hour ago', messagesThisWeek: 18, filesUploaded: 3, activityScore: 77, daysInactive: 0, weeklyActivity: [9, 12, 14, 16, 14, 17, 18, 15] },
              { id: 't14-s7', name: 'Dev Kapoor', initials: 'DK', status: 'red', lastActive: '9 days ago', messagesThisWeek: 1, filesUploaded: 0, activityScore: 15, daysInactive: 9, weeklyActivity: [5, 7, 6, 4, 2, 1, 1, 0] },
              { id: 't14-s8', name: 'Isabelle Morin', initials: 'IM', status: 'amber', lastActive: '3 days ago', messagesThisWeek: 6, filesUploaded: 1, activityScore: 47, daysInactive: 3, weeklyActivity: [7, 9, 8, 6, 5, 6, 6, 4] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'INFO2222',
    name: 'INFO2222',
    tutorials: [
      {
        id: 'tut07',
        name: 'Tutorial 07',
        groups: [
          {
            id: 'tut07-grp01',
            name: 'Group 01',
            flags: [],
            students: [
              { id: 'i2-s1', name: 'Zara Ahmed', initials: 'ZA', status: 'green', lastActive: '1 hour ago', messagesThisWeek: 21, filesUploaded: 4, activityScore: 85, daysInactive: 0, weeklyActivity: [11, 14, 16, 18, 17, 20, 21, 17] },
              { id: 'i2-s2', name: 'Liam Chen', initials: 'LC', status: 'green', lastActive: '2 hours ago', messagesThisWeek: 17, filesUploaded: 3, activityScore: 79, daysInactive: 0, weeklyActivity: [9, 12, 14, 15, 14, 16, 17, 14] },
              { id: 'i2-s3', name: 'Nina Petrov', initials: 'NP', status: 'amber', lastActive: '1 day ago', messagesThisWeek: 9, filesUploaded: 2, activityScore: 58, daysInactive: 1, weeklyActivity: [8, 10, 9, 8, 8, 9, 9, 7] },
              { id: 'i2-s4', name: 'Oscar Diaz', initials: 'OD', status: 'green', lastActive: '3 hours ago', messagesThisWeek: 20, filesUploaded: 5, activityScore: 87, daysInactive: 0, weeklyActivity: [12, 15, 17, 19, 18, 21, 20, 17] },
              { id: 'i2-s5', name: 'Mei Lin', initials: 'ML', status: 'green', lastActive: '30 mins ago', messagesThisWeek: 24, filesUploaded: 5, activityScore: 90, daysInactive: 0, weeklyActivity: [13, 16, 19, 21, 20, 23, 24, 20] },
            ],
          },
          {
            id: 'tut07-grp02',
            name: 'Group 02',
            flags: [],
            students: [
              { id: 'i2-s6', name: 'Felix Wagner', initials: 'FW', status: 'green', lastActive: '2 hours ago', messagesThisWeek: 19, filesUploaded: 4, activityScore: 82, daysInactive: 0, weeklyActivity: [10, 13, 15, 17, 16, 18, 19, 16] },
              { id: 'i2-s7', name: 'Amara Osei', initials: 'AO', status: 'amber', lastActive: '4 days ago', messagesThisWeek: 4, filesUploaded: 1, activityScore: 38, daysInactive: 4, weeklyActivity: [6, 8, 7, 5, 4, 5, 4, 3] },
              { id: 'i2-s8', name: 'Ryan Park', initials: 'RP', status: 'green', lastActive: '1 hour ago', messagesThisWeek: 22, filesUploaded: 4, activityScore: 86, daysInactive: 0, weeklyActivity: [11, 14, 16, 18, 17, 20, 22, 18] },
              { id: 'i2-s9', name: 'Hannah White', initials: 'HW', status: 'green', lastActive: '3 hours ago', messagesThisWeek: 15, filesUploaded: 3, activityScore: 73, daysInactive: 0, weeklyActivity: [8, 11, 13, 14, 13, 15, 15, 13] },
            ],
          },
        ],
      },
    ],
  },
];
