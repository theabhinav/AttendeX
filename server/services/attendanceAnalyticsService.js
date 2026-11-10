import Attendance from '../models/Attendance.js';
import Subject from '../models/Subject.js';
import Timetable from '../models/Timetable.js';

export const calculateSafeBunks = (attended, conducted, threshold = 75) => {
  if (conducted === 0) return 0;
  const target = threshold / 100;
  const currentRatio = attended / conducted;
  if (currentRatio < target) return 0;
  const safe = Math.floor(attended / target - conducted);
  return Math.max(0, safe);
};

export const calculateClassesNeeded = (attended, conducted, targetPercentage = 75) => {
  if (conducted === 0) return 0;
  if (targetPercentage >= 100) return attended === conducted ? 0 : Infinity;
  const target = targetPercentage / 100;
  const currentRatio = conducted > 0 ? attended / conducted : 0;
  if (currentRatio >= target) return 0;
  const numerator = target * conducted - attended;
  const denominator = 1 - target;
  return Math.max(1, Math.ceil(numerator / denominator));
};

export const getSubjectAnalytics = async (userId, userThreshold = 75) => {
  const subjects = await Subject.find({ userId }).sort({ name: 1 });

  const analytics = await Promise.all(
    subjects.map(async (subject) => {
      const records = await Attendance.find({
        userId,
        subjectId: subject._id,
      });

      let attended = 0;
      let missed = 0;
      let pending = 0;
      let cancelled = 0;
      let holidays = 0;

      records.forEach((r) => {
        if (r.status === 'Present') attended++;
        else if (r.status === 'Absent') missed++;
        else if (r.status === 'Pending') pending++;
        else if (r.status === 'Cancelled') cancelled++;
        else if (r.status === 'Holiday') holidays++;
      });

      const conducted = attended + missed;
      const percentage =
        conducted > 0 ? Math.round((attended / conducted) * 1000) / 10 : 0;

      const threshold = subject.targetThreshold || userThreshold;
      const safeBunks = calculateSafeBunks(attended, conducted, threshold);
      const neededForThreshold = calculateClassesNeeded(attended, conducted, threshold);

      let status = 'Safe';
      if (percentage < threshold) {
        status = percentage < threshold - 10 ? 'Critical' : 'Warning';
      } else if (percentage >= threshold + 10) {
        status = 'Excellent';
      }

      return {
        _id: subject._id,
        name: subject.name,
        code: subject.code,
        faculty: subject.faculty,
        color: subject.color,
        attended,
        missed,
        pending,
        cancelled,
        holidays,
        conducted,
        percentage,
        threshold,
        status,
        safeBunks,
        neededForThreshold,
      };
    })
  );

  return analytics;
};

export const getOverallAnalytics = async (userId, userThreshold = 75) => {
  const subjectsAnalytics = await getSubjectAnalytics(userId, userThreshold);

  let totalAttended = 0;
  let totalMissed = 0;
  let totalPending = 0;

  subjectsAnalytics.forEach((s) => {
    totalAttended += s.attended;
    totalMissed += s.missed;
    totalPending += s.pending;
  });

  const totalConducted = totalAttended + totalMissed;
  const overallPercentage =
    totalConducted > 0 ? Math.round((totalAttended / totalConducted) * 1000) / 10 : 0;

  // Calculate attendance trend from historical records
  const recentRecords = await Attendance.find({
    userId,
    status: { $in: ['Present', 'Absent'] },
  })
    .sort({ date: 1, markedAt: 1 })
    .limit(30);

  let trend = 'Stable';
  if (recentRecords.length >= 6) {
    const half = Math.floor(recentRecords.length / 2);
    const firstHalf = recentRecords.slice(0, half);
    const secondHalf = recentRecords.slice(half);

    const firstAttended = firstHalf.filter((r) => r.status === 'Present').length;
    const secondAttended = secondHalf.filter((r) => r.status === 'Present').length;

    const firstRate = firstAttended / firstHalf.length;
    const secondRate = secondAttended / secondHalf.length;

    if (secondRate - firstRate > 0.05) {
      trend = 'Improving';
    } else if (firstRate - secondRate > 0.05) {
      trend = 'Declining';
    }
  }

  return {
    overallPercentage,
    totalConducted,
    totalAttended,
    totalMissed,
    totalPending,
    threshold: userThreshold,
    trend,
    subjects: subjectsAnalytics,
  };
};
