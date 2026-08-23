import React, { useState, useEffect } from 'react';
import { useSlideStore } from '../../store/useSlideStore';
import { llmService } from '../../services/llmService';
import { LLMProvider } from '../../types/llm';
import { 
  X, 
  Sparkles, 
  Key, 
  Check, 
  ShieldCheck, 
  Zap, 
  Bot, 
  ExternalLink,
  Cpu
} from 'lucide-react';

export const AIGeneratorModal: React.FC = () => {
  const { isAIGeneratorOpen, setAIGeneratorOpen } = useSlideStore();

  const [provider, setProvider] = useState<LLMProvider>('gemini');
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [keysSaved, setKeysSaved] = useState(false);

  useEffect(() => {
    if (isAIGeneratorOpen) {
      const cfg = llmService.getConfig();
      setProvider(cfg.provider || 'gemini');
      setGeminiKey(cfg.geminiKey || '');
      setOpenaiKey(cfg.openaiKey || '');
      setAnthropicKey(cfg.anthropicKey || '');
      setKeysSaved(false);
    }
  }, [isAIGeneratorOpen]);

  if (!isAIGeneratorOpen) return null;

  const handleSave = () => {
    llmService.saveConfig({
      provider,
      geminiKey,
      openaiKey,
      anthropicKey,
    });
    setKeysSaved(true);
    setTimeout(() => {
      setKeysSaved(false);
      setAIGeneratorOpen(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in">
      <div className="bg-editor-panel border border-editor-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-editor-border flex items-center justify-between bg-editor-panel/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Key size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                AI Engine & API Configuration
              </h3>
              <p className="text-[11px] text-slate-400">
                Choose cloud LLM provider or fast zero-API local parser
              </p>
            </div>
          </div>

          <button
            onClick={() => setAIGeneratorOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-editor-subtle transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          
          {/* Provider Selector Tabs */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Select AI Engine
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-editor-subtle border border-editor-border">
              {[
                { id: 'gemini' as LLMProvider, name: 'Gemini', badge: 'Free/Fast' },
                { id: 'openai' as LLMProvider, name: 'OpenAI', badge: 'GPT-4o' },
                { id: 'anthropic' as LLMProvider, name: 'Claude', badge: 'Sonnet' },
                { id: 'demo' as LLMProvider, name: 'Local', badge: 'Zero-API' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setProvider(item.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                    provider === item.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{item.name}</span>
                  <span className="text-[9px] opacity-75 font-normal">{item.badge}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Gemini API Key */}
          {provider === 'gemini' && (
            <div className="space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" />
                  <span>Google Gemini API Key</span>
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1"
                >
                  <span>Get Free Key</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 rounded-2xl bg-editor-subtle border border-editor-border focus:border-indigo-500 text-xs text-white outline-none font-mono placeholder:text-slate-500"
              />
              <p className="text-[11px] text-slate-400 leading-snug">
                Uses <strong>gemini-1.5-flash</strong> for high-speed dynamic presentation synthesis.
              </p>
            </div>
          )}

          {/* OpenAI API Key */}
          {provider === 'openai' && (
            <div className="space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Bot size={14} className="text-emerald-400" />
                  <span>OpenAI API Key</span>
                </label>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1"
                >
                  <span>OpenAI Keys</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="w-full px-4 py-3 rounded-2xl bg-editor-subtle border border-editor-border focus:border-indigo-500 text-xs text-white outline-none font-mono placeholder:text-slate-500"
              />
            </div>
          )}

          {/* Anthropic API Key */}
          {provider === 'anthropic' && (
            <div className="space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Cpu size={14} className="text-purple-400" />
                  <span>Anthropic API Key</span>
                </label>
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1"
                >
                  <span>Anthropic Keys</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <input
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-4 py-3 rounded-2xl bg-editor-subtle border border-editor-border focus:border-indigo-500 text-xs text-white outline-none font-mono placeholder:text-slate-500"
              />
            </div>
          )}

          {/* Zero-API Local Parser Info */}
          {provider === 'demo' && (
            <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 text-xs text-slate-300 space-y-1.5 animate-in fade-in">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400" />
                <span>Zero-API Dynamic Local Engine</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Automatically parses your actual pasted markdown outlines, headings, bullet lists, and statistics into structured Canva slides in <strong>&lt;50ms</strong> entirely inside your browser.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
            <span>Keys are stored strictly in your browser's LocalStorage and never sent to our servers.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-editor-border bg-editor-panel/50 flex items-center justify-end gap-2.5">
          <button
            onClick={() => setAIGeneratorOpen(false)}
            className="px-4 py-2.5 rounded-xl bg-editor-subtle hover:bg-editor-hover text-slate-300 text-xs font-semibold border border-editor-border transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5"
          >
            {keysSaved ? (
              <>
                <Check size={14} />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save & Apply</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
