import React, { useState } from 'react';
import {
  Clock,
  Coins,
  AlertOctagon,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ArrowDownRight,
  ArrowUpRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Step } from '../../api/types';

interface StepPanelProps {
  step: Step;
}

const JsonViewer: React.FC<{ title: string; data: any; defaultOpen?: boolean }> = ({
  title,
  data,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  if (data === undefined || data === null) return null;

  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="border border-border-subtle rounded-md bg-bg-base overflow-hidden">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 bg-bg-surface flex items-center justify-between cursor-pointer hover:bg-bg-elevated transition-colors select-none"
      >
        <div className="flex items-center gap-2 text-[11px] font-mono font-medium text-zinc-300">
          {isOpen ? (
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          ) : (
            <ChevronRight className="w-3 h-3 text-zinc-500" />
          )}
          <span>{title}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="p-1 rounded text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
          title="Copy payload"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-border-subtle bg-bg-deep"
          >
            <div className="p-3 overflow-x-auto text-[11px] font-mono text-zinc-300 leading-relaxed max-h-56">
              <pre className="whitespace-pre-wrap break-all">{jsonString}</pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const StepPanel: React.FC<StepPanelProps> = ({ step }) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const handleCopyPrompt = () => {
    if (!step.raw_prompt) return;
    navigator.clipboard.writeText(step.raw_prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 1200);
  };

  return (
    <div className="p-5 space-y-4 bg-bg-base/70">
      {/* Header Info */}
      <div className="flex items-start justify-between border-b border-border-subtle pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-zinc-500">
              STEP #{step.step_idx.toString().padStart(2, '0')}
            </span>
            <span className="text-sm font-mono font-bold text-zinc-100">{step.step_name}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg-surface text-blue-400 border border-blue-500/20 capitalize">
              {step.step_type.replace('_', ' ')}
            </span>
          </div>

          {step.tool_name && (
            <div className="mt-1 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
              <span className="text-zinc-500">Tool Target:</span>
              <span className="text-amber-300 font-semibold">{step.tool_name}</span>
            </div>
          )}
        </div>

        {/* Telemetry Metrics */}
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          {step.latency_ms !== undefined && (
            <span className="flex items-center gap-1 bg-bg-surface px-2 py-0.5 rounded border border-border-subtle text-[11px]">
              <Clock className="w-3 h-3 text-zinc-500" />
              {step.latency_ms.toFixed(1)} ms
            </span>
          )}
          {step.tokens !== undefined && (
            <span className="flex items-center gap-1 bg-bg-surface px-2 py-0.5 rounded border border-border-subtle text-[11px]">
              <Coins className="w-3 h-3 text-zinc-500" />
              {step.tokens} tok
            </span>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {step.error_flag && (
        <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-300 font-mono">
          <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-rose-400">STEP ERROR DETECTED:</span>
            <p className="text-[11px] text-rose-200">{step.error_message || 'Exception raised during step'}</p>
          </div>
        </div>
      )}

      {/* Reads & Writes Dependencies */}
      <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
        <div className="p-2.5 rounded-md bg-bg-surface border border-border-subtle space-y-1">
          <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase font-semibold">
            <ArrowDownRight className="w-3 h-3 text-blue-400" />
            <span>Reads Variables</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {step.reads.length > 0 ? (
              step.reads.map((r) => (
                <span key={r} className="px-1.5 py-0.2 rounded bg-bg-elevated text-zinc-300 text-[10px] border border-border-subtle">
                  {r}
                </span>
              ))
            ) : (
              <span className="text-zinc-600 text-[10px]">none</span>
            )}
          </div>
        </div>

        <div className="p-2.5 rounded-md bg-bg-surface border border-border-subtle space-y-1">
          <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase font-semibold">
            <ArrowUpRight className="w-3 h-3 text-emerald-400" />
            <span>Writes Variables</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {step.writes.length > 0 ? (
              step.writes.map((w) => (
                <span key={w} className="px-1.5 py-0.2 rounded bg-bg-elevated text-zinc-300 text-[10px] border border-border-subtle">
                  {w}
                </span>
              ))
            ) : (
              <span className="text-zinc-600 text-[10px]">none</span>
            )}
          </div>
        </div>
      </div>

      {/* Raw Prompt (for LLM steps) */}
      {step.raw_prompt && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Raw Prompt
            </label>
            <button
              onClick={handleCopyPrompt}
              className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
            >
              {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedPrompt ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="p-2.5 rounded-md bg-bg-deep border border-border-subtle text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {step.raw_prompt}
          </div>
        </div>
      )}

      {/* JSON Payloads */}
      <div className="space-y-2.5">
        <JsonViewer title="Input Data Payload" data={step.input_data} defaultOpen={true} />
        <JsonViewer title="Output Data Payload" data={step.output_data} defaultOpen={true} />
        <JsonViewer title="State Delta / Mutations" data={step.state_delta} defaultOpen={true} />
      </div>
    </div>
  );
};
