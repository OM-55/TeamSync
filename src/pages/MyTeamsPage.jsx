import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Users, PlusCircle, ArrowRight } from 'lucide-react';
import OpportunityRuleBadge from '../components/OpportunityRuleBadge';

export default function MyTeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyTeams();
  }, []);

  const fetchMyTeams = async () => {
    setLoading(true);
    try {
      const data = await api.getMyTeams();
      setTeams(data || []);
    } catch (err) {
      console.error('Fetch my teams error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            My Teams
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Teams you currently belong to or lead.
          </p>
        </div>

        <Link to="/teams/create" className="btn-primary text-xs">
          <PlusCircle className="w-4 h-4" />
          Create Team
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading your teams...</div>
      ) : teams.length === 0 ? (
        <div className="card-base text-center py-12 space-y-3">
          <p className="text-sm text-slate-300 font-medium">You haven't joined any teams yet.</p>
          <div className="flex justify-center gap-3 pt-2">
            <Link to="/teams/create" className="btn-primary text-xs">Create Team</Link>
            <Link to="/discover?tab=teams" className="btn-secondary text-xs">Discover Teams</Link>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((t) => (
            <div key={t.id} className="card-base flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="badge-blue text-[10px]">{t.purpose}</span>
                    {t.isLeader && <span className="badge-amber text-[9px]">LEADER</span>}
                  </div>
                  <OpportunityRuleBadge ruleEvaluation={t.ruleEvaluation} />
                </div>

                <Link to={`/teams/${t.id}`} className="font-bold text-slate-100 hover:text-blue-400 text-base block">
                  {t.name}
                </Link>

                <p className="text-xs font-semibold text-slate-300 mt-1">Project: {t.project_name}</p>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.project_description}</p>

                {t.opportunity_title && (
                  <p className="text-[11px] text-amber-400 font-medium mt-2">
                    Event: {t.opportunity_title}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">My Role: <strong className="text-slate-200">{t.my_role}</strong></span>
                <Link to={`/teams/${t.id}`} className="btn-primary text-xs py-1">
                  Open Hub
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
