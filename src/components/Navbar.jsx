import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, User, Users, Shield, LogOut, Menu, X, Compass, Home, Award, PlusCircle } from 'lucide-react';
import NotificationDrawer from './NotificationDrawer';

export default function Navbar() {
  const { user, profile, logout, unreadNotificationsCount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <nav className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-8">
            <Link to={user ? "/home" : "/"} className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-900/40 group-hover:bg-blue-500 transition-colors">
                TS
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-slate-100 leading-tight tracking-tight">TeamSync</span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">Connect. Collaborate. Build.</span>
              </div>
            </Link>

            {/* Main Primary Navigation */}
            {user && (
              <div className="hidden md:flex items-center gap-1">
                <Link
                  to="/home"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive('/home') ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  Home
                </Link>
                <Link
                  to="/discover"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive('/discover') ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  Discover
                </Link>
                <Link
                  to="/opportunities"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive('/opportunities') ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  Opportunities
                </Link>
              </div>
            )}
          </div>

          {/* Right Section: Notification & User Menu */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link to="/teams/create" className="btn-primary text-xs">
                  <PlusCircle className="w-4 h-4" />
                  Create Team
                </Link>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors relative"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-slate-900">
                        {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <NotificationDrawer onClose={() => setNotificationsOpen(false)} />
                  )}
                </div>

                {/* Avatar Menu Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                    className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-semibold text-blue-400">
                      {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="text-sm font-medium text-slate-200 max-w-[120px] truncate">
                      {profile?.full_name || 'Student'}
                    </span>
                  </button>

                  {avatarMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-2 border-b border-slate-800">
                        <p className="text-sm font-medium text-slate-200 truncate">{profile?.full_name}</p>
                        <p className="text-xs text-slate-400 truncate">{profile?.college || user.email}</p>
                        {user.role === 'ADMIN' && (
                          <span className="inline-block mt-1 badge-amber text-[10px]">ADMINISTRATOR</span>
                        )}
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setAvatarMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Profile
                      </Link>

                      <Link
                        to="/my-teams"
                        onClick={() => setAvatarMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        <Users className="w-4 h-4 text-slate-400" />
                        My Teams
                      </Link>

                      {user.role === 'ADMIN' && (
                        <Link
                          to="/admin"
                          onClick={() => setAvatarMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-amber-400 hover:bg-amber-950/40"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Panel
                        </Link>
                      )}

                      <div className="border-t border-slate-800 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm text-rose-400 hover:bg-rose-950/30"
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/auth" className="btn-secondary">
                  Log in
                </Link>
                <Link to="/auth?mode=signup" className="btn-primary">
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-slate-400 hover:text-white relative"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-6 space-y-3">
          {user ? (
            <>
              <Link
                to="/home"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800"
              >
                Home
              </Link>
              <Link
                to="/discover"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800"
              >
                Discover
              </Link>
              <Link
                to="/opportunities"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800"
              >
                Opportunities
              </Link>
              <Link
                to="/my-teams"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800"
              >
                My Teams
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800"
              >
                My Profile
              </Link>
              {user.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-amber-400 font-medium hover:bg-amber-950/30"
                >
                  Admin Panel
                </Link>
              )}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 text-rose-400"
                >
                  Log out
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="btn-secondary w-full text-center">
                Log in
              </Link>
              <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)} className="btn-primary w-full text-center">
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Render Mobile Notification Drawer */}
      {notificationsOpen && mobileMenuOpen && (
        <NotificationDrawer onClose={() => setNotificationsOpen(false)} />
      )}
    </nav>
  );
}
