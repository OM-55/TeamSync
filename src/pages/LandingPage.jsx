import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Rocket, Trophy, Compass, ArrowRight, ShieldCheck, Sparkles, Check } from 'lucide-react';
import Footer from '../components/Footer';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-800/40 text-blue-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Student Collaboration Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-100 max-w-4xl mx-auto leading-tight">
          Find people to build with.
        </h1>

        <p className="mt-5 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          TeamSync connects college students around projects, hackathons, and opportunities. Discover teammates, form teams, build together, and showcase your work.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={user ? "/teams/create" : "/auth?mode=signup"}
            className="btn-primary text-base px-6 py-3 w-full sm:w-auto"
          >
            <Rocket className="w-5 h-5" />
            Create a Team
          </Link>
          <Link
            to="/opportunities"
            className="btn-secondary text-base px-6 py-3 w-full sm:w-auto"
          >
            <Compass className="w-5 h-5 text-slate-400" />
            Explore Opportunities
          </Link>
        </div>

        {/* Core Journey Flow */}
        <div className="mt-16 pt-12 border-t border-slate-900 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
            <span className="text-xs font-bold text-blue-400">STEP 1</span>
            <h3 className="font-semibold text-slate-200 mt-1">Discover</h3>
            <p className="text-xs text-slate-400 mt-1">Search students by skills, college, branch, and interests.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
            <span className="text-xs font-bold text-blue-400">STEP 2</span>
            <h3 className="font-semibold text-slate-200 mt-1">Team Up</h3>
            <p className="text-xs text-slate-400 mt-1">Create or request to join teams for hackathons or projects.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
            <span className="text-xs font-bold text-blue-400">STEP 3</span>
            <h3 className="font-semibold text-slate-200 mt-1">Build</h3>
            <p className="text-xs text-slate-400 mt-1">Collaborate with defined member roles and project goals.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
            <span className="text-xs font-bold text-blue-400">STEP 4</span>
            <h3 className="font-semibold text-slate-200 mt-1">Showcase</h3>
            <p className="text-xs text-slate-400 mt-1">Turn completed builds into proof of skills on your profile.</p>
          </div>
        </div>
      </section>

      {/* 3 Core Value Propositions */}
      <section className="py-16 bg-slate-900/40 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">Designed for student builders</h2>
            <p className="text-slate-400 text-sm mt-2">Focused collaboration without social network noise.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-base">
              <div className="w-10 h-10 rounded-lg bg-blue-950 border border-blue-800/50 flex items-center justify-center text-blue-400 mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Find Teammates</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Discover students based on actual skills, branch, year of study, and project interests rather than arbitrary connections.
              </p>
            </div>

            <div className="card-base">
              <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-800/50 flex items-center justify-center text-emerald-400 mb-4">
                <Rocket className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Build Together</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Form teams for hackathons, college projects, or personal ideas with dynamic rule checking and role assignment.
              </p>
            </div>

            <div className="card-base">
              <div className="w-10 h-10 rounded-lg bg-amber-950 border border-amber-800/50 flex items-center justify-center text-amber-400 mb-4">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Showcase Your Work</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Transform finished team and individual projects into visual portfolio evidence of what you have built.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick CTA banner */}
      <section className="py-16 px-4 max-w-5xl mx-auto text-center">
        <div className="card-base p-8 sm:p-12 border-slate-800 bg-slate-900/80">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-3">Ready to assemble your team?</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mb-6">
            Join students across colleges collaborating on real projects and competitive hackathons.
          </p>
          <Link to="/auth?mode=signup" className="btn-primary text-base px-6 py-3">
            Get Started Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
