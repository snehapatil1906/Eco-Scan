import React, { useState, useRef, useEffect } from 'react';
import {
  TrackedMaterial,
  UserPreferences,
  ChatMessage,
  CampusBin,
} from '../types';
import { apiService } from '../services/apiService';
import {
  Sparkles,
  Send,
  User,
  Bot,
  Loader2,
  Trash2,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Tag,
  MapPin,
} from 'lucide-react';

interface AiAssistantPageProps {
  currentMaterial: TrackedMaterial | null;
  onSelectMaterial: (m: TrackedMaterial | null) => void;
  allMaterials: TrackedMaterial[];
  userPreferences: UserPreferences;
  onUpdatePreferences: (prefs: UserPreferences) => void;
  bins: CampusBin[];
}

export function AiAssistantPage({
  currentMaterial,
  onSelectMaterial,
  allMaterials,
  userPreferences,
  onUpdatePreferences,
  bins,
}: AiAssistantPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: currentMaterial
        ? `Hello! I'm your Campus Circular Economy AI. I see you're currently inspecting **${currentMaterial.objectName}** (${currentMaterial.materialType}). How can I help you reuse, recycle, or route this item safely today?`
        : `Hello! I'm your Eco Scan Assistant. I can help you with campus disposal rules, upcycling projects, safety warnings, and live status of our Campus Digital Twin. Ask me anything or select a prompt below!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // When selected material changes, add a friendly context switch note
  useEffect(() => {
    if (currentMaterial) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ctx-${Date.now()}`,
          role: 'assistant',
          content: `Switched context to **${currentMaterial.objectName}** (${currentMaterial.id}). Suggested Bin: ${currentMaterial.assignedBinId || 'B01'}. Recommended Action: ${currentMaterial.recommendedAction}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [currentMaterial?.id]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputPrompt('');
    setLoading(true);

    try {
      // Build ecosystem summary for AI
      const twinSummary = {
        totalItems: allMaterials.length,
        awaitingCollection: allMaterials.filter((m) => m.currentStatus === 'Assigned to Bin').length,
        awaitingSorting: allMaterials.filter((m) => m.currentStatus === 'At Sorting Center').length,
        recovered: allMaterials.filter((m) => ['Processed', 'Reused', 'Composted'].includes(m.currentStatus)).length,
      };

      const replyText = await apiService.askAiAssistant(
        updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        {
          currentMaterial,
          userPreferences,
          twinSummary,
        }
      );

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      console.error('Chat error:', e);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content: `I ran into an issue connecting to the AI service: ${e.message}. You can continue tracking materials and consulting the local campus knowledge base!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'What should I do with this item?',
    'Can I reuse it safely in the hostel?',
    'How should I handle this safely?',
    'How can our hostel reduce packaging waste?',
    'Which campus bins are nearly full?',
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header and Personalization Toggle */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini 3.8 Flash Circular Advisor</span>
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Personalized Circular Economy AI Assistant
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Grounded in campus infrastructure, deterministic safety rules, and your sustainability goals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Personalization ({userPreferences.setting})</span>
          </button>
        </div>
      </div>

      {/* Personalization Drawer */}
      {showConfig && (
        <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200 animate-in fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-purple-950 uppercase tracking-wider">
              AI Recommendation Settings
            </h3>
            <span className="text-[11px] text-purple-700">No account required • Stored locally</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-purple-900 mb-1">Living Setting</label>
              <select
                value={userPreferences.setting}
                onChange={(e) =>
                  onUpdatePreferences({ ...userPreferences, setting: e.target.value as any })
                }
                className="w-full bg-white border border-purple-200 rounded-lg p-2 text-xs text-purple-950"
              >
                <option value="college">College Campus</option>
                <option value="hostel">Hostel Residence Wing</option>
                <option value="home">Home Apartment</option>
                <option value="office">Engineering Lab / Office</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-purple-900 mb-1">Primary Eco Goal</label>
              <select
                value={userPreferences.goal}
                onChange={(e) =>
                  onUpdatePreferences({ ...userPreferences, goal: e.target.value as any })
                }
                className="w-full bg-white border border-purple-200 rounded-lg p-2 text-xs text-purple-950"
              >
                <option value="reduce waste">Reduce Total Waste</option>
                <option value="reuse more">Maximize Reusability & Upcycling</option>
                <option value="recycle more">Recycle with Zero Contamination</option>
                <option value="save money">Save Money & Campus Thrifting</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-purple-900 mb-1">Preferred Action</label>
              <select
                value={userPreferences.preferredAction}
                onChange={(e) =>
                  onUpdatePreferences({ ...userPreferences, preferredAction: e.target.value as any })
                }
                className="w-full bg-white border border-purple-200 rounded-lg p-2 text-xs text-purple-950"
              >
                <option value="reuse">Reuse / Repurpose</option>
                <option value="donation">Campus EcoSwap Donation</option>
                <option value="recycling">Mechanical Recycling</option>
                <option value="composting">Composting</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active Item Context Strip */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-purple-600 shrink-0" />
          <span className="text-slate-500 font-medium">Focused Material Context:</span>
          {currentMaterial ? (
            <span className="font-bold text-slate-900 bg-purple-50 text-purple-900 px-2 py-0.5 rounded border border-purple-200">
              {currentMaterial.objectName} ({currentMaterial.id})
            </span>
          ) : (
            <span className="text-slate-400 italic">None selected (General campus mode)</span>
          )}
        </div>

        {allMaterials.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px]">Switch to:</span>
            <select
              value={currentMaterial?.id || ''}
              onChange={(e) => {
                const found = allMaterials.find((m) => m.id === e.target.value);
                onSelectMaterial(found || null);
              }}
              className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700"
              aria-label="Switch Material Context"
            >
              <option value="">-- General Q&A --</option>
              {allMaterials.slice(0, 8).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}: {m.objectName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Chat Messages Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[520px] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/40">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white shadow-2xs ${
                    isUser ? 'bg-slate-800' : 'bg-gradient-to-br from-purple-600 to-indigo-700'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none whitespace-pre-wrap'
                  }`}
                >
                  {msg.content}
                  <div
                    className={`text-[10px] mt-1 text-right ${
                      isUser ? 'text-slate-400' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white p-3 rounded-2xl border border-purple-200 text-xs text-purple-900 flex items-center gap-2 shadow-xs">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span>Formulating personalized circular advice...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Prompts Strip */}
        <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 px-1">
            Suggestions:
          </span>
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-900 border border-slate-200 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              currentMaterial
                ? `Ask anything about ${currentMaterial.objectName}...`
                : 'Ask how to reuse, repair, or recycle any item...'
            }
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 outline-hidden"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputPrompt.trim() || loading}
            className={`p-2.5 rounded-xl text-white shadow-xs transition-colors ${
              !inputPrompt.trim() || loading
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-purple-700 hover:bg-purple-800'
            }`}
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
