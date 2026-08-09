import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, RefreshCw, LogOut } from 'lucide-react';
import CreateStudentModal from '../modals/CreateStudentModal';
import EditStudentModal from '../modals/EditStudentModal';
import StudentProfileModal from '../modals/StudentProfileModal';
import { getStudents, deleteStudent } from '../../api/instructorApi';
import { clearAuthSession } from '../../utils/authUtils';

export default function ManageStudents({ forceOpenCreateModal = false, onLogout }) {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingPhone, setDeletingPhone] = useState(null);

  const [filterText, setFilterText] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(forceOpenCreateModal);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);

  const fetchStudentsList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getStudents();
      if (res.success && res.data) {
        setStudents(res.data.students || []);
        setTotal(res.data.total ?? (res.data.students ? res.data.students.length : 0));
      }
    } catch (err) {
      console.error('Error loading students:', err);
      setError(err.response?.data?.message || 'Failed to load students list.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentsList();
  }, [fetchStudentsList]);

  // Sync prop if user explicitly chooses "Screen 5 (Create Student Modal)" from demo bar
  useEffect(() => {
    if (forceOpenCreateModal) {
      setIsCreateModalOpen(true);
    }
  }, [forceOpenCreateModal]);

  const handleAddStudent = (newStudent) => {
    if (newStudent) {
      setStudents((prev) => [newStudent, ...prev.filter((s) => s.id !== newStudent.id && s.phone !== newStudent.phone)]);
      setTotal((prev) => prev + 1);
    } else {
      fetchStudentsList();
    }
  };

  const handleUpdateStudent = (updatedStudent) => {
    if (updatedStudent) {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === updatedStudent.id || (s.phone && s.phone === updatedStudent.phone)
            ? { ...s, ...updatedStudent }
            : s
        )
      );
    } else {
      fetchStudentsList();
    }
  };

  const handleDeleteStudent = async (student) => {
    if (!student || !student.phone) return;
    const confirmMessage = `Are you sure you want to delete student "${student.name}"?`;
    if (!window.confirm(confirmMessage)) return;

    setDeletingPhone(student.phone);
    try {
      await deleteStudent(student.phone);
      setStudents((prev) => prev.filter((s) => s.phone !== student.phone && s.id !== student.id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete student.');
    } finally {
      setDeletingPhone(null);
    }
  };

  const filteredStudents = students.filter((student) => {
    const query = filterText.toLowerCase().trim();
    if (!query) return true;
    const nameMatch = student.name ? student.name.toLowerCase().includes(query) : false;
    const emailMatch = student.email ? student.email.toLowerCase().includes(query) : false;
    const phoneMatch = student.phone ? student.phone.toLowerCase().includes(query) : false;
    return nameMatch || emailMatch || phoneMatch;
  });

  return (
    <div className="manage-students-view">
      <h1 className="page-title">Manage Students</h1>

      <div className="manage-students-card">
        <div className="card-header-bar">
          <div className="student-count-title">
            {total} Students
          </div>

          <div className="card-header-actions">
            <button
              className="btn-add-student"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={16} /> Add Student
            </button>

            <div className="filter-input-wrapper">
              <Search size={16} className="filter-search-icon" />
              <input
                type="text"
                className="filter-input"
                placeholder="Filter by name, email, phone"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="students-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="empty-table">
                    Loading students...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="4" className="empty-table" style={{ color: '#dc2626' }}>
                    <div>{error}</div>
                    <button
                      onClick={fetchStudentsList}
                      style={{
                        marginTop: '8px',
                        padding: '6px 14px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#475569',
                        fontSize: '13px',
                        fontWeight: 500
                      }}
                    >
                      <RefreshCw size={14} /> Retry
                    </button>
                  </td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const isDeleting = deletingPhone === student.phone;
                  const statusStr = student.status ? student.status.toLowerCase() : 'active';
                  const displayStatus = statusStr.charAt(0).toUpperCase() + statusStr.slice(1);
                  return (
                    <tr key={student.id || student.phone}>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>
                        <span className={`status-badge ${statusStr}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-table-action"
                            style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}
                            onClick={() => setViewingStudent(student)}
                            disabled={isDeleting}
                          >
                            View Profile
                          </button>
                          <button
                            className="btn-table-action btn-edit"
                            onClick={() => setEditingStudent(student)}
                            disabled={isDeleting}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-table-action btn-delete"
                            onClick={() => handleDeleteStudent(student)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="empty-table">
                    {filterText ? `No students found matching "${filterText}"` : 'No students found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Creating Student (Screen 5) */}
      <CreateStudentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleAddStudent}
      />

      {/* Modal for Editing Student */}
      <EditStudentModal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        student={editingStudent}
        onUpdate={handleUpdateStudent}
      />

      {/* Modal for Student Profile Details & Lesson Statuses */}
      <StudentProfileModal
        isOpen={!!viewingStudent}
        onClose={() => setViewingStudent(null)}
        student={viewingStudent}
      />
    </div>
  );
}
