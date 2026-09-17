const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('teamsync_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('teamsync_token', token);
  } else {
    localStorage.removeItem('teamsync_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
  } catch (netErr) {
    console.error('Network connection error:', netErr);
    throw new Error('Unable to connect to TeamSync backend server. Please make sure the backend server is running.');
  }

  let data = {};
  try {
    data = await response.json();
  } catch (e) {
    data = {};
  }

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Server error (${response.status}: ${response.statusText})`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  signup: (payload) => request('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),

  // Onboarding & Profiles
  onboard: (payload) => request('/profiles/onboard', { method: 'POST', body: JSON.stringify(payload) }),
  updateProfile: (payload) => request('/profiles/me', { method: 'PUT', body: JSON.stringify(payload) }),
  getProfile: (userId) => request(`/profiles/${userId}`),
  getColleges: (query = '') => request(`/profiles/colleges?q=${encodeURIComponent(query)}`),

  // Discover
  discover: (params = {}) => {
    const queryStr = new URLSearchParams(params).toString();
    return request(`/discover?${queryStr}`);
  },

  // Teams
  getTeams: (params = {}) => {
    const queryStr = new URLSearchParams(params).toString();
    return request(`/teams?${queryStr}`);
  },
  getMyTeams: () => request('/teams/my'),
  getTeamDetails: (id) => request(`/teams/${id}`),
  createTeam: (payload) => request('/teams', { method: 'POST', body: JSON.stringify(payload) }),
  updateTeam: (id, payload) => request(`/teams/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  requestToJoinTeam: (id, payload) => request(`/teams/${id}/request`, { method: 'POST', body: JSON.stringify(payload) }),
  reviewJoinRequest: (teamId, requestId, action) => request(`/teams/${teamId}/requests/${requestId}`, { method: 'PUT', body: JSON.stringify({ action }) }),
  inviteStudent: (teamId, payload) => request(`/teams/${teamId}/invite`, { method: 'POST', body: JSON.stringify(payload) }),
  respondToInvitation: (invitationId, action) => request(`/teams/invitations/${invitationId}`, { method: 'PUT', body: JSON.stringify({ action }) }),
  transferLeadership: (teamId, payload) => request(`/teams/${teamId}/transfer-leadership`, { method: 'POST', body: JSON.stringify(payload) }),
  getTeamMessages: (teamId) => request(`/teams/${teamId}/messages`),
  sendTeamMessage: (teamId, message) => request(`/teams/${teamId}/messages`, { method: 'POST', body: JSON.stringify({ message }) }),

  // Opportunities
  getOpportunities: (params = {}) => {
    const queryStr = new URLSearchParams(params).toString();
    return request(`/opportunities?${queryStr}`);
  },
  getOpportunityDetails: (idOrSlug) => request(`/opportunities/${idOrSlug}`),
  createOpportunity: (payload) => request('/opportunities', { method: 'POST', body: JSON.stringify(payload) }),
  updateOpportunity: (id, payload) => request(`/opportunities/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),

  // Projects
  getProjects: () => request('/projects'),
  createProject: (payload) => request('/projects', { method: 'POST', body: JSON.stringify(payload) }),

  // Admin
  getAdminDashboard: () => request('/admin/dashboard'),
  getAdminStudents: () => request('/admin/students'),
  getAdminTeams: () => request('/admin/teams')
};
