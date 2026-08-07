import React, { useState } from 'react';
import { X } from 'lucide-react';
import { addStudent } from '../../api/studentApi';
import { COUNTRY_CODES, formatFullPhone } from '../../utils/phoneUtils';

export default function CreateStudentModal({ isOpen, onClose, onCreate }) {
  const [countryCode, setCountryCode] = useState('+84');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = 'Name is required and must contain at least 2 characters.';
    }
    const fullPhone = formatFullPhone(countryCode, formData.phone);
    const phoneRegex = /^\+[1-9]\d{7,14}$/;
    if (!fullPhone || !phoneRegex.test(fullPhone)) {
      errors.phone = 'Invalid phone number format.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email.trim())) {
      errors.email = 'Valid email address is required.';
    }
    if (formData.address && formData.address.length > 250) {
      errors.address = 'Address must not exceed 250 characters.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const fullPhone = formatFullPhone(countryCode, formData.phone);
      const payload = {
        name: formData.name.trim(),
        phone: fullPhone,
        email: formData.email.trim(),
        address: formData.address.trim(),
      };
      const result = await addStudent(payload);
      if (onCreate && result.data?.student) {
        onCreate(result.data.student);
      }
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
      });
      setCountryCode('+84');
      setFieldErrors({});
      onClose();
    } catch (err) {
      const resp = err.response?.data;
      if (resp) {
        setServerError(resp.message || 'Failed to create student.');
        if (Array.isArray(resp.errors)) {
          const errorsMap = {};
          resp.errors.forEach((item) => {
            if (item.field) errorsMap[item.field] = item.message;
          });
          setFieldErrors(errorsMap);
        }
      } else {
        setServerError('An unexpected network error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
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
          {serverError && (
            <div className="alert-server-error" style={{ padding: '8px 12px', marginBottom: '12px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '6px', fontSize: '14px' }}>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="modal-grid-form">
              <div className="form-group">
                <label className="form-label">Student Name *</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter student name"
                  required
                  disabled={isSubmitting}
                />
                {fieldErrors.name && (
                  <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {fieldErrors.name}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    className="form-input"
                    style={{ width: '95px', flexShrink: 0, paddingRight: '2px' }}
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    disabled={isSubmitting}
                  >
                    {COUNTRY_CODES.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    name="phone"
                    className="form-input"
                    style={{ flex: 1 }}
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0123456789"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                {fieldErrors.phone && (
                  <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {fieldErrors.phone}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@example.com"
                  required
                  disabled={isSubmitting}
                />
                {fieldErrors.email && (
                  <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {fieldErrors.email}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <input
                  type="text"
                  name="role"
                  className="form-input"
                  value="Student"
                  disabled
                  readOnly
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
                  disabled={isSubmitting}
                />
                {fieldErrors.address && (
                  <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {fieldErrors.address}
                  </span>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button type="submit" className="btn-modal-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
