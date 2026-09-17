import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Shield, PlusCircle, Users, Award, AlertTriangle, CheckCircle2, BarChart2, Settings, ArrowRight } from 'lucide-react';
import OpportunityRuleBadge from '../components/OpportunityRuleBadge';

export default function AdminDashboard() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'create_opportunity', 'students', 'teams'
  const [dashboardStats, setDashboardStats] = useState(null);
  const [studentsList, setStudentsList] = useState([]);
  const [teamsList, setTeamsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Opportunity Creation Form State
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('Hackathon');
  const [status, setStatus] = useState('Published');
  const [location, setLocation] = useState('Virtual');
  const [startDate, setStartDate] = useState('2026-10-10');
  const [endDate, setEndDate] = useState('2026-10-12');
  const [participationMode, setParticipationMode] = useState('Team');

  // Dynamic Rule Builder State
  const [minTeamSize, setMinTeamSize] = useState(2);
  const [maxTeamSize, setMaxTeamSize] = useState(5);
  const [exactTeamSize, setExactTeamSize] = useState('');

  // Composition Rules array: [{ attribute: 'year_of_study', operator: 'exact', value: '2nd Year', count: 2 }]
  const [compRules, setCompRules] = useState([]);
  const [newAttr, setNewAttr] = useState('year_of_study');
  const [newOp, setNewOp] = useState('exact');
  const [newValue, setNewValue] = useState('2nd Year');
  const [newCount, setNewCount] = useState(2);

  const [submittingOpp, setSubmittingOpp] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadAdminData();
    }
  }, [user, activeTab]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const statsData = await api.getAdminDashboard();
        setDashboardStats(statsData.stats);
      } else if (activeTab === 'students') {
        const stData = await api.getAdminStudents();
        setStudentsList(stData);
      } else if (activeTab === 'teams') {
        const tmData = await api.getAdminTeams();
        setTeamsList(tmData);
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addCompRule = () => {
    setCompRules([
      ...compRules,
      { attribute: newAttr, operator: newOp, value: newValue, count: parseInt(newCount) }
    ]);
  };

  const removeCompRule = (index) => {
    setCompRules(compRules.filter((_, i) => i !== index));
  };

  const handleCreateOpportunity = async (e) => {
    e.preventDefault();
    setError('');
    setFeedback('');

    if (!title || !organizer || !shortDesc || !desc) {
      setError('Title, Organizer, Short Description, and Full Description are required');
      return;
    }

    setSubmittingOpp(true);
    try {
      await api.createOpportunity({
        title,
        organizer,
        short_description: shortDesc,
        description: desc,
        type,
        status,
        location,
        start_date: startDate,
        end_date: endDate,
        participation_mode: participationMode,
        min_team_size: minTeamSize,
        max_team_size: maxTeamSize,
        exact_team_size: exactTeamSize ? parseInt(exactTeamSize) : null,
        composition_rules: compRules
      });

      setFeedback('Opportunity and Dynamic Rules saved successfully!');
      setTitle('');
      setOrganizer('');
      setShortDesc('');
      setDesc('');
      setCompRules([]);
      setTimeout(() => setFeedback(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to create opportunity');
    } finally {
      setSubmittingOpp(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-100">Access Denied</h2>
        <p className="text-xs text-slate-400">You must be logged in as an Administrator to view this dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">TeamSync Admin Panel</h1>
            <p className="text-xs text-slate-400">Manage opportunities, configure dynamic team rules, and monitor platform activity.</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Dashboard Stats' },
            { id: 'create_opportunity', label: '+ Create Opportunity' },
            { id: 'students', label: 'Students Inspector' },
            { id: 'teams', label: 'Teams Inspector' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-sm rounded-lg p-3 text-center flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {feedback}
        </div>
      )}

      {/* 1. OVERVIEW STATS TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-amber-400" />
            Live Operational Metrics (Real Database Data)
          </h2>

          {loading ? (
            <div className="text-center py-8 text-slate-400 text-xs">Loading operational metrics...</div>
          ) : dashboardStats ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card-base">
                <span className="text-xs font-semibold text-slate-400 uppercase">Total Students</span>
                <p className="text-3xl font-bold text-slate-100 mt-2">{dashboardStats.totalStudents}</p>
                <p className="text-[11px] text-slate-500 mt-1">Verified student accounts</p>
              </div>

              <div className="card-base">
                <span className="text-xs font-semibold text-slate-400 uppercase">Active Teams</span>
                <p className="text-3xl font-bold text-slate-100 mt-2">{dashboardStats.totalTeams}</p>
                <p className="text-[11px] text-emerald-400 mt-1">{dashboardStats.recruitingTeams} teams currently recruiting</p>
              </div>

              <div className="card-base">
                <span className="text-xs font-semibold text-slate-400 uppercase">Total Opportunities</span>
                <p className="text-3xl font-bold text-slate-100 mt-2">{dashboardStats.totalOpportunities}</p>
                <p className="text-[11px] text-blue-400 mt-1">{dashboardStats.openOpportunities} open for participation</p>
              </div>

              <div className="card-base">
                <span className="text-xs font-semibold text-slate-400 uppercase">Rule Violations</span>
                <p className="text-3xl font-bold text-rose-400 mt-2">{dashboardStats.nonCompliantTeamsCount}</p>
                <p className="text-[11px] text-slate-400 mt-1">Teams needing composition updates</p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* 2. CREATE OPPORTUNITY & CONFIGURABLE RULE BUILDER TAB */}
      {activeTab === 'create_opportunity' && (
        <div className="card-base bg-slate-900 border-slate-800 p-6 sm:p-8 space-y-6 max-w-4xl mx-auto">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-amber-400" />
              Create Opportunity & Configure Dynamic Team Rules
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure event details and rule constraints (Min/Max/Exact team size & year/branch composition rules). Backend automatically evaluates all participating teams against these settings.
            </p>
          </div>

          {error && (
            <div className="bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-lg p-3">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateOpportunity} className="space-y-6 text-xs">
            
            {/* Event Basic Info */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-200 uppercase text-[11px] tracking-wider border-b border-slate-800 pb-1">1. Event Information</h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Opportunity Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input-field"
                    placeholder="e.g. AI Builder Sprint 2026"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Organizer / Institution *</label>
                  <input
                    type="text"
                    required
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Stanford E-Cell / MIT Innovation"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="input-field bg-slate-900">
                    <option value="Hackathon">Hackathon</option>
                    <option value="Competition">Competition</option>
                    <option value="Challenge">Challenge</option>
                    <option value="Special Event">Special Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Participation Mode</label>
                  <select value={participationMode} onChange={(e) => setParticipationMode(e.target.value)} className="input-field bg-slate-900">
                    <option value="Team">Team Required</option>
                    <option value="Individual">Individual Allowed</option>
                    <option value="Optional">Optional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Virtual, Hybrid"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Short Summary *</label>
                <input
                  type="text"
                  required
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  className="input-field"
                  placeholder="One sentence summary of event..."
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Description *</label>
                <textarea
                  rows={3}
                  required
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="input-field"
                  placeholder="Detailed guidelines..."
                />
              </div>
            </div>

            {/* DYNAMIC RULE CONFIGURATOR */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="font-bold text-amber-400 uppercase text-[11px] tracking-wider border-b border-slate-800 pb-1 flex items-center gap-1.5">
                <Settings className="w-4 h-4" />
                2. Dynamic Opportunity Rule Engine Configuration
              </h3>

              {/* Size Rules */}
              <div className="grid sm:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Exact Team Size (Optional)</label>
                  <input
                    type="number"
                    value={exactTeamSize}
                    onChange={(e) => setExactTeamSize(e.target.value)}
                    className="input-field"
                    placeholder="e.g. 4 (leave blank if flexible)"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Minimum Team Size</label>
                  <input
                    type="number"
                    value={minTeamSize}
                    onChange={(e) => setMinTeamSize(parseInt(e.target.value))}
                    className="input-field"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Maximum Team Size</label>
                  <input
                    type="number"
                    value={maxTeamSize}
                    onChange={(e) => setMaxTeamSize(parseInt(e.target.value))}
                    className="input-field"
                    min={1}
                  />
                </div>
              </div>

              {/* Composition Rules Builder */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                <span className="font-semibold text-slate-200 block text-xs">Add Dynamic Student Composition Rules</span>
                <p className="text-[11px] text-slate-400">
                  Configure specific constraints like "Exactly 2 students from 2nd Year" or "At least 1 from 3rd Year".
                </p>

                <div className="flex flex-wrap gap-2 items-center">
                  <select value={newAttr} onChange={(e) => setNewAttr(e.target.value)} className="input-field w-auto bg-slate-900">
                    <option value="year_of_study">Year of Study</option>
                    <option value="college">College</option>
                    <option value="branch">Branch</option>
                  </select>

                  <select value={newOp} onChange={(e) => setNewOp(e.target.value)} className="input-field w-auto bg-slate-900">
                    <option value="exact">Must be exactly</option>
                    <option value="min">Must be at least</option>
                    <option value="max">Must be at most</option>
                  </select>

                  <input
                    type="number"
                    value={newCount}
                    onChange={(e) => setNewCount(e.target.value)}
                    className="input-field w-20"
                    min={1}
                  />

                  <select value={newValue} onChange={(e) => setNewValue(e.target.value)} className="input-field w-auto bg-slate-900">
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>

                  <button type="button" onClick={addCompRule} className="btn-secondary text-xs py-2 px-3">
                    + Add Rule
                  </button>
                </div>

                {/* Configured composition rules preview */}
                {compRules.length > 0 && (
                  <div className="pt-2 space-y-1">
                    <p className="text-[11px] text-slate-400 font-semibold">Active Composition Rules for this Opportunity:</p>
                    {compRules.map((r, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-xs text-amber-300">
                        <span>Rule #{idx + 1}: Requires {r.operator} {r.count} student(s) from {r.value} ({r.attribute})</span>
                        <button type="button" onClick={() => removeCompRule(idx)} className="text-rose-400 hover:underline text-[10px]">
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <div className="pt-4">
              <button type="submit" disabled={submittingOpp} className="btn-primary w-full py-3 text-sm">
                {submittingOpp ? 'Publishing Opportunity...' : 'Publish Opportunity & Enable Rule Engine'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* 3. STUDENTS INSPECTOR TAB */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-100">Registered Student Directory</h2>
          
          <div className="overflow-x-auto card-base p-0">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">User ID</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">College</th>
                  <th className="p-3">Year</th>
                  <th className="p-3">Branch</th>
                  <th className="p-3">Teams Count</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {studentsList.map((st) => (
                  <tr key={st.user_id} className="hover:bg-slate-800/40">
                    <td className="p-3 text-slate-500 font-mono">#{st.user_id}</td>
                    <td className="p-3 font-semibold text-slate-100">{st.full_name || 'N/A'}</td>
                    <td className="p-3">{st.college}</td>
                    <td className="p-3">{st.year_of_study}</td>
                    <td className="p-3">{st.branch}</td>
                    <td className="p-3 font-bold text-blue-400">{st.teamsCount}</td>
                    <td className="p-3">
                      {st.is_open_to_teams === 1 ? (
                        <span className="badge-green text-[10px]">Open to Teams</span>
                      ) : (
                        <span className="badge-slate text-[10px]">Inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TEAMS INSPECTOR TAB */}
      {activeTab === 'teams' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-100">Teams Rule Inspector</h2>

          <div className="overflow-x-auto card-base p-0">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Team Name</th>
                  <th className="p-3">Purpose</th>
                  <th className="p-3">Opportunity</th>
                  <th className="p-3">Leader</th>
                  <th className="p-3">Members</th>
                  <th className="p-3">Rule Engine Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {teamsList.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-slate-100">{t.name}</td>
                    <td className="p-3"><span className="badge-blue text-[10px]">{t.purpose}</span></td>
                    <td className="p-3 text-amber-400">{t.opportunity_title || 'Personal Project'}</td>
                    <td className="p-3">{t.leader_name} ({t.leader_college})</td>
                    <td className="p-3 font-bold text-slate-200">{t.member_count}</td>
                    <td className="p-3">
                      <OpportunityRuleBadge ruleEvaluation={t.ruleEvaluation} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
