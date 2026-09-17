import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Award, Calendar, MapPin, Users, ArrowRight } from 'lucide-react';

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [statusTab, setStatusTab] = useState('All'); // 'All', 'Published', 'Ongoing', 'Upcoming', 'Past'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOpps();
  }, [statusTab]);

  const fetchOpps = async () => {
    setLoading(true);
    try {
      const params = statusTab !== 'All' ? { status: statusTab } : {};
      const data = await api.getOpportunities(params);
      setOpportunities(data);
    } catch (err) {
      console.error('Fetch opportunities error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <Award className="w-8 h-8 text-amber-400" />
            Opportunities
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Discover hackathons, innovation challenges, and student building events.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {['All', 'Ongoing', 'Upcoming', 'Past'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusTab(st)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusTab === st
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading opportunities...</div>
      ) : opportunities.length === 0 ? (
        <div className="card-base text-center py-12">
          <p className="text-slate-300 text-sm">No opportunities match this filter.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opp) => (
            <div key={opp.id} className="card-base flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="badge-amber text-[10px]">{opp.type}</span>
                  <span className="badge-slate text-[10px]">{opp.status}</span>
                </div>

                <Link to={`/opportunities/${opp.id}`} className="font-bold text-slate-100 text-lg hover:text-blue-400 transition-colors block">
                  {opp.title}
                </Link>

                <p className="text-xs font-medium text-slate-400 mt-1">Organized by {opp.organizer}</p>
                <p className="text-xs text-slate-300 mt-3 line-clamp-3 leading-relaxed">{opp.short_description}</p>

                {/* Requirements Summary */}
                {opp.rules && (
                  <div className="mt-4 p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-300">Team Rules:</p>
                    {opp.rules.exact_team_size ? (
                      <p>Exact Team Size: <strong className="text-blue-400">{opp.rules.exact_team_size} members</strong></p>
                    ) : (
                      <p>Team Size: <strong className="text-slate-200">{opp.rules.min_team_size} to {opp.rules.max_team_size} members</strong></p>
                    )}
                    {opp.rules.composition_rules?.length > 0 && (
                      <p className="text-amber-400 truncate">
                        Specific Composition Rules Configured
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{opp.location}</span>
                </div>

                <Link to={`/opportunities/${opp.id}`} className="btn-primary text-xs py-1.5">
                  View Opportunity
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
