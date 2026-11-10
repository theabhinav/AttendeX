import { GoogleGenerativeAI } from '@google/generative-ai';
import Task from '../models/Task.js';
import Subject from '../models/Subject.js';
import Timetable from '../models/Timetable.js';
import User from '../models/User.js';
import { DAYS } from '../config/constants.js';

/**
 * Intelligent Voice Command Processing Engine with Multilingual English/Hindi/Hinglish Support
 */
export async function processVoiceCommand(userId, commandText, clientContext = {}) {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured on the server.');
  }

  // 1. Fetch user's existing tasks and context
  const now = new Date();
  const clientDate = clientContext.date || now.toISOString().split('T')[0];
  const clientTime = clientContext.time || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const dayName = clientContext.day || DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];

  const [existingTasks, subjects, user] = await Promise.all([
    Task.find({ userId }).sort({ completed: 1, dueDate: 1, createdAt: -1 }).limit(30),
    Subject.find({ userId }).select('name code'),
    User.findById(userId).select('name course branch attendanceThreshold'),
  ]);

  const pendingTasks = existingTasks.filter((t) => !t.completed);
  const completedTasks = existingTasks.filter((t) => t.completed);

  // 2. Prepare Context for Gemini
  const activeTaskList = pendingTasks.map((t) => ({
    id: t._id.toString(),
    title: t.title,
    category: t.category,
    priority: t.priority,
    dueDate: t.dueDate,
    dueTime: t.dueTime,
  }));

  const subjectList = subjects.map((s) => s.name);

  const systemInstruction = `
You are AttendX Voice Assistant, an AI student academic task copilot.
You interpret voice & text commands spoken by Indian college students in English, Hindi, and Hinglish.

CURRENT DATE & TIME:
- Today's Date: ${clientDate} (${dayName})
- Current Time: ${clientTime}

STUDENT DATABASE CONTEXT:
- Student Name: ${user?.name || 'Student'}
- Enrolled Subjects: ${JSON.stringify(subjectList)}
- Current Pending Tasks (${pendingTasks.length}): ${JSON.stringify(activeTaskList)}
- Completed Tasks Count: ${completedTasks.length}

SUPPORTED INTENTS:
1. CREATE_TASK: User wants to add/remember a new task, study session, assignment, project work, or reminder.
2. UPDATE_TASK: User wants to reschedule, change date/time, rename, or reprioritize an existing task.
3. COMPLETE_TASK: User wants to mark a task as done/finished/completed (e.g. "Mark DSA assignment as completed", "Maine DBMS revise kar liya").
4. DELETE_TASK: User wants to remove/delete a specific task or all completed tasks ("Delete my old Maths task", "Delete completed tasks").
5. LIST_TASKS: User wants to see tasks ("Show my pending tasks", "Mera to-do dikhao").
6. SEARCH_TASKS: User wants to find tasks by keyword or category ("Find all my coding tasks").
7. DAILY_SUMMARY: User asks for their daily summary or what they need to do today ("Aaj ka kya plan hai?", "What do I need to do today?").
8. QUERY_INFO: Questions about tasks ("How many tasks are pending?", "What's my most urgent task?").
9. HELP: User asks what the voice assistant can do.

CRITICAL RULES FOR EXTRACTION:
1. DATE RESOLUTION (Relative to ${clientDate}):
   - "aaj", "today", "this evening", "tonight" -> ${clientDate}
   - "kal", "tomorrow", "kal subah", "kal shaam" -> 1 day after ${clientDate}
   - "parso", "day after tomorrow" -> 2 days after ${clientDate}
   - Days of week ("Sunday", "Somwar", "Friday", "this weekend") -> calculate the next upcoming occurrence YYYY-MM-DD.
   - If no date is mentioned at all, set "dueDate": null (do NOT fabricate random deadlines).
2. TIME RESOLUTION (24-Hour Format HH:mm):
   - "7 PM", "shaam 7 baje", "raat 7 baje" -> "19:00"
   - "7 AM", "subah 7 baje" -> "07:00"
   - "dophar 2 baje", "2 PM" -> "14:00"
   - "raat 9 baje", "9 PM" -> "21:00"
   - If no time is mentioned, set "dueTime": null.
3. CATEGORY CLASSIFICATION:
   Must strictly be one of:
   - "Academics" (study, revise, chapters, lectures, lab manual)
   - "Assignments" (homework, assignments, report submissions)
   - "Coding / DSA" (LeetCode, DSA, algorithm, programming, git, web dev)
   - "Projects" (college project, capstone, minor project, app build)
   - "Exams" (mid-term, viva, test, quiz, end-term)
   - "Personal" (gym, buy groceries, hostel stuff, fees)
   - "Other"
4. PRIORITY:
   - "High" (urgent, important, exams, near deadlines, explicit "high priority" or "zaroori")
   - "Medium" (standard tasks, default)
   - "Low" (casual, whenever free)
5. TASK MATCHING:
   - For UPDATE_TASK, COMPLETE_TASK, or DELETE_TASK, search in the student's pending tasks.
   - If exact match or close match found, set "matchedTaskId": "<task-id>".
   - If user says "Delete completed tasks" or "Clear done tasks", set intent "DELETE_TASK" with "bulkCompleted": true.
6. SPOKEN RESPONSES:
   - "speechResponse": Natural, warm, and concise conversational reply (1-2 sentences) in natural Hinglish or English for student display (e.g. "Maine DBMS revise karne ka task kal shaam 7 baje ke liye add kar diya hai!").
   - "speechHindi": The exact spoken response in natural, fluent, everyday spoken HINDI written in DEVANAGARI SCRIPT (e.g. "मैंने कल शाम सात बजे डीबीएमएस रिवाइज करने का टास्क जोड़ दिया है।").
     CRITICAL RULES FOR "speechHindi":
     * ALWAYS write in clean Devanagari script (e.g. "मैंने", "कल", "शाम", "सात बजे", "टास्क", "जोड़ दिया है").
     * Pronounce numbers naturally in Hindi words or numerals (e.g. "सात बजे", "7 बजे").
     * Use everyday words Indian college students use (like "टास्क", "असाइनमेंट", "रिवाइज", "प्रोजेक्ट"). Do not use overly formal archaic Sanskrit words.
     * If the user spoke English, "speechHindi" should still provide the Hindi translation so the student can listen in either language!
   - "detectedLanguage": "hi" if the student's command was in Hindi or Hinglish; "en" if purely in English.

OUTPUT FORMAT:
You MUST output ONLY a valid JSON object matching this schema, with no preamble or markdown ticks:
{
  "intent": "CREATE_TASK" | "UPDATE_TASK" | "COMPLETE_TASK" | "DELETE_TASK" | "LIST_TASKS" | "SEARCH_TASKS" | "DAILY_SUMMARY" | "QUERY_INFO" | "HELP",
  "speechResponse": "Natural Hinglish or English response for UI display",
  "speechHindi": "प्राकृतिक देवनागरी हिंदी में बोला जाने वाला वाक्य (Ultra-natural spoken Hindi in Devanagari)",
  "detectedLanguage": "hi" | "en",
  "task": {
    "title": "Clean, imperative task title in English",
    "description": "Optional notes if mentioned",
    "category": "Academics" | "Assignments" | "Coding / DSA" | "Projects" | "Exams" | "Personal" | "Other",
    "priority": "High" | "Medium" | "Low",
    "dueDate": "YYYY-MM-DD or null",
    "dueTime": "HH:mm or null"
  },
  "matchedTaskId": "ID if matching existing task or null",
  "bulkCompleted": false,
  "requiresConfirmation": true,
  "confidence": 0.95,
  "clarificationNeeded": null
}
`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const models = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.6-flash'];

  let parsedResult = null;
  let lastError = null;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const prompt = `Student Command: "${commandText}"`;
      const response = await model.generateContent(prompt);
      const text = response.response.text();

      // Clean and parse JSON
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanJson);
      if (parsedResult && parsedResult.intent) {
        break; // Successfully obtained structured output
      }
    } catch (err) {
      console.warn(`[VoiceAssistant] Model ${modelName} failed:`, err.message);
      lastError = err;
    }
  }

  if (!parsedResult) {
    // Graceful Rule-Based Fallback if AI service is temporarily unreachable
    parsedResult = heuristicFallback(commandText, clientDate, pendingTasks);
  }

  // Double check matched task if intent was COMPLETE / DELETE / UPDATE
  if (['COMPLETE_TASK', 'DELETE_TASK', 'UPDATE_TASK'].includes(parsedResult.intent) && !parsedResult.matchedTaskId && !parsedResult.bulkCompleted) {
    const query = (parsedResult.task?.title || commandText).toLowerCase();
    const candidate = pendingTasks.find(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        query.includes(t.title.toLowerCase())
    );
    if (candidate) {
      parsedResult.matchedTaskId = candidate._id.toString();
      if (!parsedResult.task?.title) {
        parsedResult.task = {
          title: candidate.title,
          category: candidate.category,
          priority: candidate.priority,
          dueDate: candidate.dueDate,
          dueTime: candidate.dueTime,
        };
      }
    }
  }

  // For informational / summary queries, confirmation is not needed
  if (['DAILY_SUMMARY', 'LIST_TASKS', 'SEARCH_TASKS', 'QUERY_INFO', 'HELP'].includes(parsedResult.intent)) {
    parsedResult.requiresConfirmation = false;
  }

  return parsedResult;
}

