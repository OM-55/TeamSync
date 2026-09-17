import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Search, Users, Rocket, Award, FolderGit2, UserPlus, Send, Filter, CheckCircle2, X } from 'lucide-react';
import OpportunityRuleBadge from '../components/OpportunityRuleBadge';

export default function DiscoverPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get('tab') || 'all';
  const initialQuery = searchParams.get('q') || '';

  const [tab, setTab] = useState(initialTab);
  const [query, setQuery] = useState(initialQuery);

  // Filters
  const [collegeFilter, setCollegeFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [openToTeams, setOpenToTeams] = useState(false);

  const [results, setResults] = useState({ people: [], teams: [], projects: [], opportunities: [] });
  const [loading, setLoading] = useState(true);

  // Modal States
  const [joinModalTeam, setJoinModalTeam] = useState(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  const [inviteModalStudent, setInviteModalStudent] = useState(null);
  const [myLeaderTeams, setMyLeaderTeams] = useState([]);
  const [selectedInviteTeam, setSelectedInviteTeam] = useState('');
  const [inviteRoleTitle, setInviteRoleTitle] = useState('Frontend Developer');
  const [sendingInvite, setSendingInvite] = useState(false);

  const [actionFeedback, setActionFeedback] = useState('');

  useEffect(() => {
    fetchResults();
  }, [tab, collegeFilter, yearFilter, branchFilter, skillFilter, openToTeams]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = {
        query: query.trim(),
        type: tab,
        college: collegeFilter,
        year: yearFilter,
        branch: branchFilter,
        skill: skillFilter,
        openToTeams: openToTeams ? 'true' : 'false'
      };
      const data = await api.discover(params);
      setResults(data);
    } catch (err) {
      console.error('Discover error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchResults();
  };

  const openJoinModal = (team) => {
    setJoinModalTeam(team);
    setJoinMessage('');
  };

  const handleSendJoinRequest = async () => {
    if (!joinModalTeam) return;
    setSendingRequest(true);
    try {
      await api.requestToJoinTeam(joinModalTeam.id, { message: joinMessage });
      setActionFeedback(`Join request sent to ${joinModalTeam.name}!`);
      setJoinModalTeam(null);
      setTimeout(() => setActionFeedback(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to send join request');
    } finally {
      setSendingRequest(false);
    }
  };

  const openInviteModal = async (student) => {
    setInviteModalStudent(student);
    try {
      const myTeamsRes = await api.getMyTeams();
      const leaderTeams = myTeamsRes.filter(t => t.isLeader);
      setMyLeaderTeams(leaderTeams);
      if (leaderTeams.length > 0) {
        setSelectedInviteTeam(leaderTeams[0].id);
      }
    } catch (err) {}
  };

  const handleSendInvite = async () => {
    if (!inviteModalStudent || !selectedInviteTeam) return;
    setSendingInvite(true);
    try {
      await api.inviteStudent(selectedInviteTeam, {
        student_id: inviteModalStudent.user_id,
        role_title: inviteRoleTitle
      });
      setActionFeedback(`Invitation sent to ${inviteModalStudent.full_name}!`);
      setInviteModalStudent(null);
      setTimeout(() => setActionFeedback(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to send invitation');
    } finally {
      setSendingInvite(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Search Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-slate-100">Looking for something?</h1>
        <p className="text-sm text-slate-400">
          Discover students with backend/frontend/AI skills, open recruiting teams, active opportunities, or past builds.
        </p>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-xl mx-auto">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by keyword, skill, project name, or college..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field pl-11 py-2.5 bg-slate-900 text-base"
            />
          </div>
          <button type="submit" className="btn-primary py-2.5 px-5">
            Search
          </button>
        </form>
      </div>

      {actionFeedback && (
        <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-sm rounded-lg p-3 text-center flex items-center justify-center gap-2 max-w-xl mx-auto">
          <CheckCircle2 className="w-4 h-4" />
          {actionFeedback}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'all', label: 'All Results' },
            { id: 'people', label: 'People' },
            { id: 'teams', label: 'Teams' },
            { id: 'projects', label: 'Projects' },
            { id: 'opportunities', label: 'Opportunities' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSearchParams({ tab: t.id, q: query }); }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filter Drawer Toggle */}
        <div className="flex items-center gap-2">
          {tab === 'people' && (
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={openToTeams}
                onChange={(e) => setOpenToTeams(e.target.checked)}
                className="rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-500"
              />
              Open to Teams Only
            </label>
          )}
        </div>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Searching stored database...</div>
      ) : (
        <div className="space-y-10">
          
          {/* 1. PEOPLE SECTION */}
          {(tab === 'all' || tab === 'people') && (
            <div>
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Students ({results.people.length})
              </h2>

              {results.people.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No matching students found.</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.people.map((st) => (
                    <div key={st.user_id} className="card-base flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-blue-400 text-base">
                            {st.full_name ? st.full_name.charAt(0) : 'S'}
                          </div>
                          {st.is_open_to_teams === 1 && (
                            <span className="badge-green text-[10px]">Open to Teams</span>
                          )}
                        </div>

                        <Link to={`/profile/${st.user_id}`} className="font-bold text-slate-100 hover:text-blue-400 text-base block">
                          {st.full_name}
                        </Link>
                        <p className="text-xs text-slate-400 mt-0.5">{st.college}</p>
                        <p className="text-[11px] text-slate-500">{st.year_of_study} • {st.branch}</p>

                        <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                          {st.bio || 'Student builder on TeamSync.'}
                        </p>

                        {st.skills && st.skills.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {st.skills.slice(0, 4).map((sk) => (
                              <span key={sk} className="badge-slate text-[10px]">{sk}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <Link to={`/profile/${st.user_id}`} className="btn-outline text-xs py-1 flex-1 text-center">
                          View Profile
                        </Link>
                        {user && (
                          <button
                            onClick={() => openInviteModal(st)}
                            className="btn-primary text-xs py-1 px-3"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Invite
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. TEAMS SECTION */}
          {(tab === 'all' || tab === 'teams') && (
            <div>
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-emerald-400" />
                Teams ({results.teams.length})
              </h2>

              {results.teams.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No matching teams found.</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.teams.map((t) => (
                    <div key={t.id} className="card-base flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <span className="badge-blue text-[10px]">{t.purpose}</span>
                          <OpportunityRuleBadge ruleEvaluation={t.ruleEvaluation} />
                        </div>

                        <Link to={`/teams/${t.id}`} className="font-bold text-slate-100 hover:text-blue-400 text-base block">
                          {t.name}
                        </Link>
                        <p className="text-xs text-slate-300 font-medium mt-1">Project: {t.project_name}</p>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.project_description}</p>

                        <div className="mt-3 space-y-1">
                          {t.opportunity_title && (
                            <p className="text-[11px] text-amber-400 font-medium truncate">
                              Event: {t.opportunity_title}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-400">
                            Leader: {t.leader_name} ({t.leader_college})
                          </p>
                        </div>

                        {t.required_skills && t.required_skills.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {t.required_skills.map((sk) => (
                              <span key={sk} className="badge-slate text-[10px]">{sk}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-400">{t.member_count} Members</span>
                        <div className="flex gap-2">
                          <Link to={`/teams/${t.id}`} className="btn-outline text-xs py-1">
                            View
                          </Link>
                          {user && t.leader_id !== user.id && (
                            <button
                              onClick={() => openJoinModal(t)}
                              className="btn-primary text-xs py-1"
                            >
                              Request to Join
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. PROJECTS SECTION */}
          {(tab === 'all' || tab === 'projects') && (
            <div>
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-purple-400" />
                Projects ({results.projects.length})
              </h2>

              {results.projects.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No matching projects found.</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.projects.map((pr) => (
                    <div key={pr.id} className="card-base flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="badge-green text-[10px]">{pr.status}</span>
                          {pr.is_showcase === 1 && (
                            <span className="badge-amber text-[10px]">Showcase</span>
                          )}
                        </div>

                        <h3 className="font-bold text-slate-100 text-base">{pr.title}</h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-3">{pr.description}</p>
                        <p className="text-[11px] text-slate-500 mt-2">Built by {pr.owner_name} ({pr.owner_college})</p>

                        {pr.skills_used && pr.skills_used.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {pr.skills_used.map((sk) => (
                              <span key={sk} className="badge-slate text-[10px]">{sk}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-3">
                        {pr.demo_url && (
                          <a href={pr.demo_url} target="_blank" rel="noreferrer" className="btn-outline text-xs py-1">
                            Demo Link
                          </a>
                        )}
                        {pr.repo_url && (
                          <a href={pr.repo_url} target="_blank" rel="noreferrer" className="btn-secondary text-xs py-1">
                            Repository
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. OPPORTUNITIES SECTION */}
          {(tab === 'all' || tab === 'opportunities') && (
            <div>
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Opportunities ({results.opportunities.length})
              </h2>

              {results.opportunities.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No matching opportunities found.</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.opportunities.map((opp) => (
                    <div key={opp.id} className="card-base flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="badge-amber text-[10px]">{opp.type}</span>
                          <span className="badge-slate text-[10px]">{opp.status}</span>
                        </div>

                        <Link to={`/opportunities/${opp.id}`} className="font-bold text-slate-100 hover:text-blue-400 text-base block">
                          {opp.title}
                        </Link>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{opp.short_description}</p>
                        <p className="text-[11px] text-slate-500 mt-2">Organizer: {opp.organizer}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-xs text-slate-400">{opp.location}</span>
                        <Link to={`/opportunities/${opp.id}`} className="btn-primary text-xs py-1">
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* REQUEST TO JOIN MODAL */}
      {joinModalTeam && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card-base bg-slate-900 border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100">Request to Join {joinModalTeam.name}</h3>
              <button onClick={() => setJoinModalTeam(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Send a brief message to team leader explaining your skills and why you'd like to collaborate on <strong>{joinModalTeam.project_name}</strong>.
            </p>

            <textarea
              rows={3}
              placeholder="Hi! I have backend experience in Node.js and would love to build with your team."
              value={joinMessage}
              onChange={(e) => setJoinMessage(e.target.value)}
              className="input-field"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setJoinModalTeam(null)} className="btn-secondary text-xs py-2">
                Cancel
              </button>
              <button
                onClick={handleSendJoinRequest}
                disabled={sendingRequest}
                className="btn-primary text-xs py-2"
              >
                {sendingRequest ? 'Sending...' : 'Send Join Request'}
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVITE TO TEAM MODAL */}
      {inviteModalStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card-base bg-slate-900 border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100">Invite {inviteModalStudent.full_name} to Team</h3>
              <button onClick={() => setInviteModalStudent(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {myLeaderTeams.length === 0 ? (
              <div className="py-4 text-center space-y-3">
                <p className="text-xs text-slate-400">You must be a Team Leader of a team to invite students.</p>
                <Link to="/teams/create" onClick={() => setInviteModalStudent(null)} className="btn-primary text-xs">
                  Create a Team First
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Select Your Team</label>
                  <select
                    value={selectedInviteTeam}
                    onChange={(e) => setSelectedInviteTeam(e.target.value)}
                    className="input-field bg-slate-900"
                  >
                    {myLeaderTeams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.project_name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Role Title</label>
                  <input
                    type="text"
                    value={inviteRoleTitle}
                    onChange={(e) => setInviteRoleTitle(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Frontend Developer, AI Engineer"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setInviteModalStudent(null)} className="btn-secondary text-xs py-2">
                    Cancel
                  </button>
                  <button
                    onClick={handleSendInvite}
                    disabled={sendingInvite}
                    className="btn-primary text-xs py-2"
                  >
                    {sendingInvite ? 'Sending...' : 'Send Invitation'}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
