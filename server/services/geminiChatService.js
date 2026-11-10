import { GoogleGenerativeAI } from '@google/generative-ai';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Timetable from '../models/Timetable.js';
import Attendance from '../models/Attendance.js';
import Assignment from '../models/Assignment.js';
import Exam from '../models/Exam.js';
import {
  getOverallAnalytics,
  getSubjectAnalytics,
  calculateSafeBunks,
  calculateClassesNeeded,
} from './attendanceAnalyticsService.js';
import { DAYS } from '../config/constants.js';

/**
 * Backend Tool Implementations (Strictly isolated to authenticated userId)
 */
export const academicTools = {
  async getStudentProfile(userId) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) return { error: 'User not found' };
    return {
      name: user.name,
      college: user.collegeName || 'Not configured',
      course: user.course || 'Not configured',
      branch: user.branch || 'Not configured',
      semester: user.semester || 1,
      section: user.section || 'N/A',
      batch: user.batch || 'N/A',
      attendanceThreshold: user.attendanceThreshold || 75,
    };
  },

  async getTodayTimetable(userId) {
    const now = new Date();
    const dayName = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];
    const slots = await Timetable.find({ userId, day: dayName, status: 'Active' })
      .populate('subjectId')
      .sort({ startTime: 1 });

    return {
      day: dayName,
      totalClasses: slots.length,
      schedule: slots.map((s) => ({
        subject: s.subjectId?.name || 'Class',
        code: s.subjectId?.code || '',
        room: s.room || 'TBA',
        faculty: s.faculty || s.subjectId?.faculty || 'TBA',
        startTime: s.startTime,
        endTime: s.endTime,
        type: s.classType,
      })),
    };
  },

  async getWeeklyTimetable(userId, day = null) {
    const query = { userId, status: 'Active' };
    if (day) query.day = day;
    const slots = await Timetable.find(query)
      .populate('subjectId')
      .sort({ day: 1, startTime: 1 });

    return {
      filteredDay: day || 'All Week',
      classesCount: slots.length,
      classes: slots.map((s) => ({
        day: s.day,
        subject: s.subjectId?.name || 'Class',
        code: s.subjectId?.code || '',
        room: s.room || '',
        startTime: s.startTime,
        endTime: s.endTime,
        type: s.classType,
      })),
    };
  },

  async getSubjectAttendance(userId, subjectQuery) {
    const subjects = await Subject.find({ userId });
    const regex = new RegExp(subjectQuery.trim(), 'i');
    const matched = subjects.find(
      (s) => regex.test(s.name) || (s.code && regex.test(s.code))
    );

    if (!matched) {
      return {
        error: `No subject matching "${subjectQuery}" found in student's enrolled courses. Available: ${subjects.map((s) => s.name).join(', ')}`,
      };
    }

    const records = await Attendance.find({ userId, subjectId: matched._id });
    let attended = 0;
    let missed = 0;
    records.forEach((r) => {
      if (r.status === 'Present') attended++;
      else if (r.status === 'Absent') missed++;
    });

    const conducted = attended + missed;
    const percentage = conducted > 0 ? Math.round((attended / conducted) * 1000) / 10 : 0;
    const threshold = matched.targetThreshold || 75;
    const safeBunks = calculateSafeBunks(attended, conducted, threshold);
    const needed = calculateClassesNeeded(attended, conducted, threshold);

    return {
      subject: matched.name,
      code: matched.code || '',
      faculty: matched.faculty || '',
      attended,
      missed,
      conducted,
      percentage,
      threshold,
      isSafe: percentage >= threshold,
      maxSafeBunks: safeBunks,
      classesNeededToRecover: needed,
    };
  },

  async getAttendanceSummary(userId) {
    const user = await User.findById(userId);
    const threshold = user?.attendanceThreshold || 75;
    const analytics = await getOverallAnalytics(userId, threshold);
    return analytics;
  },

  async calculateBunkCapacity(userId, subjectQuery, proposedBunks = 1) {
    const subResult = await academicTools.getSubjectAttendance(userId, subjectQuery);
    if (subResult.error) return subResult;

    const bunks = Math.max(1, parseInt(proposedBunks, 10) || 1);
    const newConducted = subResult.conducted + bunks;
    const newPct = Math.round((subResult.attended / newConducted) * 1000) / 10;
    const willStaySafe = newPct >= subResult.threshold;

    return {
      subject: subResult.subject,
      currentAttendancePct: subResult.percentage,
      currentAttended: subResult.attended,
      currentConducted: subResult.conducted,
      threshold: subResult.threshold,
      proposedBunks: bunks,
      projectedAttendancePct: newPct,
      willStaySafe,
      maxAllowedBunksBeforeShortage: subResult.maxSafeBunks,
      dropPercentage: Math.round((subResult.percentage - newPct) * 10) / 10,
    };
  },

  async calculateRequiredClasses(userId, subjectQuery, targetPct = 75) {
    const subResult = await academicTools.getSubjectAttendance(userId, subjectQuery);
    if (subResult.error) return subResult;

    const target = parseFloat(targetPct) || 75;
    const needed = calculateClassesNeeded(subResult.attended, subResult.conducted, target);

    return {
      subject: subResult.subject,
      currentPercentage: subResult.percentage,
      targetPercentage: target,
      classesNeededConsecutive: needed,
      projectedConducted: subResult.conducted + needed,
      projectedAttended: subResult.attended + needed,
    };
  },

  async generateStudyPlan(userId, goal = 'Exam Preparation', hoursPerDay = 3) {
    const slots = await Timetable.find({ userId, status: 'Active' }).sort({ day: 1, startTime: 1 });
    const subjects = await Subject.find({ userId });

    return {
      goal,
      targetHoursPerDay: hoursPerDay,
      enrolledSubjects: subjects.map((s) => s.name),
      weeklyFreeSlotsAdvice:
        'Focus revision on morning 08:00 - 09:00 and evening 18:00 - 21:00 slots. Rotate 2 subjects per evening with 15-minute breaks.',
    };
  },

  async getUpcomingAssignments(userId) {
    const assignments = await Assignment.find({ userId, status: { $ne: 'Completed' } })
      .populate('subjectId', 'name code')
      .sort({ dueDate: 1 })
      .limit(10);

    return {
      pendingCount: assignments.length,
      assignments: assignments.map((a) => ({
        id: a._id,
        title: a.title,
        subject: a.subjectId?.name || 'Subject',
        dueDate: a.dueDate.toISOString().split('T')[0],
        priority: a.priority,
        status: a.status,
      })),
    };
  },

  async getUpcomingExams(userId) {
    const exams = await Exam.find({ userId, status: 'Upcoming' })
      .populate('subjectId', 'name code')
      .sort({ examDate: 1, startTime: 1 })
      .limit(10);

    return {
      upcomingCount: exams.length,
      exams: exams.map((e) => ({
        id: e._id,
        title: e.title,
        subject: e.subjectId?.name || 'Subject',
        date: e.examDate,
        time: `${e.startTime} - ${e.endTime}`,
        room: e.room || 'TBA',
        type: e.examType,
        marks: e.totalMarks,
      })),
    };
  },
};

