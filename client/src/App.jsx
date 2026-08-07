import React, { useState } from 'react';
import './styles/app.css';
import DemoNavbar from './components/DemoNavbar';
import SignInPhone from './components/auth/SignInPhone';
import PhoneVerification from './components/auth/PhoneVerification';
import SignInEmail from './components/auth/SignInEmail';
import EmailVerification from './components/auth/EmailVerification';
import DashboardPage from './pages/DashboardPage';

function App() {
  const [currentScreen, setCurrentScreen] = useState('screen1');
  const [authPhone, setAuthPhone] = useState('+84818528799');

  React.useEffect(() => {
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
            onSubmitCode={() => {
              setCurrentScreen('screen4');
            }}
          />
        </div>
      )}

      {/* Screen 3: Sign In (Email) */}
      {currentScreen === 'screen3' && (
        <div className="auth-page-container">
          <SignInEmail
            onNext={(email) => {
              console.log('Email entered:', email);
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
            onSubmitCode={(code) => {
              console.log('Email OTP submitted:', code);
              setCurrentScreen('screen4');
            }}
          />
        </div>
      )}

      {/* Screen 4: Manage Students */}
      {currentScreen === 'screen4' && (
        <DashboardPage forceOpenCreateModal={false} initialTab="students" role="instructor" />
      )}

      {/* Screen 5: Create Student Modal over Manage Students */}
      {currentScreen === 'screen5' && (
        <DashboardPage forceOpenCreateModal={true} initialTab="students" role="instructor" />
      )}

      {/* Screen 7: Messages (Instructor View - Frame 12) */}
      {currentScreen === 'screen7' && (
        <DashboardPage forceOpenCreateModal={false} initialTab="message" role="instructor" />
      )}

      {/* Screen 8: Messages (Student View - Frame 16) */}
      {currentScreen === 'screen8' && (
        <DashboardPage forceOpenCreateModal={false} initialTab="message" role="student" />
      )}
    </div>
  );
}

export default App;