import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Bot,
  User,
  Copy,
  Check,
  MessageSquare,
  ChevronRight,
  Clock,
  HelpCircle,
  Cpu,
  Layers,
  Wand2,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { chatService } from '../services/chatService';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SUGGESTED_PROMPTS = [
  {
    icon: Calendar,
    title: "Today's Schedule",
    prompt: 'What classes and labs do I have scheduled for today?',
  },
  {
    icon: Wand2,
    title: 'Can I Bunk?',
    prompt: 'Can I safely bunk my next lecture without dropping below required attendance?',
  },
  {
    icon: HelpCircle,
    title: 'Lowest Attendance',
    prompt: 'Which subject has my lowest attendance and how many classes do I need to attend to recover?',
  },
  {
    icon: BookOpen,
    title: 'Weekly Study Plan',
    prompt: 'Create an intelligent study plan for this week based on my free periods.',
  },
];

const ChatbotPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const res = await chatService.getConversations();
      const convs = res.conversations || [];
      setConversations(convs);

      if (convs.length > 0) {
        selectConversation(convs[0]._id);
      } else {
        // Create initial conversation automatically
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  const selectConversation = async (id) => {
    try {
      setActiveConversationId(id);
      const res = await chatService.getConversationMessages(id);
      setMessages(res.messages || []);
      scrollToBottom();
    } catch (err) {
      toast.error('Failed to load messages');
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await chatService.createConversation('New Academic Chat');
      if (res.conversation) {
        setConversations((prev) => [res.conversation, ...prev]);
        setActiveConversationId(res.conversation._id);
        setMessages([]);
      }
    } catch (err) {
      toast.error('Failed to create new conversation');
    }
  };

  const handleDeleteConversation = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await chatService.deleteConversation(id);
      const remaining = conversations.filter((c) => c._id !== id);
      setConversations(remaining);
      if (activeConversationId === id) {
        if (remaining.length > 0) {
          selectConversation(remaining[0]._id);
        } else {
          handleNewChat();
        }
      }
      toast.success('Conversation deleted');
    } catch (err) {
      toast.error('Failed to delete conversation');
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (textToSend = null) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || loading) return;

    if (!activeConversationId) {
      toast.error('Please create or select a chat first.');
      return;
    }

    const tempUserMsg = {
      _id: 'temp_' + Date.now(),
      role: 'user',
      content: query,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputQuery('');
    setLoading(true);
    scrollToBottom();

    try {
      const res = await chatService.sendMessage(activeConversationId, query);
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m._id !== tempUserMsg._id);
        return [...withoutTemp, res.userMessage, res.aiMessage];
      });

      // Update conversation title if modified
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id === activeConversationId && c.title === 'New Academic Chat') {
            return { ...c, title: query.substring(0, 30) + '...' };
          }
          return c;
        })
      );
      scrollToBottom();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'AttendX AI failed to respond.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Simple Markdown-like renderer
  const renderFormattedText = (content) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return <h4 key={idx} className="font-bold text-slate-900 dark:text-white mt-2 mb-1">{line.replace('### ', '')}</h4>;
          }
          if (line.startsWith('## ')) {
            return <h3 key={idx} className="font-bold text-slate-900 dark:text-white text-base mt-2 mb-1">{line.replace('## ', '')}</h3>;
          }
          if (line.startsWith('# ')) {
            return <h2 key={idx} className="font-bold text-slate-900 dark:text-white text-lg mt-3 mb-1">{line.replace('# ', '')}</h2>;
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-2 ml-2">
                <span className="text-brand-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                <span>{renderInlineStyles(line.substring(2))}</span>
              </div>
            );
          }
          if (/^\d+\.\s/.test(line)) {
            return (
              <div key={idx} className="flex items-start gap-2 ml-2">
                <span className="font-bold text-brand-600 dark:text-brand-400 shrink-0">
                  {line.match(/^\d+\./)[0]}
                </span>
                <span>{renderInlineStyles(line.replace(/^\d+\.\s/, ''))}</span>
              </div>
            );
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-1.5" />;
          }
          return <p key={idx}>{renderInlineStyles(line)}</p>;
        })}
      </div>
    );
  };

  const renderInlineStyles = (text) => {
    // Bold **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col sm:flex-row gap-4 animate-in fade-in duration-200">
      {/* LEFT: Conversation History Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-full sm:w-72 flex' : 'hidden sm:hidden'
        } flex-col shrink-0 rounded-3xl bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border shadow-subtle overflow-hidden`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              AttendX AI Chats
            </span>
          </div>

          <Button size="xs" variant="primary" onClick={handleNewChat} leftIcon={Plus}>
            New Chat
          </Button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No previous chats. Start a conversation with AttendX AI!
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = c._id === activeConversationId;
              return (
                <div
                  key={c._id}
                  onClick={() => selectConversation(c._id)}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-surface'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{c.title || 'Academic Chat'}</span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteConversation(c._id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-all"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info card */}
        <div className="p-3 m-2 rounded-2xl bg-slate-50 dark:bg-dark-surface border border-slate-100 dark:border-dark-border text-[11px] text-slate-500 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Powered by Google Gemini 3.5 & Live Database Integration</span>
        </div>
      </aside>

      {/* RIGHT: Main Chat Area */}
      <div className="flex-1 flex flex-col rounded-3xl bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border shadow-subtle overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 px-6 border-b border-slate-100 dark:border-dark-border flex items-center justify-between bg-white dark:bg-dark-card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>AttendX AI Copilot</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Online
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Connected to your real timetable, subjects & attendance records
              </p>
            </div>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="max-w-xl mx-auto py-8 text-center space-y-6">
              <div className="h-16 w-16 rounded-3xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto shadow-sm">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Hello, {user?.name || 'Student'}! How can I help you today?
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Ask me anything about your timetable, bunk capacity, low attendance recovery, or exam study plans.
                </p>
              </div>

              {/* Suggested Prompt Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-2">
                {SUGGESTED_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.prompt)}
                    className="p-3 rounded-2xl border border-slate-200/80 dark:border-dark-border bg-slate-50 dark:bg-dark-surface/60 hover:border-brand-400 dark:hover:border-brand-500 transition-all text-xs group"
                  >
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-0.5">
                      <p.icon className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      <span>{p.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {p.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m._id || idx}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 transition-all ${
                      isUser
                        ? 'bg-brand-600 text-white shadow-sm rounded-tr-xs'
                        : 'bg-slate-50 dark:bg-dark-surface text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-dark-border rounded-tl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                        {m.content}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {renderFormattedText(m.content)}

                        {/* Tool call indicator tags if any */}
                        {m.toolCalls && m.toolCalls.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/50 dark:border-dark-border flex flex-wrap gap-1.5 mt-2">
                            {m.toolCalls.map((tc, tcIdx) => (
                              <span
                                key={tcIdx}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                              >
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span>Verified from {tc.name}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Copy button */}
                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={() => handleCopy(m.content, idx)}
                            className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
                          >
                            {copiedIdx === idx ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-1 text-xs font-bold">
                      {user?.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="rounded-2xl p-4 bg-slate-50 dark:bg-dark-surface border border-slate-200/80 dark:border-dark-border text-xs text-slate-500 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>AttendX AI is querying your academic records...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask AttendX AI about your timetable, bunks, or study plan..."
              disabled={loading}
              className="flex-1 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-dark-border px-4 py-3 bg-slate-50 dark:bg-dark-surface text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder:text-slate-400"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!inputQuery.trim() || loading}
              className="rounded-2xl px-5"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
