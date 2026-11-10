/**
 * Attendance Calculations Utility for AttendX
 */

/**
 * Calculates current attendance percentage
 * @param {number} attended - Number of attended classes
 * @param {number} conducted - Total number of conducted classes
 * @returns {number} Percentage between 0 and 100 rounded to 1 decimal place
 */
export const calculatePercentage = (attended, conducted) => {
  if (!conducted || conducted <= 0) return 0;
  const pct = (attended / conducted) * 100;
  return Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
};

/**
 * Calculates maximum consecutive classes that can be safely bunked without falling below threshold
 * Formula:
 * (Attended) / (Conducted + Bunks) >= Threshold / 100
 * Attended >= (Threshold / 100) * (Conducted + Bunks)
 * Attended / (Threshold / 100) - Conducted >= Bunks
 * Bunks <= floor( (Attended * 100 / Threshold) - Conducted )
 * 
 * @param {number} attended - Total classes attended
 * @param {number} conducted - Total classes conducted
 * @param {number} threshold - Required percentage (e.g. 75)
 * @returns {number} Max safe bunks, 0 if attendance is already below threshold
 */
export const calculateSafeBunks = (attended, conducted, threshold = 75) => {
  if (conducted === 0) return 0;
  const target = threshold / 100;
  const currentRatio = attended / conducted;
  
  if (currentRatio < target) {
    return 0; // Already below threshold
  }
  
  const safe = Math.floor((attended / target) - conducted);
  return Math.max(0, safe);
};

/**
 * Calculates number of consecutive classes required to attend to reach or recover a target percentage
 * Formula:
 * (Attended + K) / (Conducted + K) >= Target / 100
 * Attended + K >= Target * Conducted + Target * K
 * K * (1 - Target) >= Target * Conducted - Attended
 * K >= ceil( (Target * Conducted - Attended) / (1 - Target) )
 * 
 * @param {number} attended - Total classes attended
 * @param {number} conducted - Total classes conducted
 * @param {number} targetPercentage - Target percentage (e.g. 75, 80, 85)
 * @returns {number} Required classes to attend
 */
export const calculateClassesNeeded = (attended, conducted, targetPercentage = 75) => {
  if (conducted === 0) return 0;
  if (targetPercentage >= 100) {
    if (conducted === 0) return 0;
    return attended === conducted ? 0 : Infinity;
  }

  const target = targetPercentage / 100;
  const currentRatio = conducted > 0 ? attended / conducted : 0;

  if (currentRatio >= target) {
    return 0; // Already achieved
  }

  const numerator = (target * conducted) - attended;
  const denominator = 1 - target;
  return Math.max(1, Math.ceil(numerator / denominator));
};

/**
 * Generates recovery & bunk projections for multiple targets (75%, 80%, 85%, 90%)
 */
export const getTargetBreakdown = (attended, conducted) => {
  const targets = [75, 80, 85, 90];
  return targets.map(target => ({
    target,
    needed: calculateClassesNeeded(attended, conducted, target),
    safeBunks: calculateSafeBunks(attended, conducted, target),
  }));
};

/**
 * Classifies attendance status and color coding
 */
export const getAttendanceStatus = (currentPct, threshold = 75) => {
  if (currentPct >= threshold + 10) {
    return {
      status: 'Excellent',
      color: 'emerald',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
      progressClass: 'bg-emerald-500',
    };
  }
  if (currentPct >= threshold) {
    return {
      status: 'Safe',
      color: 'blue',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
      progressClass: 'bg-blue-500',
    };
  }
  if (currentPct >= threshold - 10) {
    return {
      status: 'Warning',
      color: 'amber',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
      progressClass: 'bg-amber-500',
    };
  }
  return {
    status: 'Critical',
    color: 'rose',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
    progressClass: 'bg-rose-500',
  };
};
