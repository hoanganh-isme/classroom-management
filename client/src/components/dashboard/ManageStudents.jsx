import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import CreateStudentModal from '../modals/CreateStudentModal';
import EditStudentModal from '../modals/EditStudentModal';

export default function ManageStudents({ forceOpenCreateModal = false }) {
  // Initial default state matching the Figma mockups
  const [students, setStudents] = useState([
    { id: 1, name: 'Student 1', email: '123@gmail.com', phone: '0912345671', role: 'Student', address: 'Hanoi', status: 'Active' },
    { id: 2, name: 'Student 2', email: '123@gmail.com', phone: '0912345672', role: 'Student', address: 'Ho Chi Minh', status: 'Active' },
    { id: 3, name: 'Student 3', email: '123@gmail.com', phone: '0912345673', role: 'Student', address: 'Da Nang', status: 'Active' },
    { id: 4, name: 'Student 4', email: '123@gmail.com', phone: '0912345674', role: 'Student', address: 'Can Tho', status: 'Active' },
  ]);

  const [filterText, setFilterText] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(forceOpenCreateModal);
  const [editingStudent, setEditingStudent] = useState(null);

  // Sync prop if user explicitly chooses "Screen 5 (Create Student Modal)" from demo bar
  React.useEffect(() => {
    if (forceOpenCreateModal) {
      setIsCreateModalOpen(true);
    }
  }, [forceOpenCreateModal]);

  const handleAddStudent = (newStudent) => {
    const studentWithId = {
      ...newStudent,
      id: Date.now(),
    };
    setStudents((prev) => [...prev, studentWithId]);
  };

  const handleUpdateStudent = (updatedStudent) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    );
  };

  const handleDeleteStudent = (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(filterText.toLowerCase()) ||
      student.email.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="manage-students-view">
      <h1 className="page-title">Manage Students</h1>

      <div className="manage-students-card">
        <div className="card-header-bar">
          <div className="student-count-title">
            {students.length} Students
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
                placeholder="Filter"
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
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>
                      <span className={`status-badge ${student.status.toLowerCase()}`}>
                        {student.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-table-action btn-edit"
                          onClick={() => setEditingStudent(student)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-table-action btn-delete"
                          onClick={() => handleDeleteStudent(student.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="empty-table">
                    No students found matching "{filterText}"
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
    </div>
  );
}
