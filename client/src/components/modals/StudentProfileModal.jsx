import React, { useState, useEffect } from 'react';
import { X, BookOpen, Calendar, User, Phone, Mail, MapPin, CheckCircle, Clock } from 'lucide-react';
import { getStudent } from '../../api/instructorApi';

export default function StudentProfileModal({ isOpen, onClose, student }) {
  const [profileData, setProfileData] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && student && student.phone) {
      setIsLoading(true);
      setError('');
      getStudent(student.phone)
        .then((res) => {
          if (res.success && res.data) {
            setProfileData(res.data.student || student);
            setLessons(res.data.lessons || []);
          } else {
            setProfileData(student);
          }
        })
        .catch((err) => {
          console.error('Failed to load student profile:', err);
          setError(err.response?.data?.message || 'Failed to load profile details.');
          setProfileData(student);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  const currentStudent = profileData || student;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Student Profile</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{ padding: '8px 12px', marginBottom: '12px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '6px', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {/* Student General Information Card */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#1677ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                {currentStudent.name ? currentStudent.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>{currentStudent.name}</h3>
                <span className={`status-badge ${(currentStudent.status || 'active').toLowerCase()}`} style={{ display: 'inline-block', marginTop: '4px' }}>
                  {currentStudent.status ? currentStudent.status.toUpperCase() : 'ACTIVE'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px', color: '#475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={15} color="#64748b" />
                <span><strong>Phone:</strong> {currentStudent.phone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={15} color="#64748b" />
                <span><strong>Email:</strong> {currentStudent.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={15} color="#64748b" />
                <span><strong>Role:</strong> {currentStudent.role || 'Student'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} color="#64748b" />
                <span><strong>Address:</strong> {currentStudent.address || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Assigned Lessons Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={18} color="#1677ff" />
                Assigned Lessons & Current Statuses ({lessons.length})
              </h4>
            </div>

            {isLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Loading lessons...</div>
            ) : lessons.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                {lessons.map((lesson) => {
                  const isCompleted = lesson.status === 'completed';
                  return (
                    <div
                      key={lesson.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: isCompleted ? '#f0fdf4' : '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>{lesson.title}</span>
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
                          {isCompleted ? <CheckCircle size={12} /> : <Clock size={12} />}
                          {isCompleted ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                      {lesson.description && (
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{lesson.description}</p>
                      )}
                      {lesson.assignedAt && (
                        <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} />
                          <span>Assigned: {new Date(lesson.assignedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                No lessons assigned to this student yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
