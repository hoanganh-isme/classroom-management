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
import { getUserRole, clearAuthSession } from './utils/authUtils';

/**
 * Role-based Screen Guard rule.
 * @param {string} screenId 
 * @param {string|null} role 
 * @returns {boolean}
 */
export function canAccessScreen(screenId, role) {
  const publicScreens = ['screen1', 'screen2', 'screen3', 'screen6', 'screen9', 'screen10'];
  const instructorScreens = ['screen4', 'screen5'];
  const studentScreens = ['screen11'];

  if (publicScreens.includes(screenId)) {
    return true;
  }

  if (instructorScreens.includes(screenId)) {
    return role === 'instructor';
  }

  if (studentScreens.includes(screenId)) {
    return role === 'student';
  }

  return false;
}

function App() {
  const [userRole, setUserRole] = useState(() => getUserRole());

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

    if (path.includes('/student')) {
      return 'screen10';
    }

    return 'screen1';
  });

  const [authPhone, setAuthPhone] = useState('+84818528799');
  const [authEmail, setAuthEmail] = useState('');
  const [setupToken, setSetupToken] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token') || '';
  });

  const showDemoNavbar = import.meta.env.VITE_SHOW_DEMO_NAV === 'true';

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const path = window.location.pathname;

    if (token || path.includes('/student/setup-account')) {
      setSetupToken(token || '');
      setCurrentScreen('screen9');
    } else if (path.includes('/student') && !getUserRole()) {
      setCurrentScreen('screen10');
    }
  }, []);

  const handleSelectScreen = (screenId) => {
    const activeRole = getUserRole();
    setUserRole(activeRole);

    if (canAccessScreen(screenId, activeRole)) {
      setCurrentScreen(screenId);
    } else {
      if (activeRole === 'instructor') {
        setCurrentScreen('screen4');
      } else if (activeRole === 'student') {
        setCurrentScreen('screen11');
      } else {
        setCurrentScreen('screen1');
      }
    }
  };

  const handleAuthSuccess = (authData) => {
    const role = getUserRole(authData);
    setUserRole(role);

    if (role === 'student') {
      const user = authData?.user;
      // If student has not set up username/password yet, direct to setup screen
      if (user && user.accountSetupComplete === false) {
        setCurrentScreen('screen9');
      } else {
        setCurrentScreen('screen11');
      }
    } else if (role === 'instructor') {
      setCurrentScreen('screen4');
    } else {
      setCurrentScreen('screen1');
    }
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuthSession();
      setUserRole(null);
      if (window.location.pathname.includes('/student')) {
        setCurrentScreen('screen10');
      } else {
        setCurrentScreen('screen1');
      }
    };

    const handleForbidden = () => {
      const activeRole = getUserRole();
      setUserRole(activeRole);
      if (activeRole === 'student') {
        setCurrentScreen('screen11');
      } else if (activeRole === 'instructor') {
        setCurrentScreen('screen4');
      } else {
        if (window.location.pathname.includes('/student')) {
          setCurrentScreen('screen10');
        } else {
          setCurrentScreen('screen1');
        }
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('auth:forbidden', handleForbidden);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('auth:forbidden', handleForbidden);
    };
  }, []);

  return (
    <div className="app-main-wrapper">
      {/* Conditionally render DemoNavbar based on VITE_SHOW_DEMO_NAV */}
      {showDemoNavbar && (
        <DemoNavbar
          currentScreen={currentScreen}
          onSelectScreen={handleSelectScreen}
          canAccessScreen={canAccessScreen}
          userRole={userRole}
        />
      )}

      {/* Screen 1: Sign In (Phone) */}
      {currentScreen === 'screen1' && (
        <div className="auth-page-container">
          <SignInPhone
            onNext={(phone) => {
              setAuthPhone(phone);
              handleSelectScreen('screen2');
            }}
            onSwitchToEmail={() => handleSelectScreen('screen3')}
            onBack={() => handleSelectScreen('screen10')}
          />
        </div>
      )}

      {/* Screen 2: Phone Verification (OTP) */}
      {currentScreen === 'screen2' && (
        <div className="auth-page-container">
          <PhoneVerification
            phoneNumber={authPhone}
            onBack={() => handleSelectScreen('screen1')}
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
              setAuthEmail(email);
              handleSelectScreen('screen6');
            }}
            onSwitchToPhone={() => handleSelectScreen('screen1')}
            onBack={() => handleSelectScreen('screen10')}
          />
        </div>
      )}

      {/* Screen 6: Email Verification (OTP - Frame 14) */}
      {currentScreen === 'screen6' && (
        <div className="auth-page-container">
          <EmailVerification
            email={authEmail}
            onBack={() => handleSelectScreen('screen3')}
            onSubmitCode={(authData) => {
              handleAuthSuccess(authData);
            }}
          />
        </div>
      )}

      {/* Screen 4: Manage Students (Instructor View) */}
      {currentScreen === 'screen4' && canAccessScreen('screen4', userRole) && (
        <DashboardPage
          forceOpenCreateModal={false}
          initialTab="students"
          role="instructor"
          onLogout={() => {
            setUserRole(null);
            handleSelectScreen('screen1');
          }}
        />
      )}

      {/* Screen 5: Create Student Modal over Manage Students */}
      {currentScreen === 'screen5' && canAccessScreen('screen5', userRole) && (
        <DashboardPage
          forceOpenCreateModal={true}
          initialTab="students"
          role="instructor"
          onLogout={() => {
            setUserRole(null);
            handleSelectScreen('screen1');
          }}
        />
      )}

      {/* Screen 9: Student Account Setup (from Email Link) */}
      {currentScreen === 'screen9' && (
        <div className="auth-page-container">
          <StudentSetupAccount
            initialToken={setupToken}
            onNavigateToLogin={() => handleSelectScreen('screen10')}
          />
        </div>
      )}

      {/* Screen 10: Student Login (Username & Password) */}
      {currentScreen === 'screen10' && (
        <div className="auth-page-container">
          <StudentLogin
            onLoginSuccess={(authData) => handleAuthSuccess(authData)}
            onSwitchToInstructorLogin={() => handleSelectScreen('screen1')}
          />
        </div>
      )}

      {/* Screen 11: Student Dashboard (Tasks Done & Profile Edit) */}
      {currentScreen === 'screen11' && canAccessScreen('screen11', userRole) && (
        <DashboardPage
          role="student"
          initialTab="lessons"
          onLogout={() => {
            setUserRole(null);
            handleSelectScreen('screen10');
          }}
        />
      )}
    </div>
  );
}

export default App;