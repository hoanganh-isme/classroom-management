import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { validateAccessCode, createAccessCode } from '../../api/authApi';

import { saveAuthSession } from '../../utils/authUtils';

export default function PhoneVerification({ phoneNumber, onBack, onSubmitCode }) {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!phoneNumber) {
      setErrorMessage('Phone number is missing. Please go back and re-enter phone.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await validateAccessCode(phoneNumber, code.trim());
      if (res.success && res.data?.token) {
        saveAuthSession(res.data);
        if (onSubmitCode) {
          onSubmitCode(res.data);
        }
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Invalid access code. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setErrorMessage('');
    setInfoMessage('');
    try {
      await createAccessCode(phoneNumber);
      setInfoMessage('New OTP code has been generated & printed to server console!');
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to resend code.'
      );
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
        <h1 className="auth-title">Phone verification</h1>
        <p className="auth-subtitle">
          Please enter 6-digit code sent to {phoneNumber || 'your phone'}
        </p>
      </div>

      {errorMessage && (
        <div style={{ padding: '8px 12px', marginBottom: '12px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '6px', fontSize: '14px', textAlign: 'center' }}>
          {errorMessage}
        </div>
      )}

      {infoMessage && (
        <div style={{ padding: '8px 12px', marginBottom: '12px', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '6px', fontSize: '14px', textAlign: 'center' }}>
          {infoMessage}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            className="form-input"
            placeholder="Enter 6-digit OTP code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            required
            disabled={isSubmitting}
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
