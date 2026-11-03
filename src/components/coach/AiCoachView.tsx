/**
 * AI Voice Coach Studio & Consultation View
 * Powered by Gemini AI for real-time gender-affirming voice modification guidance.
 */

import React, { useState } from 'react';
import { VocalTrack, VoiceMetrics } from '../../types/voice';
import {
  Brain,
  Send,
  Sparkles,
  Bot,
  User,
  HeartPulse,
  Lightbulb,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

interface AiCoachViewProps {
  track: VocalTrack;
  metrics: VoiceMetrics;
}

interface ChatMessage {
  id: string;
  sender: 'coach' | 'user';
  text: string;
  timestamp: string;
}

export const AiCoachView: React.FC<AiCoachViewProps> = ({ track, metrics }) => {
  const isFem = track === 'feminization';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'coach',
      text: isFem
        ? "Hello! I am your AI Voice Coach specializing in vocal feminization. I analyze your pitch, formants, and resonance live. What aspect of your voice would you like to explore today? (e.g., larynx elevation, tongue posture, or eliminating throat strain?)"
        : "Welcome! I am your AI Voice Coach specializing in vocal masculinization and acoustic grounding. Whether you are working on pharyngeal expansion, chest bone resonance, or downward sentence cadence, ask me anything!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const promptChips = isFem
    ? [
        'How do I brighten resonance without raising pitch?',
        'My throat feels tight when sustaining 210 Hz. What helps?',
        'How do I make my speech inflection more melodic?',
        'What is the difference between thin vocal weight and falsetto?',
      ]
    : [
        'How do I expand my throat space for deep resonance?',
        'How do I ground my sentence endings downward?',
        'How can I get more chest bone vibration?',
        'How do I speak lower without vocal fry or strain?',
      ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          track,
          currentMetrics: {
            pitch: metrics.pitch,
            resonanceScore: metrics.resonanceScore,
            stability: metrics.stability,
            vocalWeight: metrics.vocalWeight,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const coachMsg: ChatMessage = {
          id: `coach-${Date.now()}`,
          sender: 'coach',
          text: data.reply || 'Let us continue working on your target vocal placement!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, coachMsg]);
      } else {
        throw new Error('Server response not ok');
      }
    } catch (err) {
      console.warn('AI coach fetch error:', err);
      // Fallback response
      const fallbackReply: ChatMessage = {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        text: isFem
          ? "Remember to keep your breath steady and relax your jaw. For bright resonance, arch the back of your tongue like saying 'key' while keeping your neck tension-free."
          : "Focus on open cavernous space in the back of your pharynx like the start of a relaxed yawn. Sympathetic chest vibration gives you acoustic depth without straining.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">AI Speech & Vocal Coach</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 font-mono">
                Gemini 3.8 SLP
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Real-time physiological adjustments, acoustic analysis, and vocal health guidance
            </p>
          </div>
        </div>

        {/* Live Context Indicator */}
        <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400 font-mono">
            Live Link: {metrics.pitch > 0 ? `${Math.round(metrics.pitch)} Hz / ${metrics.resonanceScore}% Res` : 'Ready'}
          </span>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[520px]">
        {/* Messages Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-2xl ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.sender === 'user'
                    ? 'bg-teal-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-teal-400 border border-slate-700'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed space-y-1 shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-teal-600 text-slate-50 rounded-tr-none'
                    : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>
                <div
                  className={`text-[10px] text-right font-mono ${
                    msg.sender === 'user' ? 'text-teal-200' : 'text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 max-w-lg">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-teal-400 flex items-center justify-center shrink-0">
                <Brain className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <span>AI Coach is analyzing acoustic physiology...</span>
              </div>
            </div>
          )}
        </div>

        {/* Prompt Suggestions */}
        <div className="p-3 bg-slate-950/70 border-t border-slate-800/80 flex gap-2 overflow-x-auto text-xs">
          {promptChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(chip)}
              className="px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-800 hover:text-teal-300 text-slate-300 border border-slate-700/80 shrink-0 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ask your AI Voice Coach about ${track} techniques, throat comfort, or resonance...`}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
