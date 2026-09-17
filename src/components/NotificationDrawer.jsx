import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Bell, CheckCheck, X, ArrowRight } from 'lucide-react';

export default function NotificationDrawer({ onClose }) {
  const { notifications, refreshNotifications } = useAuth();
  const navigate = useNavigate();

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      refreshNotifications();
    } catch (e) {}
  };

  const handleNotificationClick = async (n) => {
    try {
      await api.markNotificationRead(n.id);
      refreshNotifications();
    } catch (e) {}

    onClose();

    if (n.related_entity_type === 'team' && n.related_entity_id) {
      navigate(`/teams/${n.related_entity_id}`);
    } else if (n.related_entity_type === 'opportunity' && n.related_entity_id) {
      navigate(`/opportunities/${n.related_entity_id}`);
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-100">Notifications</h3>
        </div>
        <div className="flex items-center gap-2">
          {notifications.some(n => !n.is_read) && (
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] text-slate-400 hover:text-blue-400 flex items-center gap-1 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            <p className="text-sm">You're all caught up.</p>
            <p className="text-xs text-slate-500 mt-1">No notifications yet.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-3.5 transition-colors cursor-pointer hover:bg-slate-800/70 flex items-start justify-between gap-3 ${
                !n.is_read ? 'bg-blue-950/20 border-l-2 border-blue-500' : ''
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-200">{n.title}</span>
                  {!n.is_read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-snug">{n.message}</p>
                <span className="text-[10px] text-slate-500 mt-1.5 inline-block">
                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 mt-1 shrink-0" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
