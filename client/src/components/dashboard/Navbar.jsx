import React from 'react';
import { Bell, User, LogOut, BookOpen } from 'lucide-react';
import { clearAuthSession } from '../../utils/authUtils';

export default function Navbar({ onLogout, user, role = 'instructor' }) {
  const handleLogout = () => {
    clearAuthSession();
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  const isStudent = role === 'student';
  const roleDisplayName = isStudent ? 'Student' : 'Instructor';
  const displayName = user?.name || (isStudent ? 'Student' : 'Instructor');
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="top-navbar">
      <div className="navbar-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: isStudent ? '#059669' : '#1677ff',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isStudent
                ? '0 2px 6px rgba(5, 150, 105, 0.3)'
                : '0 2px 6px rgba(22, 119, 255, 0.3)'
            }}
          >
            <BookOpen size={20} />
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: '17px',
              color: '#1e293b',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.3px'
            }}
          >
            {isStudent ? 'Student Portal' : 'Classroom System'}
          </span>
        </div>
      </div>

      <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="notification-btn" title="Notifications">
          <Bell size={20} />
          <span className="notification-badge">2</span>
        </button>

        <div className="user-profile-badge" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            className="user-avatar-circle"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: isStudent ? '#059669' : '#1677ff',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
            }}
          >
            {avatarInitial}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
            <span style={{ fontWeight: 600, fontSize: '13.5px', color: '#1e293b' }}>
              {displayName}
            </span>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: isStudent ? '#059669' : '#1677ff' }}>
              {roleDisplayName}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Log Out"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#ef4444',
            fontWeight: 600,
            transition: 'all 0.2s',
            marginLeft: '4px'
          }}
        >
          <LogOut size={15} /> Logout
        </button>
      </div>
    </header>
  );
}
