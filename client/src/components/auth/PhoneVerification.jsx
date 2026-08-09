import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { firebasePhoneLogin } from '../../api/authApi';
import { saveAuthSession } from '../../utils/authUtils';
import {
  confirmPhoneVerificationCode,
  sendPhoneVerificationCode,
} from '../../services/firebasePhoneAuth.service';

export default function PhoneVerification({ phoneNumber, onBack, onSubmitCode }) {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer = null;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldown]);

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
      // 1. Confirm code with Firebase Web SDK
      const firebaseUser = await confirmPhoneVerificationCode(code.trim());

      // 2. Retrieve Firebase ID Token (proof of phone identity)
      const firebaseIdToken = await firebaseUser.getIdToken();

      // 3. Exchange Firebase ID Token with Backend for Application JWT
      const res = await firebasePhoneLogin(firebaseIdToken);

      if (res.success && res.data?.token) {
        // Save Application JWT to localStorage
        saveAuthSession(res.data);
        if (onSubmitCode) {
          onSubmitCode(res.data);
        }
      }
    } catch (err) {
      setErrorMessage(
        err.message || err.response?.data?.message || 'Invalid verification code. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!phoneNumber || cooldown > 0) return;
    setErrorMessage('');
    setInfoMessage('');

    try {
      await sendPhoneVerificationCode(phoneNumber);
      setInfoMessage('A new verification code has been sent to your phone!');
      setCooldown(60);
    } catch (err) {
      setErrorMessage(
        err.message || err.response?.data?.message || 'Failed to resend verification code.'
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

        {/* Container element for reCAPTCHA if resend is triggered from this screen */}
        <div id="recaptcha-container"></div>

        <button type="submit" className="auth-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Verifying...' : 'Submit'}
        </button>
      </form>

      <div className="auth-footer-link">
        Code not received?{' '}
        {cooldown > 0 ? (
          <span style={{ color: '#86909c' }}>Resend in {cooldown}s</span>
        ) : (
          <a href="#resend" onClick={handleResend}>Send again</a>
        )}
      </div>
    </div>
  );
}
