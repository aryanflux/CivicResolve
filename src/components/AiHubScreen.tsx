/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Send, Bot, User, Trash2, ShieldAlert, Sparkles, FileText, ArrowRight, CornerDownRight } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const PRESET_PROMPTS = [
  {
    title: "Draft Pothole Petition",
    desc: "Create a formal grievance letter for blacktopping a major road pothole.",
    prompt: "Please draft an official public grievance petition to the Municipal Commissioner complaining about a deep, dangerous pothole near our community entrance. Include placeholders for location, road name, and signature."
  },
  {
    title: "Draft Water-logging Letter",
    desc: "Draft an urgent complaint for blocked drains causing monsoon flooding.",
    prompt: "Help me write an urgent letter to the Ward Executive Engineer regarding severe water logging outside our main market due to clogged storm drainage. Ask for suction pumps to be deployed."
  },
  {
    title: "Draft Streetlight Request",
    desc: "Petition the electrical board to repair broken neighborhood streetlamps.",
    prompt: "I need to draft a formal request letter to the Electricity Board for restoring broken streetlights on our sector service lanes to prevent nighttime safety hazards. Keep it concise."
  },
  {
    title: "RTI Filing Guideline",
    desc: "Get step-by-step instructions for submitting an RTI application.",
    prompt: "Explain the step-by-step process of filing a Right to Information (RTI) application in India to check the allocation and spending status of community road repair funds. What is the fee?"
  }
];

export default function AiHubScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I am **CivicAssist**, your community liaison and municipal intelligence AI. \n\nI am configured with server-side Gemini intelligence to help you draft official public grievance letters, understand city ordinances, learn about environmental initiatives (like rain harvesting), and empower your local civic participation. \n\nHow can I support your neighborhood today? Choose a draft template below or write your own question!",
      timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setChatError('');
    const userMsg: ChatMessage = {
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      // Gather simplified chat history for context (up to last 10 messages)
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg.content, chatHistory }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to communicate with Gemini assistant.');
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.text || 'I am sorry, I did not receive a response from the model.',
        timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setChatError(err.message || 'Network error communicating with server AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputPrompt);
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Chat cleared! How else can I assist with your civic drafts or municipal ordinances?",
        timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setChatError('');
  };

  return (
    <div id="ai-hub-container" className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)] md:h-[650px]">
      {/* Left Column: Preset Templates */}
      <div id="ai-hub-sidebar" className="lg:col-span-1 bg-white border border-slate-200 p-4 rounded-2xl flex flex-col gap-4 overflow-y-auto shadow-sm">
        <div className="border-b border-slate-100 pb-3 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Civic templates</span>
        </div>

        <p className="text-[10px] text-slate-500 leading-normal mb-1 font-bold">
          Click any quick template to instantly generate official, pre-formatted letter templates or educational guidelines from the model:
        </p>

        <div className="flex flex-col gap-3 font-bold">
          {PRESET_PROMPTS.map((item, idx) => (
            <button
              id={`preset-prompt-btn-${idx}`}
              key={idx}
              onClick={() => handleSendMessage(item.prompt)}
              disabled={isLoading}
              className="text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100/60 hover:border-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group flex flex-col gap-1 shadow-sm"
            >
              <div className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                <span>{item.title}</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-[10px] text-slate-400 leading-normal font-medium">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Right Column: Chat Box Interface */}
      <div id="ai-chat-interface" className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden h-full shadow-sm">
        {/* Chat Header */}
        <div className="bg-slate-50 border-b border-slate-150 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold">
            <div className="w-8.5 h-8.5 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-800 text-sm">CivicAssist Companion</h3>
                <span className="bg-blue-50 border border-blue-100 text-blue-600 font-bold text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> Gemini
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-bold">Intelligent municipal coordinator</span>
            </div>
          </div>

          <button
            id="clear-chat-btn"
            onClick={clearChat}
            className="text-slate-450 hover:text-red-650 p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Clear Chat Messages"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Chat Area */}
        <div id="chat-messages-area" className="flex-grow overflow-y-auto p-5 space-y-5 bg-white">
          {messages.map((msg, idx) => {
            const isAI = msg.role === 'assistant';
            return (
              <div
                id={`chat-msg-${idx}`}
                key={idx}
                className={`flex gap-3 max-w-[85%] ${isAI ? 'self-start' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Icon */}
                <div className={`w-8 h-8 rounded-full border shrink-0 flex items-center justify-center text-xs font-semibold ${
                  isAI 
                    ? 'bg-slate-50 border-slate-200 text-slate-600' 
                    : 'bg-blue-650 border-blue-500 text-white'
                }`}>
                  {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className="space-y-1">
                  <div className={`px-4 py-3 rounded-2xl shadow-sm text-xs leading-relaxed border font-medium ${
                    isAI 
                      ? 'bg-slate-50 border-slate-100 text-slate-700 rounded-tl-none' 
                      : 'bg-blue-50 border-blue-100 text-slate-700 rounded-tr-none'
                  }`}>
                    {isAI ? (
                      <div className="markdown-body prose prose-slate prose-sm text-xs text-slate-750 max-w-none prose-headings:text-slate-800 prose-strong:text-blue-600">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  <span className={`text-[9px] text-slate-400 font-mono block font-bold ${isAI ? 'text-left pl-1' : 'text-right pr-1'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div id="chat-loading-indicator" className="flex gap-3 max-w-[80%] self-start animate-pulse">
              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-xs text-blue-600 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="space-y-1.5 font-bold">
                <div className="px-4 py-3 bg-slate-50 border border-slate-100 text-slate-500 rounded-2xl rounded-tl-none text-xs flex items-center gap-2 shadow-sm">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce duration-300" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce duration-300" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce duration-300" style={{ animationDelay: '300ms' }} />
                  </span>
                  <span>CivicAssist is researching ordinances & drafting...</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {chatError && (
            <div id="chat-error-alert" className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2 max-w-md mx-auto">
              <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
              <span>{chatError}</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleFormSubmit} className="p-4 bg-slate-50 border-t border-slate-150 flex gap-2">
          <input
            id="chat-input-text-field"
            type="text"
            required
            disabled={isLoading}
            placeholder={isLoading ? "Please wait for response..." : "Ask about bylaws, draft complaints, or request environmental fixes..."}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            className="flex-grow bg-white border border-slate-200 focus:border-blue-500 focus:outline-none px-4 py-2.5 rounded-xl text-slate-800 text-xs placeholder-slate-400 transition disabled:opacity-50 font-medium shadow-sm"
          />
          <button
            id="chat-send-submit-btn"
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1 shrink-0 shadow-sm"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
