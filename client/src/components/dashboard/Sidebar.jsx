import React from 'react';
import { BookOpen, MessageSquare, Users, User } from 'lucide-react';

export default function Sidebar({ activeTab = 'students', onSelectTab, role = 'instructor', unreadCount = 0 }) {
  const isInstructor = role === 'instructor';

  const items = isInstructor
    ? [
        { id: 'students', label: 'Manage Students', icon: Users },
        { id: 'lessons', label: 'Manage Lessons', icon: BookOpen },
        { id: 'message', label: 'Message', icon: MessageSquare },
      ]
    : [
        { id: 'lessons', label: 'My Assigned Tasks', icon: BookOpen },
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'message', label: 'Message', icon: MessageSquare },
      ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div
              key={item.id}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab && onSelectTab(item.id)}
              style={{ position: 'relative' }}
            >
              <Icon size={18} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.id === 'message' && unreadCount > 0 && (
                <span className="sidebar-unread-badge">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
