import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function SignInEmail({ onNext, onSwitchToPhone, onBack }) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onNext) {
      onNext(email);
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

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="email"
            className="form-input"
            placeholder="Your Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
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

        <button type="submit" className="auth-btn">
          Next
        </button>

        <p className="auth-caption">passwordless authentication methods.</p>
      </form>

      <div className="auth-footer-link">
        Don't having account? <a href="#signup" onClick={(e) => e.preventDefault()}>Sign up</a>
      </div>
    </div>
  );
}
