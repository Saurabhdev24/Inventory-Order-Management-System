import { useState, useEffect } from 'react';
import { productApi } from '../services/api';
import Alert from '../components/Alert';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    sku: '',
    price: '',
    quantity_in_stock: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [alert, setAlert] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productApi.getAll();
      setProducts(data);
    } catch (err) {
      setAlert({ message: `Failed to load products: ${err.message}`, type: 'error' });
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

  const resetForm = () => {
    setFormData({ id: null, name: '', sku: '', price: '', quantity_in_stock: '' });
    setIsEditing(false);
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Product name cannot be empty";
    if (!formData.sku.trim()) return "SKU cannot be empty";
    
    const priceNum = Number(formData.price);
    if (isNaN(priceNum) || formData.price === '') return "Price must be a valid number";
    if (priceNum < 0) return "Price cannot be negative";
    
    const stockNum = Number(formData.quantity_in_stock);
    if (isNaN(stockNum) || !Number.isInteger(stockNum) || formData.quantity_in_stock === '') {
      return "Quantity in stock must be an integer";
    }
    if (stockNum < 0) return "Quantity in stock cannot be negative";
    
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
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      price: Number(formData.price),
      quantity_in_stock: parseInt(formData.quantity_in_stock, 10)
    };

    try {
      if (isEditing) {
        await productApi.update(formData.id, payload);
        setAlert({ message: 'Product updated successfully', type: 'success' });
      } else {
        await productApi.create(payload);
        setAlert({ message: 'Product created successfully', type: 'success' });
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      setAlert({ message: err.message, type: 'error' });
    }
  };

  const handleEditClick = (product) => {
    setFormData({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      quantity_in_stock: product.quantity_in_stock.toString()
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    
    try {
      const response = await productApi.delete(id);
      setAlert({ message: response.message || 'Product deleted successfully', type: 'success' });
      fetchProducts();
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
        <h1>Products</h1>
        <p className="page-subtitle">Add, update, and manage your inventory stock</p>
      </div>

      {/* Product Form Panel */}
      <div className="form-panel">
        <h2>{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
        <form onSubmit={handleSubmit} className="crud-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Product Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Wireless Mouse"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="sku">SKU Code *</label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                placeholder="e.g. MOUSE-WRLS-01"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">Unit Price ($) *</label>
              <input
                type="number"
                id="price"
                name="price"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="quantity_in_stock">Quantity in Stock *</label>
              <input
                type="number"
                id="quantity_in_stock"
                name="quantity_in_stock"
                min="0"
                value={formData.quantity_in_stock}
                onChange={handleInputChange}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Update Product' : 'Add Product'}
            </button>
            {isEditing && (
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Product List Section */}
      <div className="dashboard-section">
        <h2>Product Inventory List</h2>
        
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📦</span>
            <p>No products in stock. Add your first product above.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock Quantity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td>#{product.id}</td>
                    <td><strong>{product.name}</strong></td>
                    <td><code>{product.sku}</code></td>
                    <td>${Number(product.price).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${product.quantity_in_stock <= 5 ? 'badge-warning' : 'badge-success'}`}>
                        {product.quantity_in_stock} units
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEditClick(product)}
                          className="btn-action btn-edit"
                          title="Edit Product"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(product.id)}
                          className="btn-action btn-delete"
                          title="Delete Product"
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

export default Products;
