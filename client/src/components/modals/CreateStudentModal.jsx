import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function CreateStudentModal({ isOpen, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'Student',
    address: '',
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onCreate) {
      onCreate({
        ...formData,
        status: 'Active',
      });
    }
    // Reset form & close
    setFormData({
      name: '',
      phone: '',
      email: '',
      role: 'Student',
      address: '',
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Student</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="modal-grid-form">
              <div className="form-group">
                <label className="form-label">Student Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter student name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <input
                  type="text"
                  name="role"
                  className="form-input"
                  value={formData.role}
                  onChange={handleChange}
                  placeholder="e.g. Student"
                />
              </div>

              <div className="form-group grid-col-full">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  name="address"
                  className="form-input"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter address"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="submit" className="btn-modal-submit">
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
