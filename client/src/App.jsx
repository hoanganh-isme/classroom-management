import React, { useState, useEffect } from 'react';
import './styles/app.css';
import DemoNavbar from './components/DemoNavbar';
import SignInPhone from './components/auth/SignInPhone';
import PhoneVerification from './components/auth/PhoneVerification';
import SignInEmail from './components/auth/SignInEmail';
import EmailVerification from './components/auth/EmailVerification';
import StudentSetupAccount from './components/auth/StudentSetupAccount';
import StudentLogin from './components/auth/StudentLogin';
import DashboardPage from './pages/DashboardPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import { getUserRole } from './utils/authUtils';

function App() {
  const [currentScreen, setCurrentScreen] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const path = window.location.pathname;

    if (token || path.includes('/student/setup-account')) {
      return 'screen9';
    }

    const role = getUserRole();
    if (role === 'student') return 'screen11';
    if (role === 'instructor') return 'screen4';

    return 'screen1';
  });

  const [authPhone, setAuthPhone] = useState('+84818528799');
  const [setupToken, setSetupToken] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token') || '';
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const path = window.location.pathname;

    if (token || path.includes('/student/setup-account')) {
      setSetupToken(token || '');
      setCurrentScreen('screen9');
    }
  }, []);

  const handleAuthSuccess = (authData) => {
    const role = getUserRole(authData);

    if (role === 'student') {
      setCurrentScreen('screen11');
    } else if (role === 'instructor') {
      setCurrentScreen('screen4');
    } else {
      setCurrentScreen('screen1');
    }
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentScreen('screen1');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  return (
    <div className="app-main-wrapper">
      {/* Figma Screen Selector Header Bar */}
      <DemoNavbar
        currentScreen={currentScreen}
        onSelectScreen={setCurrentScreen}
      />

      {/* Screen 1: Sign In (Phone) */}
      {currentScreen === 'screen1' && (
        <div className="auth-page-container">
          <SignInPhone
            onNext={(phone) => {
              setAuthPhone(phone);
              setCurrentScreen('screen2');
            }}
            onSwitchToEmail={() => setCurrentScreen('screen3')}
            onBack={() => setCurrentScreen('screen3')}
          />
        </div>
      )}

      {/* Screen 2: Phone Verification (OTP) */}
      {currentScreen === 'screen2' && (
        <div className="auth-page-container">
          <PhoneVerification
            phoneNumber={authPhone}
            onBack={() => setCurrentScreen('screen1')}
            onSubmitCode={(authData) => {
              handleAuthSuccess(authData);
            }}
          />
        </div>
      )}

      {/* Screen 3: Sign In (Email) */}
      {currentScreen === 'screen3' && (
        <div className="auth-page-container">
          <SignInEmail
            onNext={(email) => {
              setCurrentScreen('screen6');
            }}
            onSwitchToPhone={() => setCurrentScreen('screen1')}
            onBack={() => setCurrentScreen('screen1')}
          />
        </div>
      )}

      {/* Screen 6: Email Verification (OTP - Frame 14) */}
      {currentScreen === 'screen6' && (
        <div className="auth-page-container">
          <EmailVerification
            onBack={() => setCurrentScreen('screen3')}
            onSubmitCode={(authData) => {
              handleAuthSuccess(authData);
            }}
          />
        </div>
      )}

      {/* Screen 4: Manage Students (Instructor View) */}
      {currentScreen === 'screen4' && (
        <DashboardPage forceOpenCreateModal={false} initialTab="students" role="instructor" />
      )}

      {/* Screen 5: Create Student Modal over Manage Students */}
      {currentScreen === 'screen5' && (
        <DashboardPage forceOpenCreateModal={true} initialTab="students" role="instructor" />
      )}

      {/* Screen 9: Student Account Setup (from Email Link) */}
      {currentScreen === 'screen9' && (
        <div className="auth-page-container">
          <StudentSetupAccount
            initialToken={setupToken}
            onNavigateToLogin={() => setCurrentScreen('screen10')}
          />
        </div>
      )}

      {/* Screen 10: Student Login (Username & Password) */}
      {currentScreen === 'screen10' && (
        <div className="auth-page-container">
          <StudentLogin
            onLoginSuccess={(user) => handleAuthSuccess({ user })}
            onSwitchToInstructorLogin={() => setCurrentScreen('screen1')}
          />
        </div>
      )}

      {/* Screen 11: Student Dashboard (Tasks Done & Profile Edit) */}
      {currentScreen === 'screen11' && (
        <StudentDashboardPage onLogout={() => setCurrentScreen('screen10')} />
      )}
    </div>
  );
}

export default App;