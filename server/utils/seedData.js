import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB, closeDB } from '../config/db.js';

import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Timetable from '../models/Timetable.js';
import Attendance from '../models/Attendance.js';
import Notification from '../models/Notification.js';

dotenv.config();

export const seedDatabase = async () => {
  console.log('[Seeder] Starting database seed...');
  await connectDB();

  // Clean demo user if exists
  const demoEmail = 'alex.chen@stanford.edu';
  const existingUser = await User.findOne({ email: demoEmail });
  if (existingUser) {
    console.log('[Seeder] Cleaning existing demo student data...');
    const uId = existingUser._id;
    await Promise.all([
      User.deleteOne({ _id: uId }),
      Subject.deleteMany({ userId: uId }),
      Timetable.deleteMany({ userId: uId }),
      Attendance.deleteMany({ userId: uId }),
      Notification.deleteMany({ userId: uId }),
    ]);
  }

  // 1. Create Demo Student User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('attendx123', salt);

  const demoUser = await User.create({
    name: 'Alex Chen',
    email: demoEmail,
    passwordHash,
    collegeName: 'Stanford University (Engineering)',
    universityName: 'Stanford University',
    collegeLocation: 'Stanford, CA',
    course: 'B.Tech',
    branch: 'Computer Science & Engineering',
    academicYear: '2024-2028',
    semester: 4,
    section: 'A',
    attendanceThreshold: 75,
    reminderMinutes: 15,
    classCompletionReminder: true,
    notificationsEnabled: true,
    theme: 'system',
    isOnboarded: true,
  });

  console.log(`[Seeder] Created demo student: ${demoUser.name} (${demoUser.email})`);

  // 2. Create Subjects
  const subjectsData = [
    {
      name: 'Data Structures & Algorithms',
      code: 'CS201',
      faculty: 'Dr. Robert Vance',
      color: '#4F46E5', // Indigo
    },
    {
      name: 'Database Management Systems',
      code: 'CS204',
      faculty: 'Prof. Anjali Sharma',
      color: '#0D9488', // Teal
    },
    {
      name: 'Computer Networks',
      code: 'CS205',
      faculty: 'Dr. Michael Chen',
      color: '#2563EB', // Blue
    },
    {
      name: 'Discrete Mathematics',
      code: 'MA201',
      faculty: 'Prof. David Miller',
      color: '#D97706', // Amber (low attendance demo)
    },
    {
      name: 'Operating Systems',
      code: 'CS202',
      faculty: 'Dr. Sarah Connor',
      color: '#7C3AED', // Purple
    },
  ];

  const createdSubjects = [];
  for (const sub of subjectsData) {
    const s = await Subject.create({ ...sub, userId: demoUser._id });
    createdSubjects.push(s);
  }

  // Map for easy ID lookup
  const subMap = {};
  createdSubjects.forEach((s) => (subMap[s.code] = s._id));

  // 3. Create Weekly Timetable Slots (Monday - Friday)
  const timetableSlots = [
    // Monday
    { subjectId: subMap['CS201'], day: 'Monday', startTime: '09:00', endTime: '10:00', room: 'LH-101', classType: 'Lecture' },
    { subjectId: subMap['CS204'], day: 'Monday', startTime: '10:15', endTime: '11:15', room: 'Room 204', classType: 'Lecture' },
    { subjectId: subMap['CS205'], day: 'Monday', startTime: '11:30', endTime: '12:30', room: 'LH-102', classType: 'Lecture' },
    { subjectId: subMap['CS201'], day: 'Monday', startTime: '14:00', endTime: '16:00', room: 'CS Lab 3', classType: 'Practical' },

    // Tuesday
    { subjectId: subMap['MA201'], day: 'Tuesday', startTime: '09:00', endTime: '10:00', room: 'Room 305', classType: 'Lecture' },
    { subjectId: subMap['CS202'], day: 'Tuesday', startTime: '10:15', endTime: '11:15', room: 'LH-101', classType: 'Lecture' },
    { subjectId: subMap['CS204'], day: 'Tuesday', startTime: '14:00', endTime: '16:00', room: 'DB Lab 1', classType: 'Practical' },

    // Wednesday
    { subjectId: subMap['CS201'], day: 'Wednesday', startTime: '09:00', endTime: '10:00', room: 'LH-101', classType: 'Lecture' },
    { subjectId: subMap['CS205'], day: 'Wednesday', startTime: '10:15', endTime: '11:15', room: 'LH-102', classType: 'Lecture' },
    { subjectId: subMap['MA201'], day: 'Wednesday', startTime: '11:30', endTime: '12:30', room: 'Room 305', classType: 'Lecture' },

    // Thursday
    { subjectId: subMap['CS202'], day: 'Thursday', startTime: '09:00', endTime: '10:00', room: 'LH-101', classType: 'Lecture' },
    { subjectId: subMap['CS204'], day: 'Thursday', startTime: '10:15', endTime: '11:15', room: 'Room 204', classType: 'Lecture' },
    { subjectId: subMap['CS205'], day: 'Thursday', startTime: '11:30', endTime: '12:30', room: 'LH-102', classType: 'Lecture' },
    { subjectId: subMap['CS202'], day: 'Thursday', startTime: '14:00', endTime: '16:00', room: 'OS Lab 2', classType: 'Practical' },

    // Friday
    { subjectId: subMap['MA201'], day: 'Friday', startTime: '09:00', endTime: '10:00', room: 'Room 305', classType: 'Tutorial' },
    { subjectId: subMap['CS201'], day: 'Friday', startTime: '10:15', endTime: '11:15', room: 'LH-101', classType: 'Lecture' },
    { subjectId: subMap['CS202'], day: 'Friday', startTime: '11:30', endTime: '12:30', room: 'LH-101', classType: 'Lecture' },
  ];

  const createdSlots = [];
  for (const slot of timetableSlots) {
    const s = await Timetable.create({ ...slot, userId: demoUser._id });
    createdSlots.push(s);
  }
  console.log(`[Seeder] Seeded ${createdSlots.length} timetable slots.`);

  // 4. Generate Historical Attendance Records (Past 30 days)
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  let attendanceCount = 0;

  for (let i = 25; i >= 1; i--) {
    const dateObj = new Date();
    dateObj.setDate(today.getDate() - i);
    const dayOfWeek = dayNames[dateObj.getDay()];
    const dateStr = dateObj.toISOString().split('T')[0];

    // Find slots on this day
    const matchingSlots = createdSlots.filter((s) => s.day === dayOfWeek);

    for (const slot of matchingSlots) {
      // Discrete Math has lower attendance (68%) to demonstrate attendance warnings and bunk recovery!
      const isMath = slot.subjectId.toString() === subMap['MA201'].toString();
      let isPresent = false;

      if (isMath) {
        isPresent = Math.random() < 0.65; // ~65%
      } else {
        isPresent = Math.random() < 0.88; // ~88%
      }

      await Attendance.create({
        userId: demoUser._id,
        subjectId: slot.subjectId,
        scheduledClassId: slot._id,
        date: dateStr,
        status: isPresent ? 'Present' : 'Absent',
        notes: isPresent ? 'Attended' : 'Missed lecture',
        markedAt: new Date(dateObj.getTime() + 10 * 3600 * 1000),
      });
      attendanceCount++;
    }
  }

  // 5. Create notifications
  await Notification.create({
    userId: demoUser._id,
    title: 'Attendance Alert: Discrete Mathematics',
    message: 'Your Discrete Mathematics attendance is currently 65%, which is below your target of 75%. You need to attend the next 4 classes.',
    type: 'LOW_ATTENDANCE',
    data: { subjectId: subMap['MA201'], currentPct: 65, threshold: 75 },
    readStatus: false,
  });

  await Notification.create({
    userId: demoUser._id,
    title: 'Welcome to AttendX!',
    message: 'Your timetable has been configured. AttendX will remind you 15 minutes before your lectures.',
    type: 'SYSTEM',
    readStatus: true,
  });

  console.log(`[Seeder] Seeded ${attendanceCount} attendance history records.`);
  console.log('[Seeder] Database seeding completed successfully!');
};

if (process.argv[1]?.endsWith('seedData.js')) {
  seedDatabase().then(() => {
    closeDB();
    process.exit(0);
  });
}

