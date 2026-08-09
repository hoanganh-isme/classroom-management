import React from 'react';
import { BookOpen, MessageSquare, Users, User } from 'lucide-react';

export default function Sidebar({ activeTab = 'students', onSelectTab, role = 'instructor' }) {
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
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
