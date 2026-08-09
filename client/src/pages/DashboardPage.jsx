import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/dashboard/Navbar';
import Sidebar from '../components/dashboard/Sidebar';
import ManageStudents from '../components/dashboard/ManageStudents';
import ManageLessons from '../components/dashboard/ManageLessons';
import Messages from '../components/dashboard/Messages';
import StudentProfileTab from '../components/dashboard/StudentProfileTab';
import { getMyProfile } from '../api/studentApi';
import { connectSocket } from '../socket/socketClient';

export default function DashboardPage({
  forceOpenCreateModal = false,
  initialTab,
  role = 'instructor',
  onLogout,
}) {
  const isInstructor = role === 'instructor';
  const defaultTab = initialTab || (isInstructor ? 'students' : 'lessons');

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [userProfile, setUserProfile] = useState(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    } else {
      setActiveTab(isInstructor ? 'students' : 'lessons');
    }
  }, [initialTab, isInstructor]);

  const loadUserProfile = useCallback(async () => {
    if (role === 'student') {
      try {
        const res = await getMyProfile();
        if (res.success && res.data?.profile) {
          setUserProfile(res.data.profile);
        }
      } catch (err) {
        console.warn('Could not fetch student profile for navbar:', err);
      }
    }
  }, [role]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const handleUnreadCountUpdate = useCallback((count) => {
    setTotalUnreadCount(count);
  }, []);

  // Sync unread messages count when not on message tab or on mount
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;

    const refreshUnreadCount = () => {
      socket.emit('chat:list', (res) => {
        if (res && res.success && Array.isArray(res.data?.conversations)) {
          const sum = res.data.conversations.reduce(
            (acc, conv) => acc + (conv.unreadCount || 0),
            0
          );
          setTotalUnreadCount(sum);
        }
      });
    };

    refreshUnreadCount();

    const handleNewMessage = () => {
      refreshUnreadCount();
    };

    const handleReadStatus = () => {
      refreshUnreadCount();
    };

    socket.on('chat:message', handleNewMessage);
    socket.on('chat:read_status', handleReadStatus);

    return () => {
      socket.off('chat:message', handleNewMessage);
      socket.off('chat:read_status', handleReadStatus);
    };
  }, []);

  return (
    <div className="dashboard-layout">
      <Navbar onLogout={onLogout} user={userProfile} role={role} />
      <div className="dashboard-main">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          role={role}
          unreadCount={totalUnreadCount}
        />
        <main className="content-container">
          {activeTab === 'students' && isInstructor && (
            <ManageStudents forceOpenCreateModal={forceOpenCreateModal} onLogout={onLogout} />
          )}

          {activeTab === 'lessons' && (
            <ManageLessons role={role} />
          )}

          {activeTab === 'profile' && !isInstructor && (
            <StudentProfileTab onProfileUpdated={(updated) => setUserProfile(updated)} />
          )}

          {activeTab === 'message' && (
            <Messages
              role={role}
              onUnreadCountUpdate={handleUnreadCountUpdate}
            />
          )}
        </main>
      </div>
    </div>
  );
}