/**
 * Tool Declarations for Gemini Function Calling
 */
const toolDeclarations = [
  {
    name: 'getStudentProfile',
    description: 'Returns authenticated student academic details (name, college, course, branch, semester, batch, threshold).',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'getTodayTimetable',
    description: "Returns student's classes scheduled for today with timings, rooms, and professors.",
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'getWeeklyTimetable',
    description: "Returns student's classes for the entire week or a specific day.",
    parameters: {
      type: 'OBJECT',
      properties: {
        day: { type: 'STRING', description: 'Day of week e.g. Monday, Tuesday (optional)' },
      },
    },
  },
  {
    name: 'getSubjectAttendance',
    description: 'Returns real-time attendance, attended classes, conducted count, and percentage for a specific subject.',
    parameters: {
      type: 'OBJECT',
      properties: {
        subjectQuery: { type: 'STRING', description: 'Subject name or code, e.g. "Maths", "CS201", "DBMS"' },
      },
      required: ['subjectQuery'],
    },
  },
  {
    name: 'getAttendanceSummary',
    description: 'Returns overall attendance percentage across all subjects, warnings, and breakdown.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'calculateBunkCapacity',
    description: 'Calculates how many classes can safely be missed, and projected attendance if X classes are bunked.',
    parameters: {
      type: 'OBJECT',
      properties: {
        subjectQuery: { type: 'STRING', description: 'Subject name or code' },
        proposedBunks: { type: 'NUMBER', description: 'Number of classes the student plans to miss (default 1)' },
      },
      required: ['subjectQuery'],
    },
  },
  {
    name: 'calculateRequiredClasses',
    description: 'Calculates exact consecutive classes required to reach an attendance target percentage.',
    parameters: {
      type: 'OBJECT',
      properties: {
        subjectQuery: { type: 'STRING', description: 'Subject name or code' },
        targetPct: { type: 'NUMBER', description: 'Target attendance percentage e.g. 75 or 80' },
      },
      required: ['subjectQuery'],
    },
  },
  {
    name: 'generateStudyPlan',
    description: 'Generates an actionable study schedule based on student timetable free periods.',
    parameters: {
      type: 'OBJECT',
      properties: {
        goal: { type: 'STRING', description: 'Goal e.g. "Mid-term exam revision", "Daily study"' },
        hoursPerDay: { type: 'NUMBER', description: 'Target hours per day' },
      },
    },
  },
  {
    name: 'getUpcomingAssignments',
    description: 'Returns list of student pending and in-progress assignments with deadlines and priorities.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'getUpcomingExams',
    description: 'Returns upcoming examinations, mid-terms, quizzes, and viva dates with timings and room numbers.',
    parameters: { type: 'OBJECT', properties: {} },
  },
];

