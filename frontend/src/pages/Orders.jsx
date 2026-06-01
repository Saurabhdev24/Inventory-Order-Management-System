import { useState, useEffect } from 'react';
import { orderApi, customerApi, productApi } from '../services/api';
import Alert from '../components/Alert';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1 }]);
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const [alert, setAlert] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [ordersData, customersData, productsData] = await Promise.all([
        orderApi.getAll(),
        customerApi.getAll(),
        productApi.getAll()
      ]);
      setOrders(ordersData);
      setCustomers(customersData);
      setProducts(productsData);
    } catch (err) {
      setAlert({ message: `Failed to load order data: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProductLine = () => {
    setOrderItems(prev => [...prev, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveProductLine = (index) => {
    if (orderItems.length === 1) {
      setAlert({ message: "An order must contain at least one product item", type: 'error' });
      return;
    }
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setOrderItems(prev => prev.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          [field]: field === 'quantity' ? parseInt(value, 10) || 0 : value
        };
      }
      return item;
    }));
  };

  const calculateEstimateTotal = () => {
    return orderItems.reduce((sum, item) => {
      const prod = products.find(p => p.id === parseInt(item.product_id, 10));
      if (prod && item.quantity > 0) {
        return sum + (Number(prod.price) * item.quantity);
      }
      return sum;
    }, 0);
  };

  const validateOrder = () => {
    if (!selectedCustomerId) return "Please select a customer";
    
    const productIds = orderItems.map(item => item.product_id);
    const hasDuplicates = productIds.some((id, index) => productIds.indexOf(id) !== index);
    if (hasDuplicates) return "Duplicate products selected in the same order";

    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      if (!item.product_id) return `Please select a product for line ${i + 1}`;
      if (item.quantity <= 0) return `Quantity must be greater than zero for line ${i + 1}`;
      
      const prod = products.find(p => p.id === parseInt(item.product_id, 10));
      if (!prod) return `Product not found for line ${i + 1}`;
      if (prod.quantity_in_stock < item.quantity) {
        return `Insufficient stock for product: ${prod.name}. Available: ${prod.quantity_in_stock}, requested: ${item.quantity}`;
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errorMsg = validateOrder();
    if (errorMsg) {
      setAlert({ message: errorMsg, type: 'error' });
      return;
    }

    const payload = {
      customer_id: parseInt(selectedCustomerId, 10),
      items: orderItems.map(item => ({
        product_id: parseInt(item.product_id, 10),
        quantity: item.quantity
      }))
    };

    try {
      await orderApi.create(payload);
      setAlert({ message: 'Order created successfully', type: 'success' });
      setSelectedCustomerId('');
      setOrderItems([{ product_id: '', quantity: 1 }]);
      fetchInitialData();
    } catch (err) {
      setAlert({ message: err.message, type: 'error' });
    }
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order? This will restore stock levels for all products in the order.")) return;
    
    try {
      const response = await orderApi.delete(id);
      setAlert({ message: response.message || 'Order deleted successfully', type: 'success' });
      fetchInitialData();
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
        <h1>Orders</h1>
        <p className="page-subtitle">Build customer transactions and view historical records</p>
      </div>

      {/* Order Creator Form */}
      <div className="form-panel">
        <h2>Create Customer Order</h2>
        <form onSubmit={handleSubmit} className="crud-form">
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="customer_select">Select Customer *</label>
            <select
              id="customer_select"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              required
              className="form-control"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
              ))}
            </select>
          </div>

          <div className="order-items-builder">
            <h3>Order Items *</h3>
            <p className="section-description">Select products and set required quantities below.</p>
            
            {orderItems.map((item, index) => {
              const selectedProd = products.find(p => p.id === parseInt(item.product_id, 10));
              return (
                <div key={index} className="order-builder-row">
                  <div className="form-group builder-product">
                    <label>Product</label>
                    <select
                      value={item.product_id}
                      onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                      required
                      className="form-control"
                    >
                      <option value="">-- Choose Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id} disabled={p.quantity_in_stock <= 0}>
                          {p.name} - ${Number(p.price).toFixed(2)} (Stock: {p.quantity_in_stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group builder-quantity">
                    <label>Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      required
                      className="form-control"
                    />
                  </div>

                  <div className="builder-subtotal">
                    <label>Subtotal</label>
                    <span className="subtotal-val">
                      {selectedProd && item.quantity > 0 
                        ? `$${(Number(selectedProd.price) * item.quantity).toFixed(2)}` 
                        : '$0.00'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveProductLine(index)}
                    className="btn btn-danger btn-remove-line"
                    title="Remove item"
                  >
                    &times;
                  </button>
                </div>
              );
            })}

            <div className="builder-footer">
              <button
                type="button"
                onClick={handleAddProductLine}
                className="btn btn-secondary btn-sm"
              >
                + Add Another Product
              </button>

              <div className="order-summary-box">
                <span className="summary-label">Estimated Total:</span>
                <span className="summary-value">${calculateEstimateTotal().toFixed(2)}</span>
                <small className="summary-note">Backend calculates the official final amount.</small>
              </div>
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary btn-lg">
              Place Order
            </button>
          </div>
        </form>
      </div>

      {/* Orders Registry List */}
      <div className="dashboard-section">
        <h2>Order Logs</h2>
        
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading order log...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🧾</span>
            <p>No orders logged. Place your first order using the builder above.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Total Amount</th>
                  <th>Items Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{new Date(order.created_at).toLocaleString()}</td>
                    <td><strong>{order.customer_name}</strong></td>
                    <td><strong>${Number(order.total_amount).toFixed(2)}</strong></td>
                    <td>{order.items?.length || 0} items</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="btn-action btn-edit"
                          title="View Order Details"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleDeleteClick(order.id)}
                          className="btn-action btn-delete"
                          title="Delete Order"
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

      {/* Order Details Modal Overlay */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order details: #{selectedOrder.id}</h3>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="modal-info-grid">
                <div>
                  <strong>Customer:</strong>
                  <p>{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <strong>Order Date:</strong>
                  <p>{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <strong>Total Transaction:</strong>
                  <p className="highlight-price">${Number(selectedOrder.total_amount).toFixed(2)}</p>
                </div>
              </div>

              <div className="modal-items-section">
                <h4>Items Ordered</h4>
                <div className="table-responsive">
                  <table className="data-table mini-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map(item => (
                        <tr key={item.id}>
                          <td><strong>{item.product_name}</strong></td>
                          <td><code>{item.product_sku}</code></td>
                          <td>{item.quantity} units</td>
                          <td>${Number(item.unit_price).toFixed(2)}</td>
                          <td>${(Number(item.unit_price) * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setSelectedOrder(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