/**
 * Robust heuristic fallback in case of network or rate limits
 */
function heuristicFallback(commandText, clientDate, pendingTasks) {
  const lower = commandText.toLowerCase();

  const isHindi = /[\u0900-\u097F]/.test(commandText) || /kal|aaj|parso|karna|kar|baje|shaam|subah|hata|karo|hai|mujhe|mera/i.test(lower);
  const detectedLanguage = isHindi ? 'hi' : 'en';

  // Check if complete intent
  if (lower.includes('complete') || lower.includes('done') || lower.includes('kar liya') || lower.includes('ho gaya')) {
    const matched = pendingTasks.find((t) => lower.includes(t.title.toLowerCase()));
    return {
      intent: 'COMPLETE_TASK',
      speechResponse: matched
        ? `Marking '${matched.title}' as completed.`
        : 'Which task would you like to complete?',
      speechHindi: matched
        ? `'${matched.title}' को पूरा मार्क कर दिया गया है।`
        : 'आप कौन सा टास्क पूरा करना चाहते हैं?',
      detectedLanguage,
      matchedTaskId: matched ? matched._id.toString() : null,
      requiresConfirmation: true,
      task: matched ? { title: matched.title } : null,
    };
  }

  // Check if delete intent
  if (lower.includes('delete') || lower.includes('remove') || lower.includes('hata do')) {
    const isBulk = lower.includes('completed') || lower.includes('done');
    const matched = !isBulk ? pendingTasks.find((t) => lower.includes(t.title.toLowerCase())) : null;
    return {
      intent: 'DELETE_TASK',
      speechResponse: isBulk
        ? 'Do you want to delete all completed tasks?'
        : matched
        ? `Do you want to delete '${matched.title}'?`
        : 'Which task would you like to delete?',
      speechHindi: isBulk
        ? 'क्या आप सभी पूरे किए गए टास्क हटाना चाहते हैं?'
        : matched
        ? `क्या आप '${matched.title}' को हटाना चाहते हैं?`
        : 'आप कौन सा टास्क हटाना चाहते हैं?',
      detectedLanguage,
      matchedTaskId: matched ? matched._id.toString() : null,
      bulkCompleted: isBulk,
      requiresConfirmation: true,
      task: matched ? { title: matched.title } : null,
    };
  }

  // Default to CREATE_TASK
  let priority = 'Medium';
  if (lower.includes('urgent') || lower.includes('high priority') || lower.includes('zaroori')) {
    priority = 'High';
  }

  let category = 'Academics';
  if (lower.includes('dsa') || lower.includes('coding') || lower.includes('code') || lower.includes('leetcode') || lower.includes('react')) {
    category = 'Coding / DSA';
  } else if (lower.includes('project')) {
    category = 'Projects';
  } else if (lower.includes('assignment')) {
    category = 'Assignments';
  } else if (lower.includes('exam') || lower.includes('quiz') || lower.includes('viva')) {
    category = 'Exams';
  }

  let dueDate = null;
  if (lower.includes('kal') || lower.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dueDate = tomorrow.toISOString().split('T')[0];
  } else if (lower.includes('aaj') || lower.includes('today')) {
    dueDate = clientDate;
  }

  const cleanTitle = commandText.replace(/^(add|create|remind me to|mujhe)\s+/i, '').trim();

  return {
    intent: 'CREATE_TASK',
    speechResponse: `I've prepared the task: "${cleanTitle}". Please confirm to add it.`,
    speechHindi: `मैंने आपका टास्क तैयार कर दिया है: "${cleanTitle}". जोड़ने के लिए कन्फर्म करें।`,
    detectedLanguage,
    task: {
      title: cleanTitle,
      description: '',
      category,
      priority,
      dueDate,
      dueTime: null,
    },
    matchedTaskId: null,
    requiresConfirmation: true,
  };
}

