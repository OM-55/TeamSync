import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Award, Calendar, MapPin, Users, PlusCircle, ArrowLeft, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import OpportunityRuleBadge from '../components/OpportunityRuleBadge';

export default function OpportunityDetailPage() {
  const { idOrSlug } = useParams();
  const [opp, setOpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDetails();
  }, [idOrSlug]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const data = await api.getOpportunityDetails(idOrSlug);
      setOpp(data);
    } catch (err) {
      console.error('Fetch opportunity detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-slate-400 text-sm">Loading opportunity details...</div>;
  }

  if (!opp) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-100">Opportunity not found</h2>
        <Link to="/opportunities" className="btn-secondary text-xs">Back to Opportunities</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back link */}
      <Link to="/opportunities" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Opportunities
      </Link>

      {/* Header Banner */}
      <div className="card-base bg-slate-900 border-slate-800 p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="badge-amber text-xs">{opp.type}</span>
            <span className="badge-slate text-xs">{opp.status}</span>
            <span className="badge-blue text-xs">Mode: {opp.participation_mode}</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/discover?tab=teams&purpose=Hackathon`}
              className="btn-secondary text-xs"
            >
              <Users className="w-4 h-4" />
              Find a Team
            </Link>
            <Link
              to={`/teams/create?opportunityId=${opp.id}`}
              className="btn-primary text-xs"
            >
              <PlusCircle className="w-4 h-4" />
              Create a Team
            </Link>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-slate-100">{opp.title}</h1>
          <p className="text-sm font-medium text-slate-400 mt-1">Organized by {opp.organizer}</p>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">{opp.description}</p>

        <div className="flex flex-wrap gap-6 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-500" />
            <span>Location: <strong>{opp.location}</strong></span>
          </div>
          {opp.start_date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Dates: <strong>{opp.start_date} to {opp.end_date || 'TBD'}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Opportunity Rules Configuration Summary Box */}
      <div className="card-base bg-slate-900/90 border-blue-900/40 p-6">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-blue-400" />
          Opportunity Team Rules & Eligibility Requirements
        </h2>

        {!opp.rules ? (
          <p className="text-xs text-slate-400">No specific team size or composition rules configured for this opportunity.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <span className="font-semibold text-slate-300 block mb-1">Team Size Requirements</span>
              {opp.rules.exact_team_size ? (
                <p className="text-blue-400 font-bold text-sm">
                  Exact Team Size: {opp.rules.exact_team_size} members
                </p>
              ) : (
                <p className="text-slate-200">
                  Minimum {opp.rules.min_team_size} member(s), Maximum {opp.rules.max_team_size} member(s).
                </p>
              )}
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <span className="font-semibold text-slate-300 block mb-1">Academic / Composition Rules</span>
              {(!opp.rules.composition_rules || opp.rules.composition_rules.length === 0) ? (
                <p className="text-slate-400">No student year or branch restrictions.</p>
              ) : (
                <ul className="space-y-1 text-slate-200">
                  {opp.rules.composition_rules.map((rule, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 text-amber-300">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{rule.attribute === 'year_of_study' ? 'Year' : rule.attribute}: Requires {rule.operator} {rule.count} student(s) from {rule.value}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Participating Teams */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" />
          Participating Teams ({opp.participatingTeams?.length || 0})
        </h2>

        {(!opp.participatingTeams || opp.participatingTeams.length === 0) ? (
          <div className="card-base text-center py-8 text-xs text-slate-400">
            No teams formed for this opportunity yet. Be the first to create one!
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {opp.participatingTeams.map((team) => (
              <div key={team.id} className="card-base flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <span className="badge-blue text-[10px]">{team.status}</span>
                    <OpportunityRuleBadge ruleEvaluation={team.ruleEvaluation} />
                  </div>

                  <Link to={`/teams/${team.id}`} className="font-bold text-slate-100 hover:text-blue-400 text-base block">
                    {team.name}
                  </Link>
                  <p className="text-xs text-slate-300 mt-1">Project: {team.project_name}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Leader: {team.leader_name} ({team.leader_college})</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{team.member_count} Members</span>
                  <Link to={`/teams/${team.id}`} className="btn-outline text-xs py-1">
                    View Team
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
