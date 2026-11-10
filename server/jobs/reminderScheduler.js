import cron from 'node-cron';
import User from '../models/User.js';
import Timetable from '../models/Timetable.js';
import Notification from '../models/Notification.js';
import Attendance from '../models/Attendance.js';
import Task from '../models/Task.js';
import { sendNotification } from '../services/notificationService.js';
import { DAYS } from '../config/constants.js';

export const startReminderScheduler = () => {
  console.log('[Scheduler] Background reminder scheduler initialized (every minute).');

  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const currentDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1]; // 0=Sunday -> 6, 1=Monday -> 0
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMins}`;
      const todayDateStr = now.toISOString().split('T')[0];

      // Total minutes from midnight
      const nowTotalMins = now.getHours() * 60 + now.getMinutes();

      // Find all active timetables for current day
      const scheduledClasses = await Timetable.find({
        day: currentDay,
        status: 'Active',
      }).populate('subjectId userId');

      for (const slot of scheduledClasses) {
        const user = slot.userId;
        const subject = slot.subjectId;
        if (!user || !subject || !user.notificationsEnabled) continue;

        const [startH, startM] = slot.startTime.split(':').map(Number);
        const [endH, endM] = slot.endTime.split(':').map(Number);

        const slotStartMins = startH * 60 + startM;
        const slotEndMins = endH * 60 + endM;

        const reminderOffset = user.reminderMinutes || 15;

        // 1. Check Pre-class reminder (X minutes before)
        const minutesBeforeStart = slotStartMins - nowTotalMins;
        if (minutesBeforeStart === reminderOffset && reminderOffset > 0) {
          const alreadyNotified = await Notification.findOne({
            userId: user._id,
            type: 'CLASS_REMINDER',
            'data.classId': slot._id,
            'data.date': todayDateStr,
            'data.timing': 'pre',
          });

          if (!alreadyNotified) {
            await sendNotification({
              userId: user._id,
              title: `Upcoming: ${subject.name}`,
              message: `Your ${subject.name} ${slot.classType || 'class'} starts in ${reminderOffset} minutes in ${slot.room || 'class'}.`,
              type: 'CLASS_REMINDER',
              data: {
                classId: slot._id,
                subjectId: subject._id,
                subjectName: subject.name,
                timing: 'pre',
                date: todayDateStr,
              },
            });
          }
        }

        // 2. Class starting now
        if (minutesBeforeStart === 0) {
          const alreadyNotified = await Notification.findOne({
            userId: user._id,
            type: 'CLASS_REMINDER',
            'data.classId': slot._id,
            'data.date': todayDateStr,
            'data.timing': 'now',
          });

          if (!alreadyNotified) {
            await sendNotification({
              userId: user._id,
              title: `Class Starting: ${subject.name}`,
              message: `Your ${subject.name} class is starting now in ${slot.room || 'assigned room'}.`,
              type: 'CLASS_REMINDER',
              data: {
                classId: slot._id,
                subjectId: subject._id,
                subjectName: subject.name,
                timing: 'now',
                date: todayDateStr,
              },
            });
          }
        }

        // 3. Post-class completion reminder (Did you attend?)
        const minutesAfterEnd = nowTotalMins - slotEndMins;
        if (
          user.classCompletionReminder &&
          minutesAfterEnd >= 0 &&
          minutesAfterEnd <= 3
        ) {
          // Check if attendance already marked or notification already prompted
          const existingAttendance = await Attendance.findOne({
            userId: user._id,
            scheduledClassId: slot._id,
            date: todayDateStr,
          });

          if (!existingAttendance) {
            const alreadyPrompted = await Notification.findOne({
              userId: user._id,
              type: 'CLASS_COMPLETED',
              'data.classId': slot._id,
              'data.date': todayDateStr,
            });

            if (!alreadyPrompted) {
              await sendNotification({
                userId: user._id,
                title: `Class Ended: ${subject.name}`,
                message: `Your ${subject.name} lecture has ended. Did you attend today's class?`,
                type: 'CLASS_COMPLETED',
                data: {
                  classId: slot._id,
                  subjectId: subject._id,
                  subjectName: subject.name,
                  date: todayDateStr,
                },
              });
            }
          }
        }
      }

      // Check upcoming Task Reminders (Tasks due today or with a specified dueTime)
      const tasksDueToday = await Task.find({
        completed: false,
        dueDate: todayDateStr,
        reminderEnabled: true,
      });

      for (const task of tasksDueToday) {
        if (!task.dueTime) continue;
        const [taskH, taskM] = task.dueTime.split(':').map(Number);
        const taskTotalMins = taskH * 60 + taskM;
        const minutesUntilDue = taskTotalMins - nowTotalMins;
        const reminderOffset = task.reminderMinutes || 30;

        if (minutesUntilDue === reminderOffset) {
          const alreadyNotified = await Notification.findOne({
            userId: task.userId,
            type: 'TASK_REMINDER',
            'data.taskId': task._id,
            'data.date': todayDateStr,
          });

          if (!alreadyNotified) {
            await sendNotification({
              userId: task.userId,
              title: `Task Reminder: ${task.title}`,
              message: `Your task '${task.title}' is due in ${reminderOffset} minutes (${task.dueTime}).`,
              type: 'TASK_REMINDER',
              data: {
                taskId: task._id,
                date: todayDateStr,
              },
            });
          }
        }
      }
    } catch (schedulerErr) {
      console.error('[Scheduler] Error in minute job:', schedulerErr.message);
    }
  });

  // Daily Low Attendance Alert Check at 19:00 (7 PM)
  cron.schedule('0 19 * * *', async () => {
    try {
      const users = await User.find({ notificationsEnabled: true });
      for (const user of users) {
        const threshold = user.attendanceThreshold || 75;
        // Check subjects
        const subjects = await Timetable.distinct('subjectId', { userId: user._id });
        for (const subId of subjects) {
          const records = await Attendance.find({
            userId: user._id,
            subjectId: subId,
            status: { $in: ['Present', 'Absent'] },
          }).populate('subjectId');

          if (records.length >= 3) {
            const attended = records.filter((r) => r.status === 'Present').length;
            const pct = (attended / records.length) * 100;
            const subject = records[0]?.subjectId;

            if (pct < threshold && subject) {
              await sendNotification({
                userId: user._id,
                title: `Attendance Warning: ${subject.name}`,
                message: `Your ${subject.name} attendance is ${Math.round(pct)}%, which is below your target of ${threshold}%.`,
                type: 'LOW_ATTENDANCE',
                data: {
                  subjectId: subject._id,
                  currentPct: Math.round(pct),
                  threshold,
                },
              });
            }
          }
        }
      }
    } catch (alertErr) {
      console.error('[Scheduler] Error in low attendance job:', alertErr.message);
    }
  });
};

