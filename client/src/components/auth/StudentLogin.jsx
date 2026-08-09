import React, { useState } from 'react';
import { LogIn, User, Lock, ArrowRight } from 'lucide-react';
import { studentLogin } from '../../api/studentApi';

export default function StudentLogin({ onLoginSuccess, onSwitchToInstructorLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await studentLogin({
        username: username.trim(),
        password,
      });

      if (res.success && res.data) {
        localStorage.setItem('token', res.data.token);
        if (onLoginSuccess) {
          onLoginSuccess(res.data.user);
        }
      } else {
        setError(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Student login error:', err);
      setError(err.response?.data?.message || 'Invalid username or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-card" style={{ maxWidth: '420px', margin: '40px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#e6f4ff', color: '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <LogIn size={28} />
        </div>
        <h1 className="auth-title">Student Portal Sign In</h1>
        <p className="auth-subtitle">Log in using your student username and password.</p>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', marginBottom: '16px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '6px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Username</label>
          <div style={{ position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="password"
              className="form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
        </div>

        <button type="submit" className="auth-btn" disabled={isSubmitting} style={{ marginTop: '8px' }}>
          {isSubmitting ? 'Signing In...' : 'Sign In to Student Portal'}
          {!isSubmitting && <ArrowRight size={16} />}
        </button>
      </form>

      {onSwitchToInstructorLogin && (
        <div className="auth-footer-link" style={{ marginTop: '20px' }}>
          <span>Are you an instructor? </span>
          <a onClick={onSwitchToInstructorLogin}>Sign in via Phone OTP</a>
        </div>
      )}
    </div>
  );
}
