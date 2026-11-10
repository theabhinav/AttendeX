import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calculator as CalcIcon,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Flame,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { subjectService } from '../services/subjectService';
import { attendanceService } from '../services/attendanceService';
import {
  calculateSafeBunks,
  calculateClassesNeeded,
  getTargetBreakdown,
  calculatePercentage,
} from '../utils/attendanceCalculations';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CalculatorPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const subjectIdParam = searchParams.get('subjectId');

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [threshold, setThreshold] = useState(user?.attendanceThreshold || 75);

  // Stats
  const [attended, setAttended] = useState(18);
  const [conducted, setConducted] = useState(20);
  const [loading, setLoading] = useState(true);

  // Load user subjects
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setLoading(true);
        const res = await subjectService.getSubjects();
        setSubjects(res.subjects || []);

        const initialSub = subjectIdParam || (res.subjects && res.subjects[0]?._id);
        if (initialSub) {
          setSelectedSubjectId(initialSub);
          fetchSubjectAttendance(initialSub);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadSubjects();
  }, [subjectIdParam]);

  const fetchSubjectAttendance = async (subId) => {
    try {
      const res = await attendanceService.getAttendance({ subjectId: subId });
      const recs = res.records || [];
      const att = recs.filter((r) => r.status === 'Present').length;
      const miss = recs.filter((r) => r.status === 'Absent').length;
      const total = att + miss;

      setAttended(att);
      setConducted(total > 0 ? total : 0);
    } catch (e) {
      console.warn('Could not fetch subject attendance:', e);
    }
  };

  const handleSubjectChange = (id) => {
    setSelectedSubjectId(id);
    fetchSubjectAttendance(id);
  };

  // Math Calculations
  const currentPct = calculatePercentage(attended, conducted);
  const safeBunks = calculateSafeBunks(attended, conducted, threshold);
  const neededForThreshold = calculateClassesNeeded(attended, conducted, threshold);
  const targetBreakdown = getTargetBreakdown(attended, conducted);

  const isSafe = currentPct >= threshold;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 mb-1">
          <CalcIcon className="w-4 h-4" />
          <span>Smart Academic Projection Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Smart Bunk Calculator
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Mathematically compute safe absences and exact recovery targets without risking attendance shortages.
        </p>
      </div>

      {/* Main Calculator Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Subject Selector & Simulation Inputs */}
        <Card className="lg:col-span-1 p-6 space-y-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-dark-border">
            Select Course or Customize Numbers
          </h3>

          {/* Subject Dropdown */}
          {subjects.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                Load Enrolled Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface text-slate-900 dark:text-white text-xs font-semibold px-3.5 py-2.5 focus:ring-2 focus:ring-brand-500"
              >
                {subjects.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.name} {sub.code ? `(${sub.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Interactive Inputs for manual simulation */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Classes Conducted"
              type="number"
              min="0"
              value={conducted}
              onChange={(e) => {
                const val = Math.max(0, Number(e.target.value));
                setConducted(val);
                if (attended > val) setAttended(val);
              }}
            />

            <Input
              label="Classes Attended"
              type="number"
              min="0"
              max={conducted}
              value={attended}
              onChange={(e) => {
                const val = Math.max(0, Number(e.target.value));
                setAttended(Math.min(val, conducted));
              }}
            />
          </div>

          {/* Target Threshold */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Target Threshold
              </label>
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                {threshold}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="1"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-brand-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-dark-border text-[11px] text-slate-500">
            Numbers update calculations instantly in real-time.
          </div>
        </Card>

        {/* Right 2 Columns: Mathematical Results & Target Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Verdict Card */}
          <Card
            className={`p-6 sm:p-8 border-2 transition-all ${
              isSafe
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/30'
                : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-500/30'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`p-1.5 rounded-xl ${
                  isSafe ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}
              >
                {isSafe ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </span>
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  isSafe
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {isSafe ? 'Attendance in Safe Zone' : 'Shortage Alert'}
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-snug">
                {isSafe ? (
                  <>
                    You can miss up to{' '}
                    <span className="text-emerald-600 dark:text-emerald-400 underline decoration-emerald-500/40">
                      {safeBunks} consecutive {safeBunks === 1 ? 'class' : 'classes'}
                    </span>{' '}
                    while maintaining at least {threshold}% attendance.
                  </>
                ) : (
                  <>
                    Your attendance is currently{' '}
                    <span className="text-rose-600 dark:text-rose-400 font-black">{currentPct}%</span>.
                    You need to attend the next{' '}
                    <span className="text-rose-600 dark:text-rose-400 underline decoration-rose-500/40">
                      {neededForThreshold} consecutive {neededForThreshold === 1 ? 'class' : 'classes'}
                    </span>{' '}
                    to recover to {threshold}%.
                  </>
                )}
              </h2>
            </div>

            {/* Quick Metrics Bar */}
            <div className="mt-6 pt-6 border-t border-slate-200/60 dark:border-dark-border grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500">Current Rate</span>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  {currentPct}%
                </p>
              </div>
              <div>
                <span className="text-slate-500">Classes Held</span>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  {conducted}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Classes Attended</span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {attended}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Max Safe Bunks</span>
                <p className="text-xl font-black text-brand-600 dark:text-brand-400 mt-0.5">
                  {safeBunks}
                </p>
              </div>
            </div>
          </Card>

          {/* Target Breakdown Table (75%, 80%, 85%, 90%) */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Multi-Target Milestone Breakdown
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Detailed classes required or bunks allowed for standard benchmarks:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {targetBreakdown.map((item) => {
                const reached = currentPct >= item.target;
                return (
                  <div
                    key={item.target}
                    className="p-4 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface/60 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.target}% Goal
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          reached
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {reached ? 'Achieved' : 'Need Classes'}
                      </span>
                    </div>

                    <div className="mt-2">
                      {reached ? (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          Can miss up to <strong>{item.safeBunks}</strong> {item.safeBunks === 1 ? 'class' : 'classes'}
                        </p>
                      ) : (
                        <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                          Attend next <strong>{item.needed}</strong> {item.needed === 1 ? 'class' : 'classes'}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Interactive What-If Scenario Projections */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Interactive "What-If" Scenario Projections
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Instant percentage outcome if you miss or attend upcoming classes:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* If you miss next classes */}
              <div className="p-4 rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20">
                <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-2.5 flex items-center justify-between">
                  <span>If you MISS upcoming classes:</span>
                  <span className="text-[10px] uppercase font-semibold text-rose-500">Risk Matrix</span>
                </h4>
                <div className="space-y-2 text-xs">
                  {[1, 2, 3, 5].map((bunks) => {
                    const newConducted = (conducted || 0) + bunks;
                    const newPct = Math.round(((attended || 0) / newConducted) * 1000) / 10;
                    const drop = Math.round((currentPct - newPct) * 10) / 10;
                    const meetsTarget = newPct >= threshold;
                    return (
                      <div
                        key={bunks}
                        className="flex justify-between items-center py-1.5 border-b border-rose-100/60 dark:border-rose-950/40 last:border-0"
                      >
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          Miss {bunks} {bunks === 1 ? 'class' : 'classes'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${meetsTarget ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {newPct}%
                          </span>
                          {drop > 0 && (
                            <span className="text-[10px] text-rose-500 font-semibold">
                              (-{drop}%)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* If you attend next classes */}
              <div className="p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20">
                <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2.5 flex items-center justify-between">
                  <span>If you ATTEND upcoming classes:</span>
                  <span className="text-[10px] uppercase font-semibold text-emerald-500">Growth Matrix</span>
                </h4>
                <div className="space-y-2 text-xs">
                  {[1, 2, 3, 5].map((moreAtt) => {
                    const newConducted = (conducted || 0) + moreAtt;
                    const newAttended = (attended || 0) + moreAtt;
                    const newPct = Math.round((newAttended / newConducted) * 1000) / 10;
                    const gain = Math.round((newPct - currentPct) * 10) / 10;
                    const meetsTarget = newPct >= threshold;
                    return (
                      <div
                        key={moreAtt}
                        className="flex justify-between items-center py-1.5 border-b border-emerald-100/60 dark:border-emerald-950/40 last:border-0"
                      >
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          Attend next {moreAtt} {moreAtt === 1 ? 'class' : 'classes'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${meetsTarget ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {newPct}%
                          </span>
                          {gain > 0 && (
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              (+{gain}%)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* Mathematical Proof Card */}
          <Card className="p-5 bg-slate-50 dark:bg-dark-surface border border-slate-200/80 dark:border-dark-border">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Under the Hood: Accurate Formula
              </h4>
            </div>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <p>
                <strong>Safe Bunks:</strong>{' '}
                <code className="bg-white dark:bg-dark-card px-1.5 py-0.5 rounded border text-[11px]">
                  B = ⌊ (Attended / (Target / 100)) - Conducted ⌋
                </code>
              </p>
              <p>
                <strong>Recovery Classes:</strong>{' '}
                <code className="bg-white dark:bg-dark-card px-1.5 py-0.5 rounded border text-[11px]">
                  K = ⌈ ((Target / 100) * Conducted - Attended) / (1 - Target / 100) ⌉
                </code>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalculatorPage;
