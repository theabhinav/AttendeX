import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Calendar,
  Clock,
  Tag,
  AlertTriangle,
  ArrowRight,
  Send,
  Languages,
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { taskService } from '../../services/taskService';
import toast from 'react-hot-toast';

const SUGGESTIONS = [
  'Kal DSA assignment complete karna hai',
  'Remind me to study DBMS tomorrow at 7 PM',
  'Add a React project task with high priority',
  'What do I need to do today?',
  'Delete my completed tasks',
];

const VoiceAssistantModal = ({ isOpen, onClose, onTaskActionSuccess }) => {
  const [status, setStatus] = useState('IDLE'); // 'IDLE' | 'LISTENING' | 'PROCESSING' | 'CONFIRMING' | 'SUCCESS' | 'ERROR'
  const [transcript, setTranscript] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [language, setLanguage] = useState('hi-IN'); // 'hi-IN' | 'en-IN' (Hindi default for authentic Indian voice)
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const speechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize SpeechRecognition
  useEffect(() => {
    if (!speechSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setStatus('LISTENING');
    };

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setErrorMessage('Microphone permission denied. Please allow microphone access or use text input.');
      } else if (event.error === 'no-speech') {
        setErrorMessage('No speech detected. Please speak closer to your microphone.');
      } else {
        setErrorMessage(`Microphone error: ${event.error}`);
      }
      setStatus('ERROR');
    };

    recognition.onend = () => {
      // If we got transcript and are in LISTENING, trigger processing
      if (status === 'LISTENING') {
        setStatus('PROCESSING');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [language, speechSupported]);

  // Handle when listening finishes and we have a transcript
  useEffect(() => {
    if (status === 'PROCESSING' && transcript.trim()) {
      handleProcessCommand(transcript.trim());
    }
  }, [status, transcript]);

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      setStatus('IDLE');
      setTranscript('');
      setManualInput('');
      setAiResult(null);
      setErrorMessage('');
      // Auto-start listening if speech supported
      if (speechSupported) {
        startListening();
      }
    } else {
      stopListening();
      stopAudio();
    }
  }, [isOpen]);

  const startListening = () => {
    if (!speechSupported) {
      toast.error('Voice input is not supported in this browser. You can type your command below.');
      return;
    }
    setTranscript('');
    setAiResult(null);
    setErrorMessage('');
    try {
      recognitionRef.current?.start();
    } catch (e) {
      // In case already started
      try {
        recognitionRef.current?.stop();
        setTimeout(() => recognitionRef.current?.start(), 150);
      } catch (err) {}
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch (e) {}
  };

  // Stop any active audio / speech
  const stopAudio = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) {}
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    setIsSpeaking(false);
  };

  // Browser Web Speech fallback with natural Indian voice discovery
  const speakWebSpeechFallback = (text, isHindi) => {
    if (voiceMuted || !text || typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSpeaking(false);
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices() || [];
      if (isHindi) {
        utterance.lang = 'hi-IN';
        // Priority: Natural/Neural Hindi voice -> Google Hindi -> any Hindi voice -> Indian English
        const hindiVoice =
          voices.find((v) => v.lang.startsWith('hi') && v.name.toLowerCase().includes('natural')) ||
          voices.find((v) => v.name.toLowerCase().includes('swara') || v.name.toLowerCase().includes('madhur')) ||
          voices.find((v) => v.name.includes('Google') && v.lang.startsWith('hi')) ||
          voices.find((v) => v.lang.startsWith('hi')) ||
          voices.find((v) => v.lang === 'en-IN' || v.name.toLowerCase().includes('india'));
        if (hindiVoice) {
          utterance.voice = hindiVoice;
        }
      } else {
        utterance.lang = 'en-IN';
        const indianEngVoice =
          voices.find((v) => v.lang === 'en-IN') ||
          voices.find((v) => v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('neerja'));
        if (indianEngVoice) {
          utterance.voice = indianEngVoice;
        }
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis fallback error:', e);
      setIsSpeaking(false);
    }
  };

  // Ultra-natural audio playback (Server high-definition TTS + Browser fallback)
  const playSpeechAudio = (aiData) => {
    if (voiceMuted || !aiData || typeof window === 'undefined') return;

    stopAudio();

    const isHindi =
      language === 'hi-IN' ||
      aiData.detectedLanguage === 'hi' ||
      Boolean(aiData.speechHindi);

    // Text to read: prefer Devanagari Hindi for Hindi, or English for English
    const textToSpeak = isHindi && aiData.speechHindi
      ? aiData.speechHindi
      : (aiData.speechResponse || aiData.speechHindi || '');

    if (!textToSpeak || !textToSpeak.trim()) return;

    setIsSpeaking(true);

    try {
      const audioUrl = `/api/tasks/tts?text=${encodeURIComponent(textToSpeak)}&lang=${isHindi ? 'hi' : 'en'}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };
      audio.onerror = (e) => {
        console.warn('TTS streaming endpoint error, falling back to Web Speech:', e);
        speakWebSpeechFallback(textToSpeak, isHindi);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio play prevented, using Web Speech fallback:', err);
          speakWebSpeechFallback(textToSpeak, isHindi);
        });
      }
    } catch (err) {
      console.warn('HTML5 Audio error, using Web Speech fallback:', err);
      speakWebSpeechFallback(textToSpeak, isHindi);
    }
  };

  // Send command to backend AI for intent extraction
  const handleProcessCommand = async (textToProcess) => {
    if (!textToProcess || !textToProcess.trim()) return;

    try {
      setStatus('PROCESSING');
      const now = new Date();
      const clientContext = {
        date: now.toISOString().split('T')[0],
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: language === 'hi-IN' ? 'Hindi' : 'English',
      };

      const res = await taskService.processVoiceCommand(textToProcess, clientContext);

      if (res.success) {
        setAiResult(res);
        playSpeechAudio(res);

        // If task was automatically created & executed in MongoDB
        if (res.executed && res.task) {
          setStatus('SUCCESS');
          toast.success(res.message || `Task '${res.task.title}' added successfully!`);

          // Live sync across Dashboard and To-Do list
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('attendx:task-updated', { detail: res.task }));
          }
          if (onTaskActionSuccess) {
            onTaskActionSuccess(res.task);
          }
        } else if (res.intent === 'DELETE_TASK' || res.requiresConfirmation) {
          setStatus('CONFIRMING');
        } else {
          // Informational answer (e.g. Daily Summary or Query)
          setStatus('SUCCESS');
        }
      } else {
        setErrorMessage(res.message || 'Could not understand command.');
        setStatus('ERROR');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || 'Failed to process voice command');
      setStatus('ERROR');
    }
  };

  // User undoes an auto-added task
  const handleUndoTask = async () => {
    if (!aiResult?.task?._id) {
      setStatus('IDLE');
      setAiResult(null);
      return;
    }
    try {
      await taskService.deleteTask(aiResult.task._id);
      toast.success('Task removed.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('attendx:task-updated'));
      }
      if (onTaskActionSuccess) {
        onTaskActionSuccess();
      }
      setStatus('IDLE');
      setAiResult(null);
    } catch (e) {
      toast.error('Failed to undo task.');
    }
  };

  // User confirms the structured task action
  const handleConfirmAction = async () => {
    if (!aiResult) return;

    try {
      setExecuting(true);
      const res = await taskService.executeVoiceAction(aiResult);
      toast.success(res.message || 'Action executed successfully!');
      setStatus('SUCCESS');

      // Live sync across Dashboard and To-Do list
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('attendx:task-updated', { detail: res.task }));
      }

      // Play vocal confirmation in authentic voice
      const isHindi = language === 'hi-IN' || aiResult.detectedLanguage === 'hi';
      const confirmationPayload = isHindi
        ? { speechHindi: 'टास्क सफलतापूर्वक जोड़ दिया गया है!' }
        : { speechResponse: 'Task confirmed and saved successfully!' };
      playSpeechAudio(confirmationPayload);

      if (onTaskActionSuccess) {
        onTaskActionSuccess(res.task);
      }
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to execute task action');
    } finally {
      setExecuting(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setTranscript(manualInput.trim());
    handleProcessCommand(manualInput.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl shadow-2xl overflow-hidden p-6 text-slate-900 dark:text-slate-100 space-y-6">
        {/* Top Bar: Title, Language & Audio Mute controls */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">AttendX Voice Assistant</h3>
              <p className="text-[10px] text-slate-400">Natural language voice to-do engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-dark-surface p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLanguage('en-IN')}
                className={`px-2 py-0.5 rounded-lg transition-colors ${
                  language === 'en-IN' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="English / Hinglish"
              >
                EN / Hinglish
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi-IN')}
                className={`px-2 py-0.5 rounded-lg transition-colors ${
                  language === 'hi-IN' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Hindi"
              >
                हिंदी
              </button>
            </div>

            {/* Mute Voice Feedback */}
            <button
              type="button"
              onClick={() => {
                if (!voiceMuted) {
                  stopAudio();
                }
                setVoiceMuted(!voiceMuted);
              }}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-dark-border text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              title={voiceMuted ? 'Unmute speech feedback' : 'Mute speech feedback'}
            >
              {voiceMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-surface"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center: Microphone Visualizer & Waveform */}
        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          <div className="relative flex items-center justify-center">
            {/* Pulsing Aura */}
            {status === 'LISTENING' && (
              <>
                <div className="absolute w-28 h-28 bg-brand-500/20 rounded-full animate-ping pointer-events-none" />
                <div className="absolute w-24 h-24 bg-brand-500/30 rounded-full animate-pulse pointer-events-none" />
              </>
            )}

            <button
              onClick={status === 'LISTENING' ? stopListening : startListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl relative z-10 ${
                status === 'LISTENING'
                  ? 'bg-rose-600 text-white shadow-rose-500/30 scale-105'
                  : status === 'PROCESSING'
                  ? 'bg-brand-600 text-white animate-pulse'
                  : 'bg-brand-600 hover:bg-brand-700 text-white hover:scale-105 shadow-brand-500/30'
              }`}
            >
              {status === 'LISTENING' ? (
                <Mic className="w-9 h-9 animate-bounce" />
              ) : status === 'PROCESSING' ? (
                <Sparkles className="w-8 h-8 animate-spin" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </div>

          {/* Dynamic Audio Waveform Animation Bars */}
          {status === 'LISTENING' && (
            <div className="flex items-center gap-1 h-8">
              {[4, 8, 14, 20, 12, 18, 24, 16, 10, 6].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-brand-500 rounded-full animate-pulse"
                  style={{
                    height: `${h}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.6s',
                  }}
                />
              ))}
            </div>
          )}

          {/* Status Label */}
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              {status === 'LISTENING'
                ? "I'm listening..."
                : status === 'PROCESSING'
                ? 'Understanding your request with AI...'
                : status === 'CONFIRMING'
                ? 'Confirm Action'
                : status === 'SUCCESS'
                ? 'Done!'
                : status === 'ERROR'
                ? 'Could not recognize command'
                : 'Click mic to speak or select a suggestion'}
            </p>
          </div>
        </div>

        {/* Live Transcription Box */}
        {transcript && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-dark-border">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              You Said:
            </span>
            <p className="text-sm font-semibold text-slate-900 dark:text-white italic">
              "{transcript}"
            </p>
          </div>
        )}

        {/* AI Action Result / Preview Card */}
        {aiResult && (status === 'CONFIRMING' || (status === 'SUCCESS' && aiResult.task)) && (
          <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900/40 space-y-3">
            <div className="flex items-center justify-between">
              {status === 'SUCCESS' ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Task Added to Your Schedule</span>
                </div>
              ) : (
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Action Confirmation
                </span>
              )}
              <Badge variant={status === 'SUCCESS' ? 'success' : 'brand'}>
                {status === 'SUCCESS' ? 'Saved' : aiResult.intent}
              </Badge>
            </div>

            {aiResult.speechResponse && (
              <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-brand-500/10 dark:bg-brand-500/15 border border-brand-500/20">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isSpeaking
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30 animate-pulse'
                        : 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900/40'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                      "{aiResult.speechResponse}"
                    </p>
                    {aiResult.speechHindi && aiResult.speechHindi !== aiResult.speechResponse && (
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        {aiResult.speechHindi}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => playSpeechAudio(aiResult)}
                  disabled={voiceMuted}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                    isSpeaking
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white hover:bg-slate-50 dark:bg-dark-card dark:hover:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 hover:border-brand-500'
                  }`}
                  title={isSpeaking ? 'Speaking...' : 'Listen in authentic Hindi'}
                >
                  {isSpeaking ? (
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      Speaking
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <Volume2 className="w-3 h-3 text-brand-600" />
                      Listen
                    </span>
                  )}
                </button>
              </div>
            )}

            {aiResult.task && (
              <div className="p-3 bg-white dark:bg-dark-card rounded-xl border border-slate-200/80 dark:border-dark-border space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {aiResult.task.title}
                  </h4>
                  <Badge
                    variant={
                      aiResult.task.priority === 'High'
                        ? 'danger'
                        : aiResult.task.priority === 'Medium'
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {aiResult.task.priority} Priority
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {aiResult.task.category && (
                    <span className="flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400">
                      <Tag className="w-3.5 h-3.5" />
                      {aiResult.task.category}
                    </span>
                  )}
                  {aiResult.task.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {aiResult.task.dueDate}
                    </span>
                  )}
                  {aiResult.task.dueTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {aiResult.task.dueTime}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              {status === 'SUCCESS' ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUndoTask}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-200 dark:border-rose-900/40"
                  >
                    Undo / Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatus('IDLE');
                      setTranscript('');
                      setAiResult(null);
                      startListening();
                    }}
                    leftIcon={Mic}
                  >
                    Add Another
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onClose}
                    leftIcon={Check}
                  >
                    Done
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatus('IDLE');
                      setAiResult(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmAction}
                    isLoading={executing}
                    leftIcon={Check}
                  >
                    Confirm & Save
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Informational Answer Result (e.g. Daily Summary) */}
        {aiResult && status === 'SUCCESS' && !aiResult.task && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                <Check className="w-4 h-4" />
                <span>Assistant Response</span>
              </div>
              <button
                type="button"
                onClick={() => playSpeechAudio(aiResult)}
                disabled={voiceMuted}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-dark-card border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-pulse text-brand-600' : ''}`} />
                <span>{isSpeaking ? 'Speaking...' : 'Listen'}</span>
              </button>
            </div>
            <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
              {aiResult.speechResponse}
            </p>
            {aiResult.speechHindi && aiResult.speechHindi !== aiResult.speechResponse && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {aiResult.speechHindi}
              </p>
            )}
          </div>
        )}

        {/* Error Notification */}
        {status === 'ERROR' && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{errorMessage || "Sorry, I couldn't understand that. Please try again."}</p>
              <button
                onClick={startListening}
                className="mt-1.5 font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Try Speaking Again</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Suggestion Pills (Shown in IDLE or ERROR state) */}
        {(status === 'IDLE' || status === 'ERROR') && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Try saying:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTranscript(item);
                    handleProcessCommand(item);
                  }}
                  className="text-xs px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-surface dark:hover:bg-dark-card border border-slate-200/60 dark:border-dark-border text-slate-700 dark:text-slate-300 transition-colors text-left"
                >
                  "{item}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Manual Text Input Fallback Bar */}
        <form onSubmit={handleManualSubmit} className="pt-2 border-t border-slate-100 dark:border-dark-border flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Or type voice command in English, Hindi, or Hinglish..."
            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={!manualInput.trim()}
            className="p-2 rounded-xl bg-brand-600 text-white disabled:opacity-40 hover:bg-brand-700 transition-colors"
            title="Send command"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default VoiceAssistantModal;

