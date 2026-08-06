import React, { useState, useEffect } from 'react';
import Navbar from '../components/dashboard/Navbar';
import Sidebar from '../components/dashboard/Sidebar';
import ManageStudents from '../components/dashboard/ManageStudents';
import ManageLessons from '../components/dashboard/ManageLessons';
import Messages from '../components/dashboard/Messages';

export default function DashboardPage({
  forceOpenCreateModal = false,
  initialTab = 'students',
  role = 'instructor',
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-main">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} role={role} />
        <main className="content-container">
          {activeTab === 'students' && (
            <ManageStudents forceOpenCreateModal={forceOpenCreateModal} />
          )}
          {activeTab === 'lessons' && <ManageLessons />}
          {activeTab === 'message' && <Messages role={role} />}
        </main>
      </div>
    </div>
  );
}
