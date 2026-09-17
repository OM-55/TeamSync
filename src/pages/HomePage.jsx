import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { PlusCircle, Compass, Award, Users, ArrowRight, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import OpportunityRuleBadge from '../components/OpportunityRuleBadge';

export default function HomePage() {
  const { user, profile } = useAuth();
  const [myTeams, setMyTeams] = useState([]);
  const [recruitingTeams, setRecruitingTeams] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [myTeamsRes, recTeamsRes, oppsRes] = await Promise.all([
        api.getMyTeams(),
        api.getTeams({ recruiting: 'true' }),
        api.getOpportunities({ status: 'Published' })
      ]);
      setMyTeams(myTeamsRes || []);
      setRecruitingTeams(recTeamsRes?.slice(0, 4) || []);
      setOpportunities(oppsRes?.slice(0, 3) || []);
    } catch (err) {
      console.error('Error loading home data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Action-Oriented Header */}
      <div className="card-base bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 border-blue-900/40 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 text-blue-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready to build something?</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
            Welcome back, {profile?.full_name || 'Builder'}!
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            {profile?.college} • {profile?.year_of_study} • {profile?.branch}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/teams/create" className="btn-primary py-2.5">
            <PlusCircle className="w-4 h-4" />
            Create Team
          </Link>
          <Link to="/discover" className="btn-secondary py-2.5">
            <Compass className="w-4 h-4" />
            Discover Teams
          </Link>
          <Link to="/opportunities" className="btn-outline py-2.5">
            <Award className="w-4 h-4 text-amber-400" />
            Opportunities
          </Link>
        </div>
      </div>

      {/* Grid: My Active Teams & Open Recruitments */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 cols): My Teams & Open Opportunities */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section: My Teams */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                My Teams
              </h2>
              <Link to="/my-teams" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {myTeams.length === 0 ? (
              <div className="card-base text-center py-8">
                <p className="text-sm text-slate-300 font-medium">You haven't joined a team yet.</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">Create your own team or discover open recruiting teams.</p>
                <div className="flex justify-center gap-3">
                  <Link to="/teams/create" className="btn-primary text-xs">Create Team</Link>
                  <Link to="/discover?tab=teams" className="btn-secondary text-xs">Discover Teams</Link>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {myTeams.map((t) => (
                  <Link key={t.id} to={`/teams/${t.id}`} className="card-base hover:border-blue-500/50 block group">
                    <div className="flex items-start justify-between mb-2">
                      <span className="badge-blue text-[11px]">{t.purpose}</span>
                      <OpportunityRuleBadge ruleEvaluation={t.ruleEvaluation} />
                    </div>
                    <h3 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{t.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{t.project_name}</p>
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>Role: <strong className="text-slate-200">{t.my_role}</strong></span>
                      <span className="text-[11px] font-medium text-slate-300">{t.member_count} Members</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Section: Active Opportunities */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Featured Opportunities
              </h2>
              <Link to="/opportunities" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                Explore all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {opportunities.map((opp) => (
                <Link key={opp.id} to={`/opportunities/${opp.id}`} className="card-base flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge-amber text-[10px]">{opp.type}</span>
                      <span className="text-xs text-slate-400 font-medium">{opp.organizer}</span>
                    </div>
                    <h3 className="font-bold text-slate-100 text-base">{opp.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{opp.short_description}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="badge-slate text-xs">{opp.location}</span>
                    <span className="btn-outline text-xs py-1">View Details</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (1 col): Open Recruiting Teams */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100">Open Teams</h2>
            <Link to="/discover?tab=teams" className="text-xs text-blue-400 hover:underline">See all</Link>
          </div>

          {recruitingTeams.length === 0 ? (
            <div className="card-base text-center py-6 text-xs text-slate-400">
              No open teams recruiting right now.
            </div>
          ) : (
            <div className="space-y-3">
              {recruitingTeams.map((team) => (
                <div key={team.id} className="card-base p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="badge-green text-[10px]">Recruiting</span>
                    <span className="text-[11px] text-slate-400 font-medium">{team.purpose}</span>
                  </div>
                  <Link to={`/teams/${team.id}`} className="font-semibold text-slate-100 hover:text-blue-400 text-sm block">
                    {team.name}
                  </Link>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">Building: {team.project_name}</p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {team.required_skills?.slice(0, 3).map((sk) => (
                      <span key={sk} className="badge-slate text-[10px]">{sk}</span>
                    ))}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">{team.member_count} Members</span>
                    <Link to={`/teams/${team.id}`} className="text-xs text-blue-400 font-medium hover:underline">
                      View Team →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
