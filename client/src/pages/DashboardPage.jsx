import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/dashboard/Navbar';
import Sidebar from '../components/dashboard/Sidebar';
import ManageStudents from '../components/dashboard/ManageStudents';
import ManageLessons from '../components/dashboard/ManageLessons';
import Messages from '../components/dashboard/Messages';
import StudentProfileTab from '../components/dashboard/StudentProfileTab';
import { getMyProfile } from '../api/studentApi';

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

  return (
    <div className="dashboard-layout">
      <Navbar onLogout={onLogout} user={userProfile} role={role} />
      <div className="dashboard-main">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} role={role} />
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
            <Messages role={role} />
          )}
        </main>
      </div>
    </div>
  );
}
