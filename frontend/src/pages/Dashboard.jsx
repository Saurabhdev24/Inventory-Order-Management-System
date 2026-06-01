import { useState, useEffect } from 'react';
import { productApi, customerApi, orderApi } from '../services/api';
import Alert from '../components/Alert';

function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    totalOrders: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [products, customers, orders] = await Promise.all([
        productApi.getAll(),
        customerApi.getAll(),
        orderApi.getAll(),
      ]);

      setStats({
        totalProducts: products.length,
        totalCustomers: customers.length,
        totalOrders: orders.length,
      });

      const lowStock = products.filter(p => p.quantity_in_stock <= 5);
      setLowStockProducts(lowStock);
    } catch (err) {
      setAlert({
        message: `Failed to load dashboard data: ${err.message}`,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAlertClose = () => {
    setAlert({ message: '', type: 'success' });
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading system overview...</p>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <Alert message={alert.message} type={alert.type} onClose={handleAlertClose} />
      
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Inventory & Sales System Overview</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <span className="stat-label">Total Products</span>
            <span className="stat-value">{stats.totalProducts}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <span className="stat-label">Total Customers</span>
            <span className="stat-value">{stats.totalCustomers}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🧾</div>
          <div className="stat-content">
            <span className="stat-label">Total Orders</span>
            <span className="stat-value">{stats.totalOrders}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Low Stock Alert</h2>
        <p className="section-description">Products with stock level at or below 5 units.</p>

        {lowStockProducts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">✓</span>
            <p>All product stock levels are healthy.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map(product => (
                  <tr key={product.id} className={product.quantity_in_stock === 0 ? 'row-danger' : 'row-warning'}>
                    <td>#{product.id}</td>
                    <td><strong>{product.name}</strong></td>
                    <td><code>{product.sku}</code></td>
                    <td>${Number(product.price).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${product.quantity_in_stock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                        {product.quantity_in_stock} remaining
                      </span>
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

export default Dashboard;
