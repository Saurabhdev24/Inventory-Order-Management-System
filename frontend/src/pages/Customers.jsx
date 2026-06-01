import { useState, useEffect } from 'react';
import { customerApi } from '../services/api';
import Alert from '../components/Alert';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: ''
  });
  
  const [alert, setAlert] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerApi.getAll();
      setCustomers(data);
    } catch (err) {
      setAlert({ message: `Failed to load customers: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) return "Customer name cannot be empty";
    
    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (!emailRegex.test(formData.email.trim())) return "Invalid email format";
    
    const phoneClean = formData.phone.replace(/[^\d]/g, '');
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
    if (!phoneRegex.test(formData.phone.trim()) || phoneClean.length < 7) {
      return "Invalid phone number";
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errorMsg = validateForm();
    if (errorMsg) {
      setAlert({ message: errorMsg, type: 'error' });
      return;
    }

    const payload = {
      full_name: formData.full_name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim()
    };

    try {
      await customerApi.create(payload);
      setAlert({ message: 'Customer created successfully', type: 'success' });
      setFormData({ full_name: '', email: '', phone: '' });
      fetchCustomers();
    } catch (err) {
      setAlert({ message: err.message, type: 'error' });
    }
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer? This will also delete all their orders.")) return;
    
    try {
      const response = await customerApi.delete(id);
      setAlert({ message: response.message || 'Customer deleted successfully', type: 'success' });
      fetchCustomers();
    } catch (err) {
      setAlert({ message: err.message, type: 'error' });
    }
  };

  const handleAlertClose = () => {
    setAlert({ message: '', type: 'success' });
  };

  return (
    <div className="page-container animate-fade-in">
      <Alert message={alert.message} type={alert.type} onClose={handleAlertClose} />

      <div className="page-header">
        <h1>Customers</h1>
        <p className="page-subtitle">Add and manage customer records</p>
      </div>

      {/* Customer Form Panel */}
      <div className="form-panel">
        <h2>Add New Customer</h2>
        <form onSubmit={handleSubmit} className="crud-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="full_name">Full Name *</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="e.g. John Doe"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="e.g. john.doe@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="e.g. +1 (555) 019-2834"
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Add Customer
            </button>
          </div>
        </form>
      </div>

      {/* Customer List Section */}
      <div className="dashboard-section">
        <h2>Customer Registry</h2>
        
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">👥</span>
            <p>No customers registered. Add your first customer above.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => (
                  <tr key={customer.id}>
                    <td>#{customer.id}</td>
                    <td><strong>{customer.full_name}</strong></td>
                    <td>{customer.email}</td>
                    <td>{customer.phone}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleDeleteClick(customer.id)}
                          className="btn-action btn-delete"
                          title="Delete Customer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Customers;
