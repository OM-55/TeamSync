import React from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function OpportunityRuleBadge({ ruleEvaluation }) {
  if (!ruleEvaluation) return null;

  const { isCompliant, errors, summary } = ruleEvaluation;

  if (summary && summary.includes('Personal Project')) {
    return (
      <span className="badge-slate text-xs">
        <Info className="w-3 h-3 text-slate-400" />
        Personal Project
      </span>
    );
  }

  if (isCompliant) {
    return (
      <div className="badge-green text-xs">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Rule Compliant</span>
      </div>
    );
  }

  return (
    <div className="badge-amber text-xs" title={errors?.join('\n')}>
      <AlertTriangle className="w-3.5 h-3.5" />
      <span>{errors && errors.length > 0 ? errors[0] : 'Ineligible Team'}</span>
    </div>
  );
}
