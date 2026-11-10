import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Calculator,
  Target,
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  Sliders,
  Briefcase,
} from 'lucide-react';
import { subjectService } from '../services/subjectService';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

const GRADE_POINTS = [
  { grade: 'O (Outstanding)', points: 10 },
  { grade: 'A+ (Excellent)', points: 9 },
  { grade: 'A (Very Good)', points: 8 },
  { grade: 'B+ (Good)', points: 7 },
  { grade: 'B (Above Average)', points: 6 },
  { grade: 'C (Average)', points: 5 },
  { grade: 'P (Pass)', points: 4 },
  { grade: 'F (Fail)', points: 0 },
];

const CGPACalculatorPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('sgpa'); // 'sgpa' or 'target'
  const [loading, setLoading] = useState(false);

  // --- TAB 1: SGPA CALCULATOR STATE ---
  const [courses, setCourses] = useState([
    { id: 1, name: 'Subject 1', credits: 4, gradePoints: 9 },
    { id: 2, name: 'Subject 2', credits: 4, gradePoints: 8 },
    { id: 3, name: 'Subject 3', credits: 3, gradePoints: 8 },
    { id: 4, name: 'Subject 4', credits: 3, gradePoints: 7 },
    { id: 5, name: 'Subject Lab 1', credits: 1.5, gradePoints: 10 },
  ]);

  // Load user subjects if available
  useEffect(() => {
    const fetchUserSubjects = async () => {
      try {
        setLoading(true);
        const res = await subjectService.getSubjects();
        if (res.success && res.subjects && res.subjects.length > 0) {
          const mapped = res.subjects.map((sub, idx) => ({
            id: sub._id || idx + 1,
            name: sub.name,
            credits: sub.credits || 3,
            gradePoints: 8, // Default A grade
          }));
          setCourses(mapped);
        }
      } catch (err) {
        // Fallback to sample courses
      } finally {
        setLoading(false);
      }
    };
    fetchUserSubjects();
  }, []);

  const addCourse = () => {
    const newId = courses.length > 0 ? Math.max(...courses.map((c) => c.id)) + 1 : 1;
    setCourses([
      ...courses,
      { id: newId, name: `Subject ${courses.length + 1}`, credits: 3, gradePoints: 8 },
    ]);
  };

  const removeCourse = (id) => {
    if (courses.length <= 1) {
      toast.error('You need at least 1 course');
      return;
    }
    setCourses(courses.filter((c) => c.id !== id));
  };

  const updateCourse = (id, field, value) => {
    setCourses(
      courses.map((c) =>
        c.id === id
          ? {
              ...c,
              [field]: field === 'credits' || field === 'gradePoints' ? parseFloat(value) || 0 : value,
            }
          : c
      )
    );
  };

  // SGPA Calculations
  const totalCredits = courses.reduce((sum, c) => sum + (c.credits || 0), 0);
  const totalPoints = courses.reduce((sum, c) => sum + (c.credits || 0) * (c.gradePoints || 0), 0);
  const calculatedSGPA = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';

  // --- TAB 2: TARGET CGPA REVERSE CALCULATOR STATE ---
  const [completedSemesters, setCompletedSemesters] = useState(user?.semester ? Math.max(1, user.semester - 1) : 4);
  const [currentCGPA, setCurrentCGPA] = useState(7.5);
  const [totalSemesters, setTotalSemesters] = useState(8);
  const [targetCGPA, setTargetCGPA] = useState(8.5);

  const remainingSemesters = Math.max(0, totalSemesters - completedSemesters);
  const totalPointsNeeded = totalSemesters * targetCGPA;
  const pointsSecured = completedSemesters * currentCGPA;
  const pointsRemaining = totalPointsNeeded - pointsSecured;
  const requiredAvgSGPA =
    remainingSemesters > 0 ? (pointsRemaining / remainingSemesters).toFixed(2) : '0.00';
  const maxAchievableCGPA = (
    (pointsSecured + remainingSemesters * 10) /
    totalSemesters
  ).toFixed(2);
  const isTargetPossible = parseFloat(requiredAvgSGPA) <= 10.0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Academic Performance Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            CGPA & SGPA Predictor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Calculate your semester SGPA with credit weightage or reverse-engineer the exact GPA you need for your target graduating CGPA.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs">
          <button
            onClick={() => setActiveTab('sgpa')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'sgpa'
                ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Semester SGPA</span>
          </button>
          <button
            onClick={() => setActiveTab('target')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'target'
                ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Target CGPA Goal</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SEMESTER SGPA CALCULATOR */}
      {activeTab === 'sgpa' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Courses Form Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Semester Course Registry
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pre-populated from your active AttendX timetable and subjects.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={addCourse} leftIcon={Plus}>
                  Add Course
                </Button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-dark-border text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="pb-3 px-2">Course Name</th>
                      <th className="pb-3 px-2 w-28">Credits</th>
                      <th className="pb-3 px-2 w-48">Expected Grade</th>
                      <th className="pb-3 px-2 w-16 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                    {courses.map((course) => (
                      <tr key={course.id} className="group">
                        <td className="py-2.5 px-2">
                          <input
                            type="text"
                            value={course.name}
                            onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                            placeholder="Course Name"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-dark-border focus:border-brand-500 dark:focus:border-brand-500 bg-transparent text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:bg-white dark:focus:bg-dark-surface"
                          />
                        </td>
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            max="10"
                            value={course.credits}
                            onChange={(e) => updateCourse(course.id, 'credits', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-dark-surface text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500"
                          />
                        </td>
                        <td className="py-2.5 px-2">
                          <select
                            value={course.gradePoints}
                            onChange={(e) => updateCourse(course.id, 'gradePoints', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                          >
                            {GRADE_POINTS.map((g) => (
                              <option key={g.grade} value={g.points}>
                                {g.grade} ({g.points} pts)
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <button
                            onClick={() => removeCourse(course.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                            title="Remove Course"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SGPA Score Hero Card */}
          <div className="space-y-4">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-brand-600 to-indigo-700 text-white shadow-xl shadow-brand-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Award className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <span className="text-xs uppercase font-bold tracking-widest text-indigo-200">
                  Predicted SGPA
                </span>
                <div className="text-5xl font-black tracking-tight my-2 flex items-baseline gap-2">
                  <span>{calculatedSGPA}</span>
                  <span className="text-xl text-indigo-200 font-semibold">/ 10.0</span>
                </div>
                <p className="text-xs text-indigo-100 font-medium leading-relaxed">
                  {parseFloat(calculatedSGPA) >= 8.5
                    ? '🌟 Outstanding! First Class with Distinction caliber.'
                    : parseFloat(calculatedSGPA) >= 7.5
                    ? '🚀 Solid First Class! Eligible for tier-1 campus placements.'
                    : parseFloat(calculatedSGPA) >= 6.5
                    ? '👍 Good standing. Eligible for standard placement drives.'
                    : '⚠️ Below 6.5. Focus on high-credit subjects to boost your score.'}
                </p>

                <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-white/20">
                  <div>
                    <span className="text-[11px] text-indigo-200 block">Total Credits</span>
                    <span className="text-xl font-bold">{totalCredits}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-indigo-200 block">Grade Points</span>
                    <span className="text-xl font-bold">{totalPoints}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Placement Eligibility Benchmarks */}
            <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-600" />
                <span>Industry Placement Cutoffs</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-dark-surface">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Tier 1 Product Companies (FAANG / Startups)
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">8.0+ CGPA</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-dark-surface">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Standard Corporate & Tech Placements
                  </span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">7.0+ CGPA</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-dark-surface">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Mass IT Services Recruiters
                  </span>
                  <span className="font-bold text-slate-600 dark:text-slate-400">6.0+ CGPA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TARGET CGPA REVERSE CALCULATOR */}
      {activeTab === 'target' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Goal Input Controls */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Graduation CGPA Target Simulator
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Model your remaining semesters to find out what minimum SGPA you must score to graduate with your desired honors.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Completed Semesters
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={totalSemesters - 1}
                    value={completedSemesters}
                    onChange={(e) => setCompletedSemesters(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Current Cumulative CGPA
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="10"
                    value={currentCGPA}
                    onChange={(e) => setCurrentCGPA(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Total Semesters in Degree
                  </label>
                  <select
                    value={totalSemesters}
                    onChange={(e) => setTotalSemesters(parseInt(e.target.value) || 8)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  >
                    <option value={8}>8 Semesters (4-Year B.Tech / B.E / BS)</option>
                    <option value={6}>6 Semesters (3-Year B.Sc / BCA / BBA / B.Com)</option>
                    <option value={4}>4 Semesters (2-Year M.Tech / MCA / MBA / M.Sc)</option>
                    <option value={10}>10 Semesters (5-Year Dual Degree / Architecture)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Target Graduation CGPA
                    </label>
                    <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400">
                      {targetCGPA}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="6.0"
                    max="10.0"
                    step="0.05"
                    value={targetCGPA}
                    onChange={(e) => setTargetCGPA(parseFloat(e.target.value))}
                    className="w-full accent-brand-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Status Banner */}
              {isTargetPossible ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div>
                    <p className="font-bold mb-0.5">Your Goal is Achievable!</p>
                    <p>
                      You need to maintain an average of{' '}
                      <span className="font-extrabold underline">{requiredAvgSGPA} SGPA</span> over
                      your remaining {remainingSemesters} semesters.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <div>
                    <p className="font-bold mb-0.5">Mathematically Impossible</p>
                    <p>
                      Even if you score a perfect 10.0 SGPA in all remaining {remainingSemesters}{' '}
                      semesters, the highest possible graduating CGPA you can reach is{' '}
                      <span className="font-extrabold">{maxAchievableCGPA}</span>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Goal Analytics Card */}
          <div className="space-y-4">
            <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl relative overflow-hidden">
              <span className="text-xs uppercase font-bold tracking-widest text-slate-400">
                Required SGPA per Semester
              </span>
              <div className="text-5xl font-black tracking-tight my-2 flex items-baseline gap-2">
                <span
                  className={
                    parseFloat(requiredAvgSGPA) > 10.0
                      ? 'text-rose-400'
                      : parseFloat(requiredAvgSGPA) > 9.0
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }
                >
                  {isTargetPossible ? requiredAvgSGPA : '> 10.0'}
                </span>
                <span className="text-xl text-slate-400 font-semibold">/ 10.0</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isTargetPossible
                  ? `Maintain this minimum average across Semesters ${
                      completedSemesters + 1
                    } to ${totalSemesters}.`
                  : `Target exceeds mathematical maximum. Adjust goal to ${maxAchievableCGPA}.`}
              </p>

              <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block">Remaining Semesters</span>
                  <span className="text-lg font-bold text-white">{remainingSemesters}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Max Possible CGPA</span>
                  <span className="text-lg font-bold text-emerald-400">{maxAchievableCGPA}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Plan */}
            <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border shadow-xs space-y-2.5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>Strategy Insights</span>
              </h4>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Prioritize 4-credit theory courses; they drive 50% more weightage than 2-credit labs.</li>
                <li>Maintain 75%+ attendance to avoid debarment and internal marks penalties.</li>
                <li>Use AttendX AI to generate a revision plan 2 weeks prior to midterms.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CGPACalculatorPage;
