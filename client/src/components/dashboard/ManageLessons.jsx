import React, { useState, useEffect, useCallback } from 'react';
import { Plus, BookOpen, Clock, RefreshCw, CheckCircle2, User, Calendar } from 'lucide-react';
import AssignLessonModal from '../modals/AssignLessonModal';
import { getStudents, getLessons } from '../../api/instructorApi';

export default function ManageLessons() {
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignedSuccessMessage, setAssignedSuccessMessage] = useState('');

  const fetchLessonsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [studentsRes, lessonsRes] = await Promise.all([
        getStudents(),
        getLessons(),
      ]);

      if (studentsRes.success && studentsRes.data) {
        setStudents(studentsRes.data.students || []);
      }
      if (lessonsRes.success && lessonsRes.data) {
        setLessons(lessonsRes.data.lessons || []);
      }
    } catch (err) {
      console.error('Failed to load lessons data:', err);
      setError(err.response?.data?.message || 'Failed to load lessons.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLessonsData();
  }, [fetchLessonsData]);

  const handleLessonAssigned = (data) => {
    const count = data?.assignedCount || 1;
    setAssignedSuccessMessage(`Successfully assigned lesson to ${count} student(s)!`);
    setTimeout(() => {
      setAssignedSuccessMessage('');
    }, 4000);
    fetchLessonsData();
  };

  return (
    <div className="manage-lessons-view">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Manage Lessons</h1>
        <button
          className="btn-add-student"
          style={{ backgroundColor: '#1677ff', color: '#ffffff', borderColor: '#1677ff' }}
          onClick={() => setIsAssignModalOpen(true)}
        >
          <Plus size={16} /> Assign New Lesson
        </button>
      </div>

      {assignedSuccessMessage && (
        <div style={{ padding: '12px 16px', marginBottom: '20px', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #bbf7d0' }}>
          <CheckCircle2 size={18} />
          <span>{assignedSuccessMessage}</span>
        </div>
      )}

      <div className="manage-students-card">
        <div className="card-header-bar">
          <div className="student-count-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} color="#1677ff" />
            <span>All Assigned Lessons Across Students ({lessons.length})</span>
          </div>
          <button
            onClick={fetchLessonsData}
            style={{ background: 'none', border: 'none', color: '#86909c', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#86909c' }}>Loading assigned lessons...</div>
          ) : error ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#dc2626' }}>{error}</div>
          ) : lessons.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {lessons.map((lesson) => {
                const isCompleted = lesson.status === 'completed';
                return (
                  <div
                    key={lesson.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '16px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      justify: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>{lesson.title}</h3>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: isCompleted ? '#dcfce7' : '#fef3c7',
                            color: isCompleted ? '#166534' : '#92400e',
                          }}
                        >
                          {isCompleted ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {isCompleted ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                      {lesson.description && (
                        <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
                          {lesson.description}
                        </p>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#475569' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={13} color="#1677ff" />
                        <span><strong>Student:</strong> {lesson.studentName} ({lesson.studentPhone})</span>
                      </div>
                      {lesson.assignedAt && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                          <Calendar size={13} />
                          <span>Assigned: {new Date(lesson.assignedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#86909c' }}>
              No lessons assigned yet. Click "Assign New Lesson" to assign lessons to students.
            </div>
          )}
        </div>
      </div>

      {/* Modal for Assigning Lesson */}
      <AssignLessonModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        students={students}
        onSuccess={handleLessonAssigned}
      />
    </div>
  );
}
