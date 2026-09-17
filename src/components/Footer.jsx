import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
            TS
          </div>
          <span className="font-semibold text-slate-200">TeamSync</span>
          <span>— Connect. Collaborate. Build.</span>
        </div>

        <div className="flex items-center gap-6">
          <Link to="/discover" className="hover:text-slate-200 transition-colors">Discover</Link>
          <Link to="/opportunities" className="hover:text-slate-200 transition-colors">Opportunities</Link>
          <Link to="/my-teams" className="hover:text-slate-200 transition-colors">My Teams</Link>
          <Link to="/profile" className="hover:text-slate-200 transition-colors">Profile</Link>
        </div>

        <p className="text-slate-500">© 2026 TeamSync. Student Collaboration Platform.</p>
      </div>
    </footer>
  );
}
