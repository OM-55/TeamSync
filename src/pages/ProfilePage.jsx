import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, Building2, BookOpen, GraduationCap, Github, Linkedin, ExternalLink, PlusCircle, Edit3, CheckCircle2, FolderGit2 } from 'lucide-react';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user, profile: authProfile, updateProfileState } = useAuth();

  const isOwnProfile = !userId || (user && parseInt(userId) === user.id);

  const [targetProfile, setTargetProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [skillsStr, setSkillsStr] = useState('');
  const [interestsStr, setInterestsStr] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isOpenToTeams, setIsOpenToTeams] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add Project Modal
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projSkills, setProjSkills] = useState('React, Tailwind');
  const [projDemoUrl, setProjDemoUrl] = useState('');
  const [projRepoUrl, setProjRepoUrl] = useState('');
  const [projOutcome, setProjOutcome] = useState('');
  const [savingProj, setSavingProj] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, [userId, authProfile]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const targetId = isOwnProfile ? user?.id : userId;
      if (!targetId) return;

      const data = await api.getProfile(targetId);
      setTargetProfile(data.profile);
      setProjects(data.projects || []);
      setTeams(data.teams || []);

      if (isOwnProfile && data.profile) {
        let skillsArr = [];
        let interestsArr = [];
        try { skillsArr = JSON.parse(data.profile.skills || '[]'); } catch (e) {}
        try { interestsArr = JSON.parse(data.profile.interests || '[]'); } catch (e) {}

        setBio(data.profile.bio || '');
        setSkillsStr(skillsArr.join(', '));
        setInterestsStr(interestsArr.join(', '));
        setGithubUrl(data.profile.github_url || '');
        setLinkedinUrl(data.profile.linkedin_url || '');
        setIsOpenToTeams(data.profile.is_open_to_teams === 1);
      }
    } catch (err) {
      console.error('Load profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const skills = skillsStr.split(',').map(s => s.trim()).filter(Boolean);
      const interests = interestsStr.split(',').map(i => i.trim()).filter(Boolean);

      const updated = await api.updateProfile({
        bio,
        skills,
        interests,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
        is_open_to_teams: isOpenToTeams
      });

      updateProfileState(updated);
      setEditing(false);
      loadProfileData();
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setSavingProj(true);
    try {
      const skillsArr = projSkills.split(',').map(s => s.trim()).filter(Boolean);
      await api.createProject({
        title: projTitle,
        description: projDesc,
        skills_used: skillsArr,
        status: 'Completed',
        demo_url: projDemoUrl,
        repo_url: projRepoUrl,
        outcome: projOutcome,
        is_showcase: 1
      });

      setShowAddProjectModal(false);
      setProjTitle('');
      setProjDesc('');
      loadProfileData();
    } catch (err) {
      alert(err.message || 'Failed to save showcase project');
    } finally {
      setSavingProj(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-slate-400 text-sm">Loading student profile...</div>;
  if (!targetProfile) return <div className="text-center py-16 text-slate-400 text-sm">Profile not found.</div>;

  let skills = [];
  let interests = [];
  try { skills = JSON.parse(targetProfile.skills || '[]'); } catch (e) {}
  try { interests = JSON.parse(targetProfile.interests || '[]'); } catch (e) {}

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Profile Header */}
      <div className="card-base bg-slate-900 border-slate-800 p-6 sm:p-8 relative">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          
          <div className="w-20 h-20 rounded-2xl bg-blue-600 border-2 border-blue-500 font-bold text-white text-3xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-950">
            {targetProfile.full_name ? targetProfile.full_name.charAt(0).toUpperCase() : 'S'}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">{targetProfile.full_name}</h1>
                <p className="text-sm font-medium text-slate-300 mt-0.5">
                  {targetProfile.college}
                </p>
              </div>

              {isOwnProfile ? (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(true)} className="btn-secondary text-xs">
                    <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                  <button onClick={() => setShowAddProjectModal(true)} className="btn-primary text-xs">
                    <PlusCircle className="w-3.5 h-3.5" /> Add Showcase Project
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {targetProfile.is_open_to_teams === 1 && (
                    <span className="badge-green text-xs">Open to Teams</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-slate-400 font-medium">
              <span>Year: <strong className="text-slate-200">{targetProfile.year_of_study}</strong></span>
              <span>Branch: <strong className="text-slate-200">{targetProfile.branch}</strong></span>
            </div>

            <p className="text-xs text-slate-300 pt-2 leading-relaxed max-w-3xl">
              {targetProfile.bio || 'Student builder on TeamSync.'}
            </p>

            {/* Links */}
            <div className="flex flex-wrap gap-3 pt-3 text-xs">
              {targetProfile.github_url && (
                <a href={targetProfile.github_url} target="_blank" rel="noreferrer" className="btn-secondary text-xs py-1">
                  <Github className="w-3.5 h-3.5" /> GitHub
                </a>
              )}
              {targetProfile.linkedin_url && (
                <a href={targetProfile.linkedin_url} target="_blank" rel="noreferrer" className="btn-secondary text-xs py-1">
                  <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                </a>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Grid: Skills & Interests + Showcase Projects */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column (1 col): Skills & Teams */}
        <div className="space-y-6">
          
          {/* Skills */}
          <div className="card-base">
            <h3 className="text-sm font-bold text-slate-100 mb-3 uppercase tracking-wider text-xs">Skills & Tech Stack</h3>
            {skills.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No skills listed yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {skills.map((sk) => (
                  <span key={sk} className="badge-blue text-xs">{sk}</span>
                ))}
              </div>
            )}
          </div>

          {/* Interests */}
          <div className="card-base">
            <h3 className="text-sm font-bold text-slate-100 mb-3 uppercase tracking-wider text-xs">Interests & Focus Areas</h3>
            {interests.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No interests listed yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {interests.map((it) => (
                  <span key={it} className="badge-amber text-xs">{it}</span>
                ))}
              </div>
            )}
          </div>

          {/* Teams */}
          <div className="card-base">
            <h3 className="text-sm font-bold text-slate-100 mb-3">Teams ({teams.length})</h3>
            {teams.length === 0 ? (
              <p className="text-xs text-slate-500">Not part of any teams yet.</p>
            ) : (
              <div className="space-y-2">
                {teams.map((t) => (
                  <Link key={t.id} to={`/teams/${t.id}`} className="block p-2 rounded bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors text-xs">
                    <span className="font-semibold text-slate-200">{t.name}</span>
                    <span className="text-slate-400 block text-[11px]">{t.role_title} • {t.purpose}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (2 cols): Showcase Projects */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-purple-400" />
              Build Showcase ({projects.length})
            </h2>
            {isOwnProfile && (
              <button onClick={() => setShowAddProjectModal(true)} className="btn-primary text-xs">
                + Add Project
              </button>
            )}
          </div>

          {projects.length === 0 ? (
            <div className="card-base text-center py-12 text-xs text-slate-400">
              No completed builds showcased yet.
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((p) => (
                <div key={p.id} className="card-base space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-100 text-base">{p.title}</h3>
                    <span className="badge-green text-[10px]">{p.status}</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{p.description}</p>

                  {p.outcome && (
                    <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-900/50 text-xs text-emerald-300">
                      <strong>Outcome / Impact:</strong> {p.outcome}
                    </div>
                  )}

                  {p.skills_used && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {p.skills_used.map((sk) => (
                        <span key={sk} className="badge-slate text-[10px]">{sk}</span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-3 text-xs">
                    {p.demo_url && (
                      <a href={p.demo_url} target="_blank" rel="noreferrer" className="btn-outline text-xs py-1">
                        <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                      </a>
                    )}
                    {p.repo_url && (
                      <a href={p.repo_url} target="_blank" rel="noreferrer" className="btn-secondary text-xs py-1">
                        <Github className="w-3.5 h-3.5" /> Repository
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* EDIT PROFILE MODAL */}
      {editing && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card-base bg-slate-900 border-slate-800 max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-100 border-b border-slate-800 pb-3">Edit Builder Profile</h3>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Short Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="input-field"
                  placeholder="Passionate full stack developer interested in backend performance..."
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Skills (Comma Separated)</label>
                <input
                  type="text"
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  className="input-field"
                  placeholder="React, Node.js, Python, PostgreSQL"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Interests & Focus Areas</label>
                <input
                  type="text"
                  value={interestsStr}
                  onChange={(e) => setInterestsStr(e.target.value)}
                  className="input-field"
                  placeholder="Hackathons, Web Apps, Open Source"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">GitHub URL</label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="input-field"
                    placeholder="https://github.com/..."
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="input-field"
                    placeholder="https://linkedin.com/..."
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-slate-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOpenToTeams}
                  onChange={(e) => setIsOpenToTeams(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
                Show "Open to Teams" Status Badge
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SHOWCASE PROJECT MODAL */}
      {showAddProjectModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card-base bg-slate-900 border-slate-800 max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-100 border-b border-slate-800 pb-3">Add Showcase Project</h3>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  className="input-field"
                  placeholder="e.g. StudyFlow Platform"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  className="input-field"
                  placeholder="Brief summary of what was built and why..."
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Skills Used (Comma Separated)</label>
                <input
                  type="text"
                  value={projSkills}
                  onChange={(e) => setProjSkills(e.target.value)}
                  className="input-field"
                  placeholder="React, Node.js, SQLite"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Demo URL</label>
                  <input
                    type="url"
                    value={projDemoUrl}
                    onChange={(e) => setProjDemoUrl(e.target.value)}
                    className="input-field"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Repo URL</label>
                  <input
                    type="url"
                    value={projRepoUrl}
                    onChange={(e) => setProjRepoUrl(e.target.value)}
                    className="input-field"
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Outcome / Impact</label>
                <input
                  type="text"
                  value={projOutcome}
                  onChange={(e) => setProjOutcome(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Winner at Hackathon X, 300 active users"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddProjectModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={savingProj} className="btn-primary">
                  {savingProj ? 'Saving...' : 'Add to Showcase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
