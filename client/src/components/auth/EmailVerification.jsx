import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function EmailVerification({ onBack, onSubmitCode }) {
  const [code, setCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmitCode) {
      onSubmitCode(code);
    }
  };

  return (
    <div className="auth-card">
      <button 
        type="button" 
        className="auth-back-btn" 
        onClick={onBack}
      >
        <ArrowLeft size={18} /> Back
      </button>

      <div className="auth-header">
        <h1 className="auth-title">Email verification</h1>
        <p className="auth-subtitle">Please enter your code that send to your email address</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            className="form-input"
            placeholder="Enter Your code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="auth-btn">
          Submit
        </button>
      </form>

      <div className="auth-footer-link">
        Code not receive? <a href="#resend" onClick={(e) => { e.preventDefault(); alert("Verification code resent to your email!"); }}>Send again</a>
      </div>
    </div>
  );
}
