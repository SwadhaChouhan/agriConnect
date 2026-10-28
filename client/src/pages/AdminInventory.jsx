import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Alert,
  Spinner,
  Badge,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import Navbar from '../components/Navbar.jsx';

const CATEGORIES = [
  { value: 'seeds', label: '🌱 Seeds' },
  { value: 'fertilizers', label: '🧪 Fertilizers' },
  { value: 'pesticides', label: '🛡️ Pesticides' },
  { value: 'equipment', label: '🚜 Equipment' },
];

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State for new product
  const [formData, setFormData] = useState({
    name: '',
    category: 'seeds',
    price: '',
    stock: '',
    description: '',
    imageUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Modal State for updating stock
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStockValue, setNewStockValue] = useState('');
  const [updatingStock, setUpdatingStock] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/products');
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim(),
      };

      const res = await api.post('/products', payload);
      setProducts((prev) => [res.data.product, ...prev]);
      setSuccessMsg(`Product "${formData.name}" added successfully!`);

      // Reset form
      setFormData({
        name: '',
        category: 'seeds',
        price: '',
        stock: '',
        description: '',
        imageUrl: '',
      });

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error adding product:', err);
      setFormError(err.response?.data?.message || 'Failed to create product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete product "${name || 'this item'}"?`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      setSuccessMsg(`Product "${name}" deleted.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  const handleOpenStockModal = (product) => {
    setSelectedProduct(product);
    setNewStockValue(product.stock);
    setShowStockModal(true);
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setUpdatingStock(true);
    try {
      const parsedStock = parseInt(newStockValue, 10);
      if (isNaN(parsedStock) || parsedStock < 0) {
        alert('Please enter a valid non-negative number for stock.');
        setUpdatingStock(false);
        return;
      }

      await api.put(`/products/${selectedProduct._id}`, { stock: parsedStock });

      setProducts((prev) =>
        prev.map((p) =>
          p._id === selectedProduct._id ? { ...p, stock: parsedStock } : p
        )
      );

      setSuccessMsg(`Stock updated for "${selectedProduct.name}" to ${parsedStock}.`);
      setShowStockModal(false);
      setSelectedProduct(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error updating stock:', err);
      alert(err.response?.data?.message || 'Failed to update stock.');
    } finally {
      setUpdatingStock(false);
    }
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'seeds':
        return <Badge bg="success">🌱 Seeds</Badge>;
      case 'fertilizers':
        return <Badge bg="info" className="text-dark">🧪 Fertilizers</Badge>;
      case 'pesticides':
        return <Badge bg="danger">🛡️ Pesticides</Badge>;
      case 'equipment':
        return <Badge bg="primary">🚜 Equipment</Badge>;
      default:
        return <Badge bg="secondary">{category}</Badge>;
    }
  };

  return (
    <div className="bg-light min-vh-100">
      <Navbar />

      <Container className="py-4">
        {/* Navigation Breadcrumb */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Button
            as={Link}
            to="/admin-dashboard"
            variant="link"
            className="text-success p-0 text-decoration-none fw-semibold"
          >
            &larr; Back to Admin Control Panel
          </Button>
          <Badge bg="dark" className="fs-6 px-3 py-2">
            Admin Inventory Portal
          </Badge>
        </div>

        <div className="mb-4">
          <h2 className="fw-bold text-success mb-1">📦 Marketplace Inventory Management</h2>
          <p className="text-muted mb-0">
            Add agricultural products, manage stock levels, and set marketplace pricing.
          </p>
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

        {/* Top: Add New Product Form */}
        <Card className="border-0 shadow-sm rounded-3 mb-5">
          <Card.Header className="bg-white border-0 pt-4 px-4 pb-0">
            <h4 className="fw-bold text-success mb-1">+ Add New Product</h4>
            <p className="text-muted small mb-0">
              List seeds, fertilizers, pesticides, or farming tools in the farmer marketplace
            </p>
          </Card.Header>
          <Card.Body className="p-4">
            {formError && (
              <Alert variant="danger" className="py-2 small">
                {formError}
              </Alert>
            )}

            <Form onSubmit={handleAddProduct}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group controlId="productName">
                    <Form.Label className="fw-semibold">Product Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      placeholder="e.g. Certified Wheat Seed HD-2967"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId="productCategory">
                    <Form.Label className="fw-semibold">Category *</Form.Label>
                    <Form.Select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      disabled={submitting}
                      required
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group controlId="productPrice">
                    <Form.Label className="fw-semibold">Price (₹) *</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      name="price"
                      placeholder="e.g. 450.00"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                    />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group controlId="productStock">
                    <Form.Label className="fw-semibold">Stock Quantity *</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      name="stock"
                      placeholder="e.g. 100"
                      value={formData.stock}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId="productImage">
                    <Form.Label className="fw-semibold">Image URL (Optional)</Form.Label>
                    <Form.Control
                      type="url"
                      name="imageUrl"
                      placeholder="https://example.com/item.jpg"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group controlId="productDesc">
                    <Form.Label className="fw-semibold">Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="description"
                      placeholder="Usage instructions, purity percentage, bag weight (kg), etc."
                      value={formData.description}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                  </Form.Group>
                </Col>

                <Col md={12} className="text-end">
                  <Button
                    variant="success"
                    type="submit"
                    className="px-4 py-2 fw-semibold"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                        Adding Product...
                      </>
                    ) : (
                      'Save Product to Inventory'
                    )}
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>

        {/* Below Form: Current Products Inventory Table */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold mb-0">
            Current Marketplace Inventory{' '}
            <Badge bg="secondary" className="fs-6 ms-1">
              {products.length}
            </Badge>
          </h4>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
            <p className="text-muted mt-2">Loading marketplace inventory...</p>
          </div>
        ) : (
          <div className="table-responsive shadow-sm rounded-3">
            <Table striped bordered hover className="mb-0 align-middle">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price (₹)</th>
                  <th>Current Stock</th>
                  <th>Description</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      No products in inventory yet. Add your first product above.
                    </td>
                  </tr>
                ) : (
                  products.map((prod, index) => (
                    <tr key={prod._id}>
                      <td>{index + 1}</td>
                      <td>
                        <strong className="text-dark d-block">{prod.name}</strong>
                      </td>
                      <td>{getCategoryBadge(prod.category)}</td>
                      <td>
                        <strong>₹{prod.price?.toFixed(2)}</strong>
                      </td>
                      <td>
                        {prod.stock > 0 ? (
                          <Badge bg="success" className="px-2 py-1">
                            {prod.stock} Units
                          </Badge>
                        ) : (
                          <Badge bg="danger" className="px-2 py-1">
                            Out of Stock (0)
                          </Badge>
                        )}
                      </td>
                      <td className="text-muted small" style={{ maxWidth: '280px' }}>
                        {prod.description || '—'}
                      </td>
                      <td className="text-center">
                        <div className="d-inline-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="fw-semibold"
                            onClick={() => handleOpenStockModal(prod)}
                          >
                            ✏️ Update Stock
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="fw-semibold"
                            onClick={() => handleDeleteProduct(prod._id, prod.name)}
                          >
                            🗑️ Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        )}

        {/* Modal: Update Stock */}
        <Modal show={showStockModal} onHide={() => setShowStockModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold text-success">
              Update Stock for "{selectedProduct?.name}"
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleUpdateStock}>
            <Modal.Body className="p-4">
              <p className="text-muted small">
                Current Price: <strong>₹{selectedProduct?.price}</strong> | Category:{' '}
                <strong>{selectedProduct?.category}</strong>
              </p>
              <Form.Group controlId="modalStock">
                <Form.Label className="fw-semibold">New Stock Quantity (Units)</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={newStockValue}
                  onChange={(e) => setNewStockValue(e.target.value)}
                  required
                  autoFocus
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
              <Button variant="secondary" onClick={() => setShowStockModal(false)}>
                Cancel
              </Button>
              <Button variant="success" type="submit" disabled={updatingStock}>
                {updatingStock ? 'Updating...' : 'Save Stock'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </div>
  );
};

export default AdminInventory;
