import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import HomePage from './pages/HomePage';
import DiscoverPage from './pages/DiscoverPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import OpportunityDetailPage from './pages/OpportunityDetailPage';
import CreateTeamPage from './pages/CreateTeamPage';
import TeamDetailPage from './pages/TeamDetailPage';
import ProfilePage from './pages/ProfilePage';
import MyTeamsPage from './pages/MyTeamsPage';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children, requireOnboarded = true }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Loading session...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireOnboarded && user.onboarded === 0 && user.role !== 'ADMIN') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Loading session...</div>;
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/home" replace />;
  }

  return children;
}

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          
          <Route path="/onboarding" element={
            <ProtectedRoute requireOnboarded={false}>
              <OnboardingPage />
            </ProtectedRoute>
          } />

          <Route path="/home" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />

          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/opportunities" element={<OpportunitiesPage />} />
          <Route path="/opportunities/:idOrSlug" element={<OpportunityDetailPage />} />

          <Route path="/teams/create" element={
            <ProtectedRoute>
              <CreateTeamPage />
            </ProtectedRoute>
          } />
          
          <Route path="/teams/:id" element={
            <ProtectedRoute>
              <TeamDetailPage />
            </ProtectedRoute>
          } />

          <Route path="/my-teams" element={
            <ProtectedRoute>
              <MyTeamsPage />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          <Route path="/profile/:userId" element={<ProfilePage />} />

          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
