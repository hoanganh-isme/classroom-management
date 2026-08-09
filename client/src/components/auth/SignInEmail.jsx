import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { createAccessCode } from '../../api/authApi';

export default function SignInEmail({ onNext, onSwitchToPhone, onBack }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createAccessCode(email.trim());
      if (onNext) {
        onNext(email.trim());
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to send verification email. Please check your email.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-card">
      <button 
        type="button" 
        className="auth-back-btn" 
        onClick={onBack || (() => window.history.back())}
      >
        <ArrowLeft size={18} /> Back
      </button>

      <div className="auth-header">
        <h1 className="auth-title">Sign In</h1>
        <p className="auth-subtitle">Please enter your email to sign in</p>
      </div>

      {errorMessage && (
        <div style={{ padding: '8px 12px', marginBottom: '12px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '6px', fontSize: '14px', textAlign: 'center' }}>
          {errorMessage}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="email"
            className="form-input"
            placeholder="Your Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        {onSwitchToPhone && (
          <div 
            className="switch-auth-method" 
            onClick={onSwitchToPhone}
          >
            Or sign in with Phone instead
          </div>
        )}

        <button type="submit" className="auth-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Sending OTP Code...' : 'Next'}
        </button>

        <p className="auth-caption">passwordless authentication methods.</p>
      </form>

      <div className="auth-footer-link">
        Don't having account? <a href="#signup" onClick={(e) => e.preventDefault()}>Sign up</a>
      </div>
    </div>
  );
}
