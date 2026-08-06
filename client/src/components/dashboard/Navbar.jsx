import React from 'react';
import { Bell, User } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="top-navbar">
      <div className="navbar-brand">
        <div className="logo-placeholder">
          {/* Logo placeholder as shown in Figma mockups */}
        </div>
      </div>

      <div className="navbar-right">
        <button className="notification-btn" title="Notifications">
          <Bell size={20} />
          <span className="notification-badge">2</span>
        </button>

        <button className="user-avatar-btn" title="User Profile">
          <User size={22} />
        </button>
      </div>
    </header>
  );
}
