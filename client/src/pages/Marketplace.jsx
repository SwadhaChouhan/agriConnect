import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Badge,
  Alert,
  Spinner,
  ButtonGroup,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import Navbar from '../components/Navbar.jsx';

const CATEGORY_MAP = {
  seeds: { label: 'Seeds', emoji: '🌱', badge: 'success' },
  fertilizers: { label: 'Fertilizers', emoji: '🧪', badge: 'info' },
  pesticides: { label: 'Pesticides', emoji: '🛡️', badge: 'danger' },
  equipment: { label: 'Equipment', emoji: '🚜', badge: 'primary' },
};

const Marketplace = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Purchase Modal State
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/products');
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Failed to load marketplace products:', err);
      setError(err.response?.data?.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenBuyModal = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setShippingAddress('');
    setOrderError('');
    setShowBuyModal(true);
  };

  const handleCloseBuyModal = () => {
    if (!ordering) {
      setShowBuyModal(false);
      setSelectedProduct(null);
      setOrderError('');
    }
  };

  const handleBuySubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (!shippingAddress.trim()) {
      setOrderError('Please enter a valid shipping address.');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1) {
      setOrderError('Please specify at least 1 unit.');
      return;
    }

    if (qty > selectedProduct.stock) {
      setOrderError(`Only ${selectedProduct.stock} units are currently available.`);
      return;
    }

    setOrdering(true);
    setOrderError('');

    try {
      await api.post('/orders', {
        products: [
          {
            productId: selectedProduct._id,
            quantity: qty,
          },
        ],
        shippingAddress: shippingAddress.trim(),
      });

      setSuccessMsg(
        `Order placed successfully for ${qty}x ${selectedProduct.name}! You can view delivery status in "My Orders".`
      );

      // Decrement product stock locally
      setProducts((prev) =>
        prev.map((p) =>
          p._id === selectedProduct._id
            ? { ...p, stock: Math.max(0, p.stock - qty) }
            : p
        )
      );

      setShowBuyModal(false);
      setSelectedProduct(null);

      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      console.error('Order creation failed:', err);
      setOrderError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setOrdering(false);
    }
  };

  const filteredProducts =
    activeCategory === 'all'
      ? products
      : products.filter((p) => p.category === activeCategory);

  const totalPrice = selectedProduct ? (quantity * selectedProduct.price).toFixed(2) : '0.00';

  return (
    <div className="bg-light min-vh-100">
      <Navbar />

      <Container className="py-4">
        {/* Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <div>
            <h2 className="fw-bold text-success mb-1">🛒 Farmer Marketplace</h2>
            <p className="text-muted mb-0">
              Procure certified seeds, balanced fertilizers, crop protection, and farming equipment.
            </p>
          </div>
          <Button as={Link} to="/orders" variant="outline-success" className="fw-semibold px-3 py-2">
            📦 View My Orders &rarr;
          </Button>
        </div>

        {/* Global Notifications */}
        {successMsg && (
          <Alert variant="success" dismissible onClose={() => setSuccessMsg('')} className="shadow-sm">
            {successMsg}
          </Alert>
        )}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')} className="shadow-sm">
            {error}
          </Alert>
        )}

        {/* Category Filters */}
        <div className="d-flex flex-wrap gap-2 mb-4">
          <Button
            variant={activeCategory === 'all' ? 'success' : 'outline-secondary'}
            size="sm"
            className="fw-semibold px-3"
            onClick={() => setActiveCategory('all')}
          >
            All Products ({products.length})
          </Button>
          {Object.entries(CATEGORY_MAP).map(([key, info]) => {
            const count = products.filter((p) => p.category === key).length;
            return (
              <Button
                key={key}
                variant={activeCategory === key ? 'success' : 'outline-secondary'}
                size="sm"
                className="fw-semibold px-3"
                onClick={() => setActiveCategory(key)}
              >
                {info.emoji} {info.label} ({count})
              </Button>
            );
          })}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
            <p className="text-muted mt-2">Loading marketplace inventory...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="text-center border-0 shadow-sm p-5 my-3">
            <Card.Body>
              <div className="fs-1 mb-2">🌾</div>
              <Card.Title className="fw-bold">No Products Available</Card.Title>
              <Card.Text className="text-muted">
                {activeCategory === 'all'
                  ? 'The marketplace currently has no items in stock. Please check back later.'
                  : `No products found under "${CATEGORY_MAP[activeCategory]?.label}".`}
              </Card.Text>
            </Card.Body>
          </Card>
        ) : (
          <Row className="g-4">
            {filteredProducts.map((prod) => {
              const catInfo = CATEGORY_MAP[prod.category] || {
                label: prod.category,
                emoji: '📦',
                badge: 'secondary',
              };
              const isOutOfStock = prod.stock <= 0;

              return (
                <Col key={prod._id} xs={12} sm={6} md={4} lg={3}>
                  <Card className="h-100 border-0 shadow-sm rounded-3 overflow-hidden d-flex flex-column hover-shadow transition">
                    {/* Category & Emoji Icon Top Header */}
                    <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
                      <span className="fs-4">{catInfo.emoji}</span>
                      <Badge bg={catInfo.badge} className="text-capitalize px-2 py-1">
                        {catInfo.label}
                      </Badge>
                    </div>

                    <Card.Body className="p-3 d-flex flex-column">
                      <Card.Title className="fw-bold fs-6 mb-2 text-dark">
                        {prod.name}
                      </Card.Title>

                      <p className="text-muted small mb-3 flex-grow-1" style={{ minHeight: '40px' }}>
                        {prod.description || 'Quality tested agricultural inputs for optimal harvest yields.'}
                      </p>

                      <hr className="my-2 text-muted opacity-25" />

                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <span className="text-muted small d-block">Price:</span>
                          <span className="fw-bold fs-5 text-success">
                            ₹{prod.price?.toFixed(2)}
                          </span>
                        </div>

                        <div className="text-end">
                          <span className="text-muted small d-block">Availability:</span>
                          {isOutOfStock ? (
                            <Badge bg="danger">Out of Stock</Badge>
                          ) : (
                            <Badge bg="success-subtle" className="text-success-emphasis border border-success-subtle">
                              {prod.stock} in stock
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        variant={isOutOfStock ? 'secondary' : 'success'}
                        className="w-100 fw-semibold py-2 mt-auto"
                        disabled={isOutOfStock}
                        onClick={() => handleOpenBuyModal(prod)}
                      >
                        {isOutOfStock ? 'Unavailable' : '⚡ Buy Now'}
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}

        {/* Buy Now Modal */}
        <Modal show={showBuyModal} onHide={handleCloseBuyModal} centered backdrop="static">
          <Modal.Header closeButton={!ordering}>
            <Modal.Title className="fw-bold text-success">
              🛒 Confirm Purchase
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleBuySubmit}>
            <Modal.Body className="p-4">
              {orderError && (
                <Alert variant="danger" className="py-2 small">
                  {orderError}
                </Alert>
              )}

              {selectedProduct && (
                <>
                  <div className="p-3 bg-light rounded-3 mb-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="fw-bold mb-1 text-dark">
                          {CATEGORY_MAP[selectedProduct.category]?.emoji} {selectedProduct.name}
                        </h6>
                        <span className="text-muted small text-capitalize">
                          Category: {selectedProduct.category}
                        </span>
                      </div>
                      <span className="fw-bold text-success fs-5">
                        ₹{selectedProduct.price?.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-muted small mt-2">
                      In Stock: <strong>{selectedProduct.stock} units</strong>
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <Form.Group className="mb-3" controlId="orderQuantity">
                    <Form.Label className="fw-semibold">Quantity (Units) *</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      max={selectedProduct.stock}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      required
                      disabled={ordering}
                    />
                    <Form.Text className="text-muted">
                      Max available: {selectedProduct.stock} units
                    </Form.Text>
                  </Form.Group>

                  {/* Dynamic Total Price */}
                  <div className="d-flex justify-content-between align-items-center p-3 bg-success-subtle text-success-emphasis rounded-3 mb-3">
                    <span className="fw-bold">Total Amount to Pay:</span>
                    <span className="fs-4 fw-bold">₹{totalPrice}</span>
                  </div>

                  {/* Shipping Address */}
                  <Form.Group className="mb-2" controlId="orderAddress">
                    <Form.Label className="fw-semibold">Shipping Address *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Enter delivery village, street address, district, state & pincode..."
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      required
                      disabled={ordering}
                    />
                  </Form.Group>
                </>
              )}
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
              <Button variant="secondary" onClick={handleCloseBuyModal} disabled={ordering}>
                Cancel
              </Button>
              <Button variant="success" type="submit" disabled={ordering} className="px-4">
                {ordering ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Placing Order...
                  </>
                ) : (
                  `Confirm & Order (₹${totalPrice})`
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </div>
  );
};

export default Marketplace;
