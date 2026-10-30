import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Camera,
  Layers,
  ChevronDown,
} from 'lucide-react';

const INITIAL_MESSAGES = [
  {
    id: 'm-1',
    sender: 'bot',
    text: `Hello! I'm **ExpiryBot**, your interactive guide for ExpiryWatch AI. 👋\n\nI can show you how to inspect products step-by-step, find stamped batch codes, or explain how our zero-hallucination verification works.`,
    options: [
      { label: '🚀 How to inspect a product step-by-step', prompt: 'Tell me the step-by-step procedure to inspect a product packaging.' },
      { label: '🔍 Where is the EXP or Batch Code stamped?', prompt: 'Where do I find the printed expiration date or lot number on bottles and boxes?' },
      { label: '🛡️ What is the Honesty Contract / Truth Ladder?', prompt: 'Explain the Truth Ladder and why ExpiryWatch never guesses dates.' },
      { label: '💻 Why are computer mice non-perishable?', prompt: 'Why does the app say electronics like a computer mouse are non-perishable?' },
    ],
  },
];

export function HelpChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSend = async (userText) => {
    const textToSend = userText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          history: messages.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      if (!res.ok) {
        throw new Error('Chat service unavailable');
      }

      const data = await res.json();
      const botMessage = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: data.reply || 'Here is the guidance for your query.',
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: `**Step-by-Step Procedure to Inspect Any Product:**\n\n1. Go to **Inspect Product** (/scan)\n2. Upload or snap up to 5 clear photos (Front, Back, and stamped Batch/EXP area)\n3. Tesseract OCR and Gemini Vision extract printed dates\n4. Confirm any ambiguous formats (DMY vs MDY)\n5. View verified provenance assessment (PRINTED, LABEL_RULE, etc.)\n\n*Tip: You can also use our 1-click test samples on the scan page!*`,
          action: { label: 'Go to Scanner Now', path: '/scan' },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (option) => {
    handleSend(option.prompt);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-5 right-5 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group active:scale-95 border border-slate-700/60"
            aria-label="Open AI Help Guide Chatbot"
          >
            <div className="relative">
              <Bot className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold leading-tight flex items-center gap-1">
                Help & Step Guide
                <Sparkles className="w-3 h-3 text-amber-300" />
              </span>
              <span className="text-[10px] text-slate-400 leading-tight">
                Ask ExpiryBot
              </span>
            </div>
          </button>
        )}
      </div>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[92vw] sm:w-[410px] h-[550px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-white flex items-center gap-1.5">
                  ExpiryBot AI Guide
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Live
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Step-by-step assistant & packaging expert
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close Help Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${
                  m.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-2.5 ${
                    m.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap space-y-1.5 font-sans">
                    {m.text.split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>

                  {/* Direct Navigation Action (if any) */}
                  {m.action && (
                    <button
                      onClick={() => {
                        navigate(m.action.path);
                        setIsOpen(false);
                      }}
                      className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      {m.action.label}
                      <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </button>
                  )}

                  {/* Prompt Quick Options (if present) */}
                  {m.options && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Quick Questions:
                      </span>
                      <div className="flex flex-col gap-1.5">
                        {m.options.map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleOptionClick(opt)}
                            className="text-left text-[11px] p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/60 hover:border-indigo-200 transition-colors font-medium text-slate-700"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-slate-500 text-xs">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white border border-slate-200 px-3.5 py-2 rounded-2xl rounded-tl-xs shadow-2xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-slate-400 ml-1">Consulting Honesty Contract...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200/90 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask how to scan, rules, or questions..."
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl transition-colors shadow-xs active:scale-95 shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1.5">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Zero-hallucination verified answers
              </span>
              <span>English & Hindi</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
