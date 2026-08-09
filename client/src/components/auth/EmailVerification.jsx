import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { validateAccessCode, createAccessCode } from '../../api/authApi';
import { saveAuthSession } from '../../utils/authUtils';

export default function EmailVerification({ email, onBack, onSubmitCode }) {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendMessage, setResendMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setResendMessage('');

    if (!code.trim() || code.trim().length !== 6) {
      setErrorMessage('Please enter the valid 6-digit access code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await validateAccessCode(email, code.trim());
      if (res.success && res.data?.token) {
        saveAuthSession(res.data);
        if (onSubmitCode) {
          onSubmitCode(res.data);
        }
      } else {
        setErrorMessage(res.message || 'The access code is invalid.');
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Invalid or expired access code.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setResendMessage('');
    try {
      await createAccessCode(email);
      setResendMessage('A new verification code was sent to your email!');
      setTimeout(() => setResendMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to resend code.');
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
        <p className="auth-subtitle">
          Please enter the 6-digit code sent to {email || 'your email'}
        </p>
      </div>

      {errorMessage && (
        <div style={{ padding: '8px 12px', marginBottom: '12px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '6px', fontSize: '14px', textAlign: 'center' }}>
          {errorMessage}
        </div>
      )}

      {resendMessage && (
        <div style={{ padding: '8px 12px', marginBottom: '12px', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '6px', fontSize: '14px', textAlign: 'center' }}>
          {resendMessage}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            className="form-input"
            placeholder="Enter 6-digit code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <button type="submit" className="auth-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Verifying...' : 'Submit'}
        </button>
      </form>

      <div className="auth-footer-link">
        Code not received? <a href="#resend" onClick={handleResend}>Send again</a>
      </div>
    </div>
  );
}
