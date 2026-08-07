import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Square } from 'lucide-react';
import { assignLesson } from '../../api/instructorApi';

export default function AssignLessonModal({ isOpen, onClose, students = [], onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPhones, setSelectedPhones] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setSelectedPhones([]);
      setError('');
      setFieldErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleStudent = (phone) => {
    setSelectedPhones((prev) =>
      prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]
    );
    if (fieldErrors.students) {
      setFieldErrors((prev) => ({ ...prev, students: '' }));
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedPhones.length === students.length) {
      setSelectedPhones([]);
    } else {
      setSelectedPhones(students.map((s) => s.phone).filter(Boolean));
    }
    if (fieldErrors.students) {
      setFieldErrors((prev) => ({ ...prev, students: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!title || title.trim().length < 2) {
      errs.title = 'Title is required and must contain at least 2 characters.';
    }
    if (!selectedPhones || selectedPhones.length === 0) {
      errs.students = 'Please select at least one student to assign.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        studentPhones: selectedPhones,
      };
      const result = await assignLesson(payload);
      if (onSuccess) {
        onSuccess(result.data);
      }
      onClose();
    } catch (err) {
      console.error('Failed to assign lesson:', err);
      const resp = err.response?.data;
      if (resp) {
        setError(resp.message || 'Failed to assign lesson.');
      } else {
        setError('An unexpected network error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Assign Lesson</h2>
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

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Lesson Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Chapter 1: Introduction to Algebra"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: '' }));
                }}
                required
                disabled={isSubmitting}
              />
              {fieldErrors.title && (
                <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.title}
                </span>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                style={{ height: '80px', resize: 'vertical' }}
                placeholder="Enter lesson details or instructions for students..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="form-label" style={{ margin: 0 }}>Assign to Students *</label>
                {students.length > 0 && (
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    style={{ background: 'none', border: 'none', color: '#1677ff', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                  >
                    {selectedPhones.length === students.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {students.length > 0 ? (
                <div style={{ border: '1px solid #e5e6eb', borderRadius: '8px', maxHeight: '160px', overflowY: 'auto', padding: '6px' }}>
                  {students.map((student) => {
                    const isSelected = selectedPhones.includes(student.phone);
                    return (
                      <div
                        key={student.id || student.phone}
                        onClick={() => handleToggleStudent(student.phone)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#e6f4ff' : 'transparent',
                          transition: 'background-color 0.15s',
                        }}
                      >
                        {isSelected ? <CheckSquare size={18} color="#1677ff" /> : <Square size={18} color="#94a3b8" />}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '14px', fontWeight: 500, color: '#1d2129' }}>{student.name}</span>
                          <span style={{ fontSize: '12px', color: '#86909c' }}>{student.email} ({student.phone})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '12px', textStyle: 'center', color: '#86909c', fontSize: '13px' }}>
                  No active students available. Please add students first.
                </div>
              )}

              {fieldErrors.students && (
                <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.students}
                </span>
              )}
            </div>

            <div className="modal-footer">
              <button type="submit" className="btn-modal-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Assigning...' : `Assign Lesson (${selectedPhones.length} selected)`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
