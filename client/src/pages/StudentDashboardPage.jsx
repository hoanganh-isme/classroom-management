import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, UserCheck, CheckCircle2, Clock, Calendar, LogOut, Save, RefreshCw, Phone, Mail, MapPin } from 'lucide-react';
import { getMyProfile, editProfile, getMyLessons, markLessonDone } from '../api/studentApi';
import { COUNTRY_CODES, parsePhoneInput, formatFullPhone } from '../utils/phoneUtils';

export default function StudentDashboardPage({ onLogout }) {
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'profile'
  const [profile, setProfile] = useState(null);
  const [lessons, setLessons] = useState([]);
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
  const [completingLessonId, setCompletingLessonId] = useState(null);

  const fetchStudentData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [profileRes, lessonsRes] = await Promise.all([
        getMyProfile(),
        getMyLessons(),
      ]);

      if (profileRes.success && profileRes.data?.profile) {
        const p = profileRes.data.profile;
        setProfile(p);
        setName(p.name || '');
        const parsed = parsePhoneInput(p.phone || '');
        setCountryCode(parsed.countryCode);
        setPhoneInput(parsed.inputPhone);
        setEmail(p.email || '');
        setAddress(p.address || '');
      }

      if (lessonsRes.success && lessonsRes.data?.lessons) {
        setLessons(lessonsRes.data.lessons);
      }
    } catch (err) {
      console.error('Failed to load student data:', err);
      setError(err.response?.data?.message || 'Failed to load profile and lessons.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const handleMarkDone = async (lessonId) => {
    setCompletingLessonId(lessonId);
    try {
      const res = await markLessonDone(lessonId);
      if (res.success) {
        setLessons((prev) =>
          prev.map((l) => (l.id === lessonId ? { ...l, status: 'completed', completedAt: new Date().toISOString() } : l))
        );
      }
    } catch (err) {
      console.error('Failed to mark lesson done:', err);
      alert(err.response?.data?.message || 'Failed to complete task.');
    } finally {
      setCompletingLessonId(null);
    }
  };

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
        setTimeout(() => setProfileSuccessMsg(''), 3500);
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
      setProfileErrorMsg(err.response?.data?.message || 'Failed to update profile information.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Top Header Navbar */}
      <header className="top-navbar">
        <div className="navbar-brand">
          <BookOpen color="#1677ff" size={24} />
          <span className="navbar-title">Student Portal</span>
        </div>
        <div className="navbar-user-info" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {profile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="avatar" style={{ backgroundColor: '#1677ff', color: '#fff', fontWeight: 'bold' }}>
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="user-name">{profile.name}</span>
                <span className="user-role" style={{ color: '#1677ff' }}>Student</span>
              </div>
            </div>
          )}
          <button
            onClick={onLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', color: '#475569' }}
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </header>

      <div className="dashboard-main">
        {/* Sidebar Navigation */}
        <aside className="sidebar">
          <ul className="sidebar-nav-list">
            <li className="sidebar-item">
              <button
                className={`sidebar-link ${activeTab === 'tasks' ? 'active' : ''}`}
                onClick={() => setActiveTab('tasks')}
                style={{ width: '100%', border: 'none', textAlign: 'left', background: 'none' }}
              >
                <BookOpen size={18} />
                <span>My Assigned Tasks</span>
              </button>
            </li>
            <li className="sidebar-item">
              <button
                className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
                style={{ width: '100%', border: 'none', textAlign: 'left', background: 'none' }}
              >
                <UserCheck size={18} />
                <span>My Profile</span>
              </button>
            </li>
          </ul>
        </aside>

        {/* Content Container */}
        <main className="content-container" style={{ padding: '24px' }}>
          {error && (
            <div style={{ padding: '12px 16px', marginBottom: '20px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px' }}>
              {error}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1e293b' }}>
                  My Assigned Lessons ({lessons.length})
                </h2>
                <button
                  onClick={fetchStudentData}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
                >
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>

              {isLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#86909c' }}>Loading your tasks...</div>
              ) : lessons.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {lessons.map((lesson) => {
                    const isDone = lesson.status === 'completed';
                    const isCompleting = completingLessonId === lesson.id;
                    return (
                      <div
                        key={lesson.id}
                        style={{
                          backgroundColor: isDone ? '#f8fafc' : '#ffffff',
                          border: `1px solid ${isDone ? '#e2e8f0' : '#cbd5e1'}`,
                          borderRadius: '12px',
                          padding: '18px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: isDone ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
                        }}
                      >
                        <div style={{ flex: 1, paddingRight: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: isDone ? '#64748b' : '#1e293b', textDecoration: isDone ? 'line-through' : 'none' }}>
                              {lesson.title}
                            </h3>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: isDone ? '#dcfce7' : '#fef3c7',
                                color: isDone ? '#166534' : '#92400e',
                              }}
                            >
                              {isDone ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                              {isDone ? 'Done' : 'Pending'}
                            </span>
                          </div>

                          {lesson.description && (
                            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: isDone ? '#94a3b8' : '#475569', lineHeight: '1.4' }}>
                              {lesson.description}
                            </p>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#94a3b8' }}>
                            {lesson.assignedAt && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={13} /> Assigned: {new Date(lesson.assignedAt).toLocaleDateString()}
                              </span>
                            )}
                            {isDone && lesson.completedAt && (
                              <span style={{ color: '#16a34a', fontWeight: 500 }}>
                                Completed: {new Date(lesson.completedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          {!isDone ? (
                            <button
                              onClick={() => handleMarkDone(lesson.id)}
                              disabled={isCompleting}
                              style={{
                                backgroundColor: '#22c55e',
                                color: '#ffffff',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                fontWeight: 600,
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s',
                              }}
                            >
                              <CheckCircle2 size={16} />
                              {isCompleting ? 'Marking...' : 'Done'}
                            </button>
                          ) : (
                            <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={16} /> Completed
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  No assigned tasks found for you yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div className="manage-students-card" style={{ padding: '24px' }}>
                <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                  Edit My Profile
                </h2>

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
                        style={{ width: '95px', flexShrink: 0, padding: '12px 6px' }}
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        disabled={isSavingProfile}
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.dialCode}>
                            {c.flag} {c.dialCode}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        className="form-input"
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
                      style={{ height: '70px', resize: 'vertical' }}
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
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
