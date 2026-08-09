import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, LogOut, BookOpen, CheckCircle2, Clock, X, CheckCheck } from 'lucide-react';
import { clearAuthSession } from '../../utils/authUtils';
import { getMyLessons } from '../../api/studentApi';
import { getLessons as getInstructorLessons } from '../../api/instructorApi';

export default function Navbar({ onLogout, user, role = 'instructor' }) {
  const isStudent = role === 'student';
  const roleDisplayName = isStudent ? 'Student' : 'Instructor';
  const displayName = user?.name || (isStudent ? 'Student' : 'Instructor');
  const avatarInitial = displayName.charAt(0).toUpperCase();

  const [isOpenNotifications, setIsOpenNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const popoverRef = useRef(null);

  // Close notification popover on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpenNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch real notifications based on user role and assigned tasks
  const fetchNotifications = useCallback(async () => {
    setIsLoadingNotifications(true);
    try {
      if (isStudent) {
        const res = await getMyLessons();
        if (res.success && Array.isArray(res.data?.lessons)) {
          const fetchedLessons = res.data.lessons;
          const items = fetchedLessons.map((lesson) => {
            const instructorName = lesson.instructorName || 'Instructor';
            return {
              id: `notif_${lesson.id}`,
              lessonId: lesson.id,
              type: 'lesson_assigned',
              message: `${instructorName} assigned lesson "${lesson.title}" to you`,
              time: lesson.assignedAt || new Date().toISOString(),
              isCompleted: lesson.status === 'completed',
              isRead: false,
            };
          });
          setNotifications(items);
          setUnreadCount(items.length);
        }
      } else {
        const res = await getInstructorLessons();
        if (res.success && Array.isArray(res.data?.lessons)) {
          const fetchedLessons = res.data.lessons;
          const completedLessons = fetchedLessons.filter((l) => l.status === 'completed');
          const items = completedLessons.map((lesson) => ({
            id: `notif_${lesson.id}`,
            lessonId: lesson.id,
            type: 'lesson_completed',
            message: `Student ${lesson.studentName || 'Student'} completed lesson "${lesson.title}"`,
            time: lesson.completedAt || lesson.assignedAt || new Date().toISOString(),
            isCompleted: true,
            isRead: false,
          }));
          setNotifications(items);
          setUnreadCount(items.length);
        }
      }
    } catch (err) {
      console.warn('Could not load notifications:', err);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [isStudent]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleToggleNotifications = () => {
    setIsOpenNotifications((prev) => !prev);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleLogout = () => {
    clearAuthSession();
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} mins ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      return `${diffDays} days ago`;
    } catch {
      return '';
    }
  };

  return (
    <header className="top-navbar">
      <div className="navbar-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: isStudent ? '#059669' : '#1677ff',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isStudent
                ? '0 2px 6px rgba(5, 150, 105, 0.3)'
                : '0 2px 6px rgba(22, 119, 255, 0.3)'
            }}
          >
            <BookOpen size={20} />
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: '17px',
              color: '#1e293b',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.3px'
            }}
          >
            {isStudent ? 'Student Portal' : 'Classroom System'}
          </span>
        </div>
      </div>

      <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
        <div ref={popoverRef} style={{ position: 'relative' }}>
          <button
            className="notification-btn"
            title="Notifications"
            onClick={handleToggleNotifications}
            style={{ position: 'relative', cursor: 'pointer' }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {isOpenNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '46px',
                right: '0',
                width: '340px',
                maxHeight: '420px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#f8fafc',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={16} color="#1677ff" />
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>
                    Notifications ({notifications.length})
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1677ff',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Mark all as read"
                    >
                      <CheckCheck size={14} />
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpenNotifications(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', maxHeight: '340px' }}>
                {isLoadingNotifications ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    No new notifications.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        backgroundColor: item.isRead ? '#ffffff' : '#f0f9ff',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: item.isCompleted ? '#dcfce7' : '#e0f2fe',
                          color: item.isCompleted ? '#16a34a' : '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        {item.isCompleted ? <CheckCircle2 size={18} /> : <BookOpen size={18} />}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '13px',
                            color: '#1e293b',
                            fontWeight: item.isRead ? 400 : 600,
                            lineHeight: '1.4',
                          }}
                        >
                          {item.message}
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            color: '#94a3b8',
                            marginTop: '4px',
                          }}
                        >
                          <Clock size={11} />
                          <span>{formatRelativeTime(item.time)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="user-profile-badge" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            className="user-avatar-circle"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: isStudent ? '#059669' : '#1677ff',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
            }}
          >
            {avatarInitial}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
            <span style={{ fontWeight: 600, fontSize: '13.5px', color: '#1e293b' }}>
              {displayName}
            </span>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: isStudent ? '#059669' : '#1677ff' }}>
              {roleDisplayName}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Log Out"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#ef4444',
            fontWeight: 600,
            transition: 'all 0.2s',
            marginLeft: '4px'
          }}
        >
          <LogOut size={15} /> Logout
        </button>
      </div>
    </header>
  );
}
