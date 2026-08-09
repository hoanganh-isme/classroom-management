import React from 'react';
import { Smartphone, Mail, ShieldCheck, Users, UserPlus, KeyRound, LogIn, GraduationCap, Lock } from 'lucide-react';

export default function DemoNavbar({ currentScreen, onSelectScreen, canAccessScreen, userRole }) {
  const screens = [
    { id: 'screen1', label: 'Screen 1: Sign In (Phone)', icon: Smartphone },
    { id: 'screen2', label: 'Screen 2: Phone OTP', icon: ShieldCheck },
    { id: 'screen3', label: 'Screen 3: Sign In (Email)', icon: Mail },
    { id: 'screen4', label: 'Screen 4: Manage Students', icon: Users, roleRequired: 'instructor' },
    { id: 'screen5', label: 'Screen 5: Create Student Modal', icon: UserPlus, roleRequired: 'instructor' },
    { id: 'screen9', label: 'Student Setup (Email Token)', icon: KeyRound },
    { id: 'screen10', label: 'Student Login', icon: LogIn },
    { id: 'screen11', label: 'Student Dashboard', icon: GraduationCap, roleRequired: 'student' },
  ];

  return (
    <div className="demo-navbar">
      <div className="demo-title">
        <span>Figma Screen Preview</span>
        <span className="demo-badge">Dev Mode Preview</span>
      </div>

      <div className="demo-nav-links">
        {screens.map((screen) => {
          const Icon = screen.icon;
          const isActive = currentScreen === screen.id;
          const isAllowed = canAccessScreen ? canAccessScreen(screen.id, userRole) : true;

          return (
            <button
              key={screen.id}
              className={`demo-btn ${isActive ? 'active' : ''} ${!isAllowed ? 'disabled' : ''}`}
              onClick={() => onSelectScreen(screen.id)}
              title={!isAllowed ? `Requires role: ${screen.roleRequired}` : undefined}
              style={!isAllowed ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
            >
              {!isAllowed ? <Lock size={12} /> : <Icon size={14} />}
              {screen.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
