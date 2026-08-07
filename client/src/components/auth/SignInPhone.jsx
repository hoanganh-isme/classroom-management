import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { createAccessCode } from '../../api/authApi';
import { COUNTRY_CODES, formatFullPhone } from '../../utils/phoneUtils';

export default function SignInPhone({ onNext, onSwitchToEmail, onBack }) {
  const [countryCode, setCountryCode] = useState('+84');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const formatted = formatFullPhone(countryCode, phoneNumber);

    setIsSubmitting(true);
    try {
      await createAccessCode(formatted);
      if (onNext) {
        onNext(formatted);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to send OTP code. Please try again.'
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
        <p className="auth-subtitle">Please enter your phone to sign in</p>
      </div>

      {errorMessage && (
        <div style={{ padding: '8px 12px', marginBottom: '12px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '6px', fontSize: '14px', textAlign: 'center' }}>
          {errorMessage}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              className="form-input"
              style={{ width: '95px', flexShrink: 0, paddingRight: '2px' }}
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              disabled={isSubmitting}
            >
              {COUNTRY_CODES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
            <input
              type="tel"
              className="form-input"
              style={{ flex: 1 }}
              placeholder="0818528799"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        {onSwitchToEmail && (
          <div 
            className="switch-auth-method" 
            onClick={onSwitchToEmail}
          >
            Or sign in with Email instead
          </div>
        )}

        <button type="submit" className="auth-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Sending OTP...' : 'Next'}
        </button>

        <p className="auth-caption">passwordless authentication methods.</p>
      </form>

      <div className="auth-footer-link">
        Don't having account? <a href="#signup" onClick={(e) => e.preventDefault()}>Sign up</a>
      </div>
    </div>
  );
}
