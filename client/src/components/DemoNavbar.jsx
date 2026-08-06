import React from 'react';
import { Smartphone, Mail, ShieldCheck, Users, UserPlus, MessageSquare, CheckCircle2 } from 'lucide-react';

export default function DemoNavbar({ currentScreen, onSelectScreen }) {
  const screens = [
    { id: 'screen1', label: 'Screen 1: Sign In (Phone)', icon: Smartphone },
    { id: 'screen2', label: 'Screen 2: Phone OTP', icon: ShieldCheck },
    { id: 'screen3', label: 'Screen 3: Sign In (Email)', icon: Mail },
    { id: 'screen6', label: 'Screen 6: Email OTP', icon: CheckCircle2 },
    { id: 'screen4', label: 'Screen 4: Manage Students', icon: Users },
    { id: 'screen5', label: 'Screen 5: Create Student', icon: UserPlus },
    { id: 'screen7', label: 'Screen 7: Message (Instructor)', icon: MessageSquare },
    { id: 'screen8', label: 'Screen 8: Message (Student)', icon: MessageSquare },
  ];

  return (
    <div className="demo-navbar">
      <div className="demo-title">
        <span>Figma Screen Preview</span>
        <span className="demo-badge">8 Screens Built</span>
      </div>

      <div className="demo-nav-links">
        {screens.map((screen) => {
          const Icon = screen.icon;
          const isActive = currentScreen === screen.id;
          return (
            <button
              key={screen.id}
              className={`demo-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectScreen(screen.id)}
            >
              <Icon size={14} />
              {screen.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