/**
 * Execute Gemini conversational turn with tool calling
 */
export async function processAcademicChat(userId, messages, userQuery) {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured on the server.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Supported and tested models
  const models = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.6-flash'];

  // Fetch real-time student context upfront
  const [profile, todaySchedule, summary] = await Promise.all([
    academicTools.getStudentProfile(userId),
    academicTools.getTodayTimetable(userId),
    academicTools.getAttendanceSummary(userId),
  ]);

  const systemInstruction = `
You are AttendX AI, an elite academic assistant and timetable copilot for college and university students.

STUDENT PROFILE CONTEXT:
- Name: ${profile.name}
- Institution: ${profile.college}
- Degree/Branch: ${profile.course} - ${profile.branch} (Semester ${profile.semester}, Section ${profile.section}, Batch ${profile.batch})
- Required Attendance Threshold: ${profile.attendanceThreshold}%

TODAY'S SCHEDULE (${todaySchedule.day}):
- Total classes: ${todaySchedule.totalClasses}
- Classes: ${JSON.stringify(todaySchedule.schedule)}

ATTENDANCE SNAPSHOT:
- Overall Attendance: ${summary.overallPercentage || 0}% (${summary.totalAttended || 0}/${summary.totalConducted || 0} classes attended)
- Subjects with Low Attendance (<${profile.attendanceThreshold}%): ${JSON.stringify(summary.lowAttendanceSubjects || [])}

BEHAVIORAL GUIDELINES:
1. Always base attendance numbers, class hours, and timetable details on ACTUAL student data. NEVER invent dates, percentages, or rooms.
2. If asked about a specific subject, bunking, or recovery, invoke the appropriate tools or use the snapshot.
3. Understand and respond naturally in English or Hinglish depending on how the student talks.
4. When answering bunk questions:
   - State the current attendance & classes attended/conducted.
   - Show the exact projected percentage if they bunk.
   - Clarify whether it remains above their ${profile.attendanceThreshold}% requirement.
5. Be supportive, concise, and structured with clear bullet points.
`;

  let lastError = null;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        tools: [{ functionDeclarations: toolDeclarations }],
      });

      // Prepare conversation history
      const formattedHistory = messages.map((m) => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const chat = model.startChat({
        history: formattedHistory,
      });

      // Send user query
      let result = await chat.sendMessage(userQuery);
      let response = result.response;

      const executedTools = [];

      // Check if model called any tools
      const functionCalls = response.functionCalls ? response.functionCalls() : null;

      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          const { name, args } = call;
          executedTools.push({ name, args });

          let toolOutput = { error: 'Unknown tool' };
          if (name === 'getStudentProfile') {
            toolOutput = await academicTools.getStudentProfile(userId);
          } else if (name === 'getTodayTimetable') {
            toolOutput = await academicTools.getTodayTimetable(userId);
          } else if (name === 'getWeeklyTimetable') {
            toolOutput = await academicTools.getWeeklyTimetable(userId, args?.day);
          } else if (name === 'getSubjectAttendance') {
            toolOutput = await academicTools.getSubjectAttendance(userId, args?.subjectQuery);
          } else if (name === 'getAttendanceSummary') {
            toolOutput = await academicTools.getAttendanceSummary(userId);
          } else if (name === 'calculateBunkCapacity') {
            toolOutput = await academicTools.calculateBunkCapacity(userId, args?.subjectQuery, args?.proposedBunks);
          } else if (name === 'calculateRequiredClasses') {
            toolOutput = await academicTools.calculateRequiredClasses(userId, args?.subjectQuery, args?.targetPct);
          } else if (name === 'generateStudyPlan') {
            toolOutput = await academicTools.generateStudyPlan(userId, args?.goal, args?.hoursPerDay);
          } else if (name === 'getUpcomingAssignments') {
            toolOutput = await academicTools.getUpcomingAssignments(userId);
          } else if (name === 'getUpcomingExams') {
            toolOutput = await academicTools.getUpcomingExams(userId);
          }

          // Send function response back to Gemini
          result = await chat.sendMessage([
            {
              functionResponse: {
                name,
                response: toolOutput,
              },
            },
          ]);
          response = result.response;
        }
      }

      return {
        text: response.text(),
        model: modelName,
        toolCalls: executedTools,
      };
    } catch (err) {
      console.warn(`[AttendX AI] ${modelName} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to generate response from AttendX AI.');
}

