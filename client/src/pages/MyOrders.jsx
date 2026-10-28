import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Spinner,
  Alert,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import Navbar from '../components/Navbar.jsx';

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const getStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case 'shipped':
      return <Badge bg="primary">🚚 Shipped</Badge>;
    case 'delivered':
      return <Badge bg="success">✓ Delivered</Badge>;
    case 'pending':
    default:
      return <Badge bg="warning" text="dark">⏳ Pending</Badge>;
  }
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/orders/my');
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError(err.response?.data?.message || 'Failed to load your orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="bg-light min-vh-100">
      <Navbar />

      <Container className="py-4">
        {/* Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <div>
            <h2 className="fw-bold text-success mb-1">📦 My Marketplace Orders</h2>
            <p className="text-muted mb-0">
              Track delivery progress and review past orders of agricultural inputs.
            </p>
          </div>
          <Button as={Link} to="/marketplace" variant="success" className="fw-semibold px-3 py-2">
            🛒 Go to Marketplace &rarr;
          </Button>
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')} className="shadow-sm">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
            <p className="text-muted mt-2">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card className="text-center border-0 shadow-sm p-5 my-3">
            <Card.Body>
              <div className="fs-1 mb-3">📦</div>
              <Card.Title className="fw-bold">No Orders Yet</Card.Title>
              <Card.Text className="text-muted">
                You haven't purchased any seeds, fertilizers, or equipment yet.
              </Card.Text>
              <Button as={Link} to="/marketplace" variant="success" className="px-4 py-2 fw-semibold">
                Start Shopping Now
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <div className="d-flex flex-column gap-4">
            {orders.map((order) => (
              <Card key={order._id} className="border-0 shadow-sm rounded-3 overflow-hidden">
                <Card.Header className="bg-white p-3 p-md-4 border-bottom">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <div>
                      <span className="text-muted small d-block">
                        Order ID: <code className="text-dark fw-bold">#{order._id.slice(-8).toUpperCase()}</code>
                      </span>
                      <span className="text-muted small">
                        Placed on: <strong>{formatDate(order.createdAt)}</strong>
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                      <div>
                        <span className="text-muted small d-block text-end">Total Amount:</span>
                        <strong className="fs-5 text-success">₹{order.totalAmount?.toFixed(2)}</strong>
                      </div>
                      <div className="fs-6">
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  </div>
                </Card.Header>

                <Card.Body className="p-3 p-md-4">
                  {/* Items Table */}
                  <h6 className="fw-bold text-muted mb-2 small text-uppercase">Items in this Order</h6>
                  <div className="table-responsive mb-3">
                    <Table size="sm" className="mb-0 align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Item</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Quantity</th>
                          <th className="text-end">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.products?.map((item, idx) => {
                          const prod = item.productId;
                          const name = prod?.name || 'Product';
                          const cat = prod?.category || 'General';
                          const subtotal = item.price * item.quantity;

                          return (
                            <tr key={idx}>
                              <td>
                                <strong className="text-dark">{name}</strong>
                              </td>
                              <td>
                                <Badge bg="light" text="dark" className="border text-capitalize">
                                  {cat}
                                </Badge>
                              </td>
                              <td>₹{item.price?.toFixed(2)}</td>
                              <td>
                                <strong>{item.quantity}</strong> units
                              </td>
                              <td className="text-end fw-semibold">
                                ₹{subtotal.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>

                  {/* Shipping Address */}
                  <div className="p-3 bg-light rounded-2">
                    <span className="fw-semibold text-secondary small d-block mb-1">
                      📍 Delivery Address:
                    </span>
                    <p className="mb-0 text-dark small" style={{ whiteSpace: 'pre-wrap' }}>
                      {order.shippingAddress}
                    </p>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
};

export default MyOrders;
