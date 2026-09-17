import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { GraduationCap, Building2, BookOpen, ArrowRight, User } from 'lucide-react';

export default function OnboardingPage() {
  const { user, profile, completeOnboarding } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [college, setCollege] = useState(profile?.college || '');
  const [yearOfStudy, setYearOfStudy] = useState(profile?.year_of_study || '2nd Year');
  const [branch, setBranch] = useState(profile?.branch || 'Computer Science & Engineering');

  const [collegesList, setCollegesList] = useState([]);
  const [collegeSearch, setCollegeSearch] = useState('');
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchColleges('');
  }, []);

  const fetchColleges = async (q) => {
    try {
      const data = await api.getColleges(q);
      setCollegesList(data.map(c => c.name));
    } catch (err) {}
  };

  const handleCollegeSearchChange = (e) => {
    const val = e.target.value;
    setCollegeSearch(val);
    setCollege(val);
    fetchColleges(val);
    setShowCollegeDropdown(true);
  };

  const selectCollege = (cName) => {
    setCollege(cName);
    setCollegeSearch(cName);
    setShowCollegeDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !college.trim() || !yearOfStudy || !branch.trim()) {
      setError('Full Name, College, Year of Study, and Branch are required');
      return;
    }

    setSubmitting(true);
    try {
      await completeOnboarding({
        full_name: fullName.trim(),
        college: college.trim(),
        year_of_study: yearOfStudy,
        branch: branch.trim()
      });
      navigate('/home');
    } catch (err) {
      setError(err.message || 'Failed to complete profile onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  const defaultBranches = [
    'Computer Science & Engineering',
    'Artificial Intelligence & Data Science',
    'Electrical & Computer Engineering',
    'Mechanical Engineering',
    'Information Technology',
    'Biotechnology / Bioengineering',
    'Business / Economics',
    'Design & Human-Computer Interaction',
    'Other'
  ];

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 font-bold text-white text-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-900/40">
            TS
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Quick Profile Onboarding</h1>
          <p className="text-sm text-slate-400 mt-1">
            Fill in required student info to discover teammates and opportunities.
          </p>
        </div>

        <div className="card-base bg-slate-900 border-slate-800">
          
          {error && (
            <div className="bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field pl-9"
                />
              </div>
            </div>

            {/* Searchable College Dropdown */}
            <div className="relative">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                College / University <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Search college (e.g. MIT, Stanford, CMU)..."
                  value={collegeSearch || college}
                  onChange={handleCollegeSearchChange}
                  onFocus={() => setShowCollegeDropdown(true)}
                  className="input-field pl-9"
                />
              </div>

              {showCollegeDropdown && collegesList.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-800/60">
                  {collegesList.map((cName) => (
                    <button
                      key={cName}
                      type="button"
                      onClick={() => selectCollege(cName)}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      {cName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Year of Study */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Year of Study <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {['1st Year', '2nd Year', '3rd Year', '4th Year', 'Other'].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setYearOfStudy(yr)}
                    className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                      yearOfStudy === yr
                        ? 'bg-blue-950 text-blue-400 border-blue-600 font-semibold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>

            {/* Branch / Department */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Branch / Department <span className="text-rose-400">*</span>
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="input-field bg-slate-900"
              >
                {defaultBranches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-2.5 mt-4"
            >
              {submitting ? 'Saving Profile...' : 'Complete Onboarding & Start'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
