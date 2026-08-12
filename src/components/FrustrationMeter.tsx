import React from 'react';
import { FrustrationAssessment, FrustrationLevel } from '../types';
import { Smile, Meh, Frown, Flame, AlertCircle } from 'lucide-react';

interface FrustrationMeterProps {
  assessment?: FrustrationAssessment | null;
  level?: FrustrationLevel | string | null;
  score?: number | null;
  repeatCount?: number;
}

export const FrustrationMeter: React.FC<FrustrationMeterProps> = ({
  assessment,
  level: rawLevel,
  score: rawScore,
  repeatCount,
}) => {
  const level = assessment?.level || rawLevel || 'low';
  const score = assessment?.score ?? rawScore ?? (level === 'critical' ? 90 : level === 'high' ? 75 : level === 'moderate' ? 45 : 15);
  const warning = assessment?.friction_warning;
  const count = assessment?.repeat_explanations_count || repeatCount || 0;

  const getLevelConfig = () => {
    switch (level) {
      case 'critical':
        return {
          title: 'Critical Frustration',
          badgeBg: 'bg-rose-500/20 border-rose-500/50 text-rose-300',
          barGradient: 'from-amber-500 via-rose-500 to-red-600',
          icon: <Flame className="w-5 h-5 text-rose-400 animate-pulse" />,
          textColor: 'text-rose-400',
        };
      case 'high':
        return {
          title: 'High Frustration',
          badgeBg: 'bg-amber-500/20 border-amber-500/50 text-amber-300',
          barGradient: 'from-yellow-500 to-amber-600',
          icon: <Frown className="w-5 h-5 text-amber-400" />,
          textColor: 'text-amber-400',
        };
      case 'moderate':
        return {
          title: 'Moderate Frustration',
          badgeBg: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
          barGradient: 'from-blue-500 to-yellow-500',
          icon: <Meh className="w-5 h-5 text-yellow-400" />,
          textColor: 'text-yellow-400',
        };
      default:
        return {
          title: 'Low / Satisfied',
          badgeBg: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300',
          barGradient: 'from-teal-500 to-emerald-500',
          icon: <Smile className="w-5 h-5 text-emerald-400" />,
          textColor: 'text-emerald-400',
        };
    }
  };

  const config = getLevelConfig();

  return (
    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {config.icon}
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Customer Frustration Index
          </h4>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${config.badgeBg}`}>
          {score}% • {config.title}
        </span>
      </div>

      {/* Visual Meter Bar */}
      <div className="space-y-1">
        <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${config.barGradient}`}
            style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>Low Friction</span>
          <span>Moderate</span>
          <span className="text-amber-400">High Risk</span>
          <span className="text-rose-400">Churn Threat</span>
        </div>
      </div>

      {/* Friction / Warning Details */}
      {(warning || count > 0 || assessment?.reasoning) && (
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-1.5">
          {count > 0 && (
            <div className="text-amber-300 font-bold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              Customer explained this issue {count} time{count > 1 ? 's' : ''} previously
            </div>
          )}
          {warning && <div className="text-slate-300">{warning}</div>}
          {assessment?.reasoning && (
            <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-900">
              <strong className="text-slate-300">AI Assessment:</strong> {assessment.reasoning}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
