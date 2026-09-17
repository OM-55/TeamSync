import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Rocket, PlusCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function CreateTeamPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preselectedOppId = searchParams.get('opportunityId') || '';

  const [purpose, setPurpose] = useState(preselectedOppId ? 'Hackathon' : 'Personal Project');
  const [name, setName] = useState('');
  const [opportunityId, setOpportunityId] = useState(preselectedOppId);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('React, Node.js');
  const [requiredRoles, setRequiredRoles] = useState('Backend Developer, UI/UX Designer');
  const [leaderRoleTitle, setLeaderRoleTitle] = useState('Team Leader / Full Stack');
  const [githubLink, setGithubLink] = useState('');
  const [figmaLink, setFigmaLink] = useState('');

  const [opportunities, setOpportunities] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const data = await api.getOpportunities({ status: 'Published' });
      setOpportunities(data);
    } catch (err) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !projectName.trim()) {
      setError('Team Name and Project Name are required');
      return;
    }

    setSubmitting(true);
    try {
      const skillsArr = requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      const rolesArr = requiredRoles.split(',').map(r => r.trim()).filter(Boolean);

      const res = await api.createTeam({
        name: name.trim(),
        purpose,
        opportunity_id: purpose !== 'Personal Project' ? opportunityId : null,
        project_name: projectName.trim(),
        project_description: projectDescription.trim(),
        required_skills: skillsArr,
        required_roles: rolesArr,
        leader_role_title: leaderRoleTitle.trim(),
        github_link: githubLink.trim(),
        figma_link: figmaLink.trim()
      });

      navigate(`/teams/${res.teamId}`);
    } catch (err) {
      setError(err.message || 'Failed to create team');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="card-base bg-slate-900 border-slate-800 p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Rocket className="w-6 h-6 text-blue-400" />
            Create a New Team
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Define your team purpose, project goals, and recruiting requirements.
          </p>
        </div>

        {error && (
          <div className="bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-lg p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Purpose Choice */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Team Purpose <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'Hackathon', label: 'Hackathon' },
                { id: 'Special Event', label: 'Special Event' },
                { id: 'Personal Project', label: 'Personal Project' }
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPurpose(p.id)}
                  className={`py-2.5 px-3 text-xs font-medium rounded-lg border transition-colors ${
                    purpose === p.id
                      ? 'bg-blue-950 text-blue-400 border-blue-600 font-semibold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Associate Opportunity if applicable */}
          {purpose !== 'Personal Project' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Associated Opportunity / Event
              </label>
              <select
                value={opportunityId}
                onChange={(e) => setOpportunityId(e.target.value)}
                className="input-field bg-slate-900"
              >
                <option value="">Select Opportunity...</option>
                {opportunities.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    {opp.title} ({opp.organizer})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Your team will automatically inherit and validate the opportunity's configured rules.
              </p>
            </div>
          )}

          {/* Team Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Team Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Team Nova, DevPulse Studio"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Project Name & Description */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Project / Idea Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. EcoTrack AI"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Your Role as Leader
              </label>
              <input
                type="text"
                placeholder="e.g. Team Leader / Full Stack"
                value={leaderRoleTitle}
                onChange={(e) => setLeaderRoleTitle(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Project Description & Goals
            </label>
            <textarea
              rows={3}
              placeholder="Briefly describe what your team intends to build..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Recruiting Needs */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Required Skills (Comma Separated)
              </label>
              <input
                type="text"
                placeholder="React, Node.js, Python, Figma"
                value={requiredSkills}
                onChange={(e) => setRequiredSkills(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Open Roles Needed
              </label>
              <input
                type="text"
                placeholder="Backend Developer, UI/UX Designer"
                value={requiredRoles}
                onChange={(e) => setRequiredRoles(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* Optional Links */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">GitHub Repository (Optional)</label>
              <input
                type="url"
                placeholder="https://github.com/org/repo"
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Figma Design Link (Optional)</label>
              <input
                type="url"
                placeholder="https://figma.com/file/..."
                value={figmaLink}
                onChange={(e) => setFigmaLink(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-base">
              {submitting ? 'Creating Team...' : 'Create Team & Start Recruiting'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
