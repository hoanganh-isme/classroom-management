import React, { useState, useEffect, useCallback } from 'react';
import { UserCheck, Save, CheckCircle2, Lock, ShieldCheck, Key } from 'lucide-react';
import { getMyProfile, editProfile, changePassword } from '../../api/studentApi';
import { COUNTRY_CODES, parsePhoneInput, formatFullPhone } from '../../utils/phoneUtils';

export default function StudentProfileTab({ onProfileUpdated }) {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Profile Form state
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+84');
  const [phoneInput, setPhoneInput] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await getMyProfile();
      if (res.success && res.data?.profile) {
        const p = res.data.profile;
        setProfile(p);
        setName(p.name || '');
        const parsed = parsePhoneInput(p.phone || '');
        setCountryCode(parsed.countryCode);
        setPhoneInput(parsed.phoneInput);
        setEmail(p.email || '');
        setAddress(p.address || '');
      }
    } catch (err) {
      console.error('Failed to load student profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    if (!name.trim() || name.trim().length < 2) {
      setProfileErrorMsg('Name must contain at least 2 characters.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const fullPhone = formatFullPhone(countryCode, phoneInput);
      const payload = {
        name: name.trim(),
        phone: fullPhone,
        email: email.trim(),
        address: address.trim(),
      };

      const res = await editProfile(payload);
      if (res.success && res.data?.profile) {
        setProfile(res.data.profile);
        setProfileSuccessMsg('Profile updated successfully!');
        if (onProfileUpdated) {
          onProfileUpdated(res.data.profile);
        }
        setTimeout(() => setProfileSuccessMsg(''), 3500);
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
      setProfileErrorMsg(err.response?.data?.message || 'Failed to update profile information.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccessMsg('');
    setPasswordErrorMsg('');

    if (!currentPassword) {
      setPasswordErrorMsg('Current password is required.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setPasswordErrorMsg('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('New password and confirm password do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changePassword({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        setPasswordSuccessMsg('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to change password:', err);
      setPasswordErrorMsg(err.response?.data?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#86909c' }}>Loading profile...</div>;
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="page-title" style={{ margin: 0 }}>My Profile</h1>
      </div>

      {/* Edit Profile Card */}
      <div className="manage-students-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
          <UserCheck size={22} color="#1677ff" />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>
            Edit Profile Information
          </h2>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', marginBottom: '16px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '6px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {profileSuccessMsg && (
          <div style={{ padding: '10px 14px', marginBottom: '16px', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} />
            <span>{profileSuccessMsg}</span>
          </div>
        )}

        {profileErrorMsg && (
          <div style={{ padding: '10px 14px', marginBottom: '16px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '6px', fontSize: '13px' }}>
            {profileErrorMsg}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="auth-form">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSavingProfile}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                className="form-input"
                style={{ width: '100px', flexShrink: 0, padding: '10px 4px' }}
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                disabled={isSavingProfile}
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                className="form-input"
                style={{ flex: 1 }}
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                disabled={isSavingProfile}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSavingProfile}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              className="form-input"
              style={{ height: '80px', resize: 'vertical' }}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isSavingProfile}
            />
          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={isSavingProfile}
            style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Save size={16} />
            {isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="manage-students-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
          <Key size={22} color="#1677ff" />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>
            Change Password
          </h2>
        </div>

        {passwordSuccessMsg && (
          <div style={{ padding: '10px 14px', marginBottom: '16px', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} />
            <span>{passwordSuccessMsg}</span>
          </div>
        )}

        {passwordErrorMsg && (
          <div style={{ padding: '10px 14px', marginBottom: '16px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '6px', fontSize: '13px' }}>
            {passwordErrorMsg}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="auth-form">
          <div className="form-group">
            <label className="form-label">Current Password *</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isChangingPassword}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">New Password *</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isChangingPassword}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password *</label>
            <div style={{ position: 'relative' }}>
              <ShieldCheck size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isChangingPassword}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={isChangingPassword}
            style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Key size={16} />
            {isChangingPassword ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
