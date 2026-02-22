
"use client";

import { CheckCircle2, Loader2, Search, FileText, ShieldAlert, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AgentStep = 'idle' | 'processing' | 'completed';

interface WorkflowStatusProps {
  steps: {
    extraction: AgentStep;
    comparison: AgentStep;
    fraud: AgentStep;
    scoring: AgentStep;
  }
}

export function WorkflowStatus({ steps }: WorkflowStatusProps) {
  const items = [
    { id: 'extraction', label: 'Agent 1: Extraction', icon: FileText, color: 'text-blue-500' },
    { id: 'comparison', label: 'Agent 2: Data Comparison', icon: Search, color: 'text-indigo-500' },
    { id: 'fraud', label: 'Agent 3: Fraud Detection', icon: ShieldAlert, color: 'text-amber-500' },
    { id: 'scoring', label: 'Agent 4: Trust Score Gen', icon: BadgeCheck, color: 'text-green-500' },
  ];

  return (
    <div className="space-y-4 p-4 bg-slate-50 rounded-xl border">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        Agentic Workflow Activity
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {items.map((item) => {
          const status = steps[item.id as keyof typeof steps];
          const Icon = item.icon;
          
          return (
            <div 
              key={item.id} 
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                status === 'completed' ? "bg-white border-green-200" : 
                status === 'processing' ? "bg-white border-primary/30 shadow-md scale-105" : 
                "bg-slate-100 opacity-50 border-transparent"
              )}
            >
              <div className={cn("p-2 rounded-md", status === 'completed' ? "bg-green-100" : "bg-slate-200")}>
                <Icon className={cn("w-5 h-5", status === 'completed' ? "text-green-600" : item.color)} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold leading-none mb-1">{item.label}</p>
                <div className="flex items-center gap-1">
                  {status === 'processing' && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                  <span className={cn("text-[10px] uppercase font-semibold", status === 'completed' ? "text-green-600" : "text-slate-400")}>
                    {status}
                  </span>
                </div>
              </div>
              {status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
