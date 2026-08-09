import React, { useState, useEffect } from 'react';
import { UserCheck, Lock, User, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { verifyStudentSetupToken, setupStudentAccount } from '../../api/studentApi';

export default function StudentSetupAccount({ initialToken = '', onNavigateToLogin }) {
  const [token, setToken] = useState(initialToken);
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // If no initialToken passed, extract from URL search params
    let effectiveToken = initialToken;
    if (!effectiveToken) {
      const urlParams = new URLSearchParams(window.location.search);
      effectiveToken = urlParams.get('token') || '';
    }
    setToken(effectiveToken);

    if (!effectiveToken) {
      setIsVerifying(false);
      setVerificationError('No setup token provided in link. Please check your invitation email.');
      return;
    }

    setIsVerifying(true);
    setVerificationError('');
    verifyStudentSetupToken(effectiveToken)
      .then((res) => {
        if (res.success && res.data) {
          setStudentInfo(res.data.student);
        } else {
          setVerificationError(res.message || 'Invalid or expired setup token.');
        }
      })
      .catch((err) => {
        console.error('Failed to verify token:', err);
        setVerificationError(err.response?.data?.message || 'This setup link is invalid or has expired.');
      })
      .finally(() => {
        setIsVerifying(false);
      });
  }, [initialToken]);

  const validateForm = () => {
    const errors = {};
    if (!username || username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters.';
    } else if (!/^[a-zA-Z0-9._-]+$/.test(username.trim())) {
      errors.username = 'Username can only contain letters, numbers, dots, dashes, or underscores.';
    }

    if (!password || password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    } else if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      errors.password = 'Password must include uppercase, lowercase, and a number.';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const res = await setupStudentAccount({
        token,
        username: username.trim(),
        password,
      });

      if (res.success) {
        setIsSuccess(true);
      } else {
        setFormError(res.message || 'Failed to set up account.');
      }
    } catch (err) {
      console.error('Setup failed:', err);
      setFormError(err.response?.data?.message || 'An error occurred while setting up your account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-card" style={{ maxWidth: '460px', margin: '40px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#e6f4ff', color: '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <UserCheck size={28} />
        </div>
        <h1 className="auth-title">Setup Student Account</h1>
        <p className="auth-subtitle">Create your username and password to log in to your portal.</p>
      </div>

      {isVerifying ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
          Verifying your invitation link...
        </div>
      ) : verificationError ? (
        <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b' }}>
          <AlertCircle size={32} color="#dc2626" style={{ margin: '0 auto 8px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>Invalid Setup Link</h3>
          <p style={{ margin: 0, fontSize: '13px' }}>{verificationError}</p>
        </div>
      ) : isSuccess ? (
        <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', color: '#166534' }}>
          <CheckCircle2 size={40} color="#16a34a" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 600 }}>Account Setup Complete!</h2>
          <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#374151' }}>
            Your username and password have been configured successfully. You can now log in.
          </p>
          <button
            className="auth-btn"
            onClick={onNavigateToLogin}
            style={{ width: '100%' }}
          >
            Go to Student Login
          </button>
        </div>
      ) : (
        <div>
          {studentInfo && (
            <div style={{ padding: '12px 16px', marginBottom: '20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#475569' }}>
              <div><strong>Student Name:</strong> {studentInfo.name}</div>
              <div><strong>Email:</strong> {studentInfo.email}</div>
            </div>
          )}

          {formError && (
            <div style={{ padding: '10px 14px', marginBottom: '16px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '6px', fontSize: '13px' }}>
              {formError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Desired Username *</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="e.g. john_doe99"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              {fieldErrors.username && (
                <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.username}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">New Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="At least 8 chars (A-z, 0-9)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              {fieldErrors.password && (
                <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.password}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <ShieldCheck size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              {fieldErrors.confirmPassword && (
                <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.confirmPassword}
                </span>
              )}
            </div>

            <button type="submit" className="auth-btn" disabled={isSubmitting} style={{ marginTop: '8px' }}>
              {isSubmitting ? 'Saving Credentials...' : 'Complete Account Setup'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
