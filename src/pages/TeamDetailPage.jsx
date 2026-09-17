import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Users, Shield, UserPlus, CheckCircle2, XCircle, MessageSquare, ExternalLink, Github, Figma, Send, RefreshCw, X, ArrowLeft, Crown } from 'lucide-react';
import OpportunityRuleBadge from '../components/OpportunityRuleBadge';

export default function TeamDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members'); // 'members', 'recruitment', 'chat'

  // Modals & Drawers
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteStudentId, setInviteStudentId] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedNewLeaderId, setSelectedNewLeaderId] = useState('');

  // Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const [feedback, setFeedback] = useState('');

  const isLeader = user && team && team.leader_id === user.id;
  const isMember = user && team && team.members?.some(m => m.user_id === user.id);

  useEffect(() => {
    loadTeam();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'chat' && isMember) {
      loadChat();
      const interval = setInterval(loadChat, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, isMember, id]);

  const loadTeam = async () => {
    setLoading(true);
    try {
      const data = await api.getTeamDetails(id);
      setTeam(data);
    } catch (err) {
      console.error('Error fetching team:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadChat = async () => {
    try {
      const msgs = await api.getTeamMessages(id);
      setChatMessages(msgs);
    } catch (err) {}
  };

  const handleReviewRequest = async (requestId, action) => {
    try {
      const res = await api.reviewJoinRequest(id, requestId, action);
      setFeedback(`Request ${action}ed!`);
      setTimeout(() => setFeedback(''), 3000);
      loadTeam();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteStudentId) return;
    try {
      await api.inviteStudent(id, { student_id: parseInt(inviteStudentId), role_title: inviteRole });
      setFeedback('Invitation sent!');
      setShowInviteModal(false);
      setTimeout(() => setFeedback(''), 3000);
      loadTeam();
    } catch (err) {
      alert(err.message || 'Failed to send invitation');
    }
  };

  const handleTransferLeadership = async () => {
    if (!selectedNewLeaderId) return;
    try {
      await api.transferLeadership(id, { new_leader_id: parseInt(selectedNewLeaderId) });
      setFeedback('Leadership transferred successfully!');
      setShowTransferModal(false);
      setTimeout(() => setFeedback(''), 3000);
      loadTeam();
    } catch (err) {
      alert(err.message || 'Transfer failed');
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setSendingMsg(true);
    try {
      const newMsg = await api.sendTeamMessage(id, chatInput.trim());
      setChatMessages([...chatMessages, newMsg]);
      setChatInput('');
    } catch (err) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.updateTeam(id, { status: newStatus });
      loadTeam();
    } catch (err) {}
  };

  if (loading) return <div className="text-center py-16 text-slate-400 text-sm">Loading team...</div>;
  if (!team) return <div className="text-center py-16 text-slate-400 text-sm">Team not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <button onClick={() => navigate('/my-teams')} className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200">
        <ArrowLeft className="w-4 h-4" />
        Back to My Teams
      </button>

      {feedback && (
        <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-sm rounded-lg p-3 text-center">
          {feedback}
        </div>
      )}

      {/* Header Banner */}
      <div className="card-base bg-slate-900 border-slate-800 p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="badge-blue text-xs">{team.purpose}</span>
            <span className={`badge-green text-xs ${team.status === 'Recruiting' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-300'}`}>
              {team.status}
            </span>
            <OpportunityRuleBadge ruleEvaluation={team.ruleEvaluation} />
          </div>

          {/* Leader Lifecycle Control */}
          {isLeader && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Team Status:</span>
              <select
                value={team.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1"
              >
                <option value="Recruiting">Recruiting</option>
                <option value="Building">Building</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold text-slate-100">{team.name}</h1>
          <p className="text-sm font-semibold text-blue-400 mt-1">Project: {team.project_name}</p>
          <p className="text-xs text-slate-300 mt-2 max-w-3xl leading-relaxed">{team.project_description}</p>
        </div>

        {team.opportunity_title && (
          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-900/50 text-xs text-amber-300 flex items-center justify-between">
            <span>Associated Event: <strong>{team.opportunity_title}</strong></span>
            <Link to={`/opportunities/${team.opportunity_id}`} className="underline hover:text-white">View Event Rules</Link>
          </div>
        )}

        {/* Project Links */}
        <div className="flex flex-wrap gap-4 pt-3 border-t border-slate-800/80 text-xs">
          {team.github_link && (
            <a href={team.github_link} target="_blank" rel="noreferrer" className="btn-secondary text-xs py-1">
              <Github className="w-3.5 h-3.5" /> Repository
            </a>
          )}
          {team.figma_link && (
            <a href={team.figma_link} target="_blank" rel="noreferrer" className="btn-secondary text-xs py-1">
              <Figma className="w-3.5 h-3.5" /> Figma Design
            </a>
          )}
          {team.demo_link && (
            <a href={team.demo_link} target="_blank" rel="noreferrer" className="btn-outline text-xs py-1">
              <ExternalLink className="w-3.5 h-3.5" /> Live Demo
            </a>
          )}
        </div>
      </div>

      {/* Dynamic Rule Validation Summary Banner */}
      <div className="card-base bg-slate-900/80 border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            Rule Engine Compliance Summary
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {team.ruleEvaluation?.summary}
          </p>
        </div>

        {isLeader && (
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setShowInviteModal(true)} className="btn-primary text-xs">
              <UserPlus className="w-3.5 h-3.5" /> Invite Member
            </button>
            <button onClick={() => setShowTransferModal(true)} className="btn-secondary text-xs">
              <Crown className="w-3.5 h-3.5 text-amber-400" /> Transfer Leader
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'members' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Members ({team.members?.length || 0})
        </button>

        {isLeader && (
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors relative ${
              activeTab === 'requests' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Join Requests ({team.pendingRequests?.length || 0})
          </button>
        )}

        {isMember && (
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'chat' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Team Chat
          </button>
        )}
      </div>

      {/* TAB CONTENT */}

      {/* 1. MEMBERS LIST */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.members?.map((m) => (
              <div key={m.membership_id} className="card-base flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-blue-400 text-sm shrink-0">
                  {m.full_name ? m.full_name.charAt(0) : 'M'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <Link to={`/profile/${m.user_id}`} className="font-bold text-slate-100 hover:text-blue-400 text-sm truncate">
                      {m.full_name}
                    </Link>
                    {m.user_id === team.leader_id && (
                      <span className="badge-amber text-[9px]">LEADER</span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-blue-400 mt-0.5">{m.role_title}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-1">{m.college}</p>
                  <p className="text-[10px] text-slate-500">{m.year_of_study} • {m.branch}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. JOIN REQUESTS (LEADER ONLY) */}
      {activeTab === 'requests' && isLeader && (
        <div className="space-y-4">
          {(!team.pendingRequests || team.pendingRequests.length === 0) ? (
            <div className="card-base text-center py-8 text-xs text-slate-400">
              No pending join requests.
            </div>
          ) : (
            <div className="space-y-3 max-w-2xl">
              {team.pendingRequests.map((req) => (
                <div key={req.id} className="card-base flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <Link to={`/profile/${req.applicant_id}`} className="font-bold text-slate-100 hover:text-blue-400 text-sm">
                      {req.full_name}
                    </Link>
                    <p className="text-xs text-slate-400">{req.college} • {req.year_of_study} • {req.branch}</p>
                    {req.message && (
                      <p className="text-xs text-slate-300 italic mt-1 bg-slate-950 p-2 rounded">
                        "{req.message}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleReviewRequest(req.id, 'accept')}
                      className="btn-primary text-xs py-1 px-3"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      onClick={() => handleReviewRequest(req.id, 'reject')}
                      className="btn-secondary text-xs py-1 px-3 text-rose-400 hover:bg-rose-950/30"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. TEAM CHAT (MEMBERS ONLY) */}
      {activeTab === 'chat' && isMember && (
        <div className="card-base bg-slate-900 border-slate-800 p-4 space-y-4 max-w-3xl">
          <div className="h-80 overflow-y-auto space-y-3 p-2 border border-slate-800 rounded-lg bg-slate-950">
            {chatMessages.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-12">No team messages yet. Start the conversation!</p>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col text-xs p-2.5 rounded-lg max-w-[80%] ${
                    msg.sender_id === user.id
                      ? 'bg-blue-900/60 text-slate-100 ml-auto border border-blue-800/60'
                      : 'bg-slate-800 text-slate-200 mr-auto border border-slate-700'
                  }`}
                >
                  <span className="font-bold text-[11px] text-blue-300 mb-0.5">{msg.sender_name}</span>
                  <p className="leading-normal">{msg.message}</p>
                  <span className="text-[9px] text-slate-400 mt-1 align-self-end">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendChatMessage} className="flex gap-2">
            <input
              type="text"
              placeholder="Type message to team..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="input-field flex-1"
            />
            <button type="submit" disabled={sendingMsg} className="btn-primary text-xs px-4">
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </form>
        </div>
      )}

      {/* INVITE MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card-base bg-slate-900 border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100">Invite Student to Team</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Student User ID</label>
                <input
                  type="number"
                  required
                  placeholder="Enter student user ID (e.g. 2, 3, 4)"
                  value={inviteStudentId}
                  onChange={(e) => setInviteStudentId(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Role</label>
                <input
                  type="text"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Backend Developer"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowInviteModal(false)} className="btn-secondary text-xs py-2">
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs py-2">
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER LEADERSHIP MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card-base bg-slate-900 border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100">Transfer Team Leadership</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select an existing team member to transfer designated leadership responsibility to.
            </p>

            <select
              value={selectedNewLeaderId}
              onChange={(e) => setSelectedNewLeaderId(e.target.value)}
              className="input-field bg-slate-900"
            >
              <option value="">Select Member...</option>
              {team.members?.filter(m => m.user_id !== user.id).map((m) => (
                <option key={m.user_id} value={m.user_id}>{m.full_name} ({m.role_title})</option>
              ))}
            </select>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowTransferModal(false)} className="btn-secondary text-xs py-2">
                Cancel
              </button>
              <button onClick={handleTransferLeadership} className="btn-primary text-xs py-2">
                Transfer Leadership
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
