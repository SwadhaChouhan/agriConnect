import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Alert,
  Spinner,
  Badge,
} from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import api from '../api/axios.js';
import { Link } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar.jsx';

const SOIL_TYPES = [
  { value: 'loamy', label: 'Loamy' },
  { value: 'alluvial', label: 'Alluvial' },
  { value: 'black', label: 'Black (Regur)' },
  { value: 'red', label: 'Red' },
  { value: 'laterite', label: 'Laterite' },
  { value: 'clayey', label: 'Clayey' },
  { value: 'sandy', label: 'Sandy' },
  { value: 'arid', label: 'Arid / Desert' },
  { value: 'forest', label: 'Forest / Mountain' },
  { value: 'other', label: 'Other' },
];

const Farms = () => {
  const { t } = useTranslation();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingFarmId, setEditingFarmId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    village: '',
    state: '',
    sizeAcres: '',
    soilType: 'loamy',
  });

  // Fetch farms from backend
  const fetchFarms = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/farms');
      setFarms(res.data.farms || []);
    } catch (err) {
      console.error('Error fetching farms:', err);
      setError(err.response?.data?.message || 'Failed to load farms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenCreateModal = () => {
    setEditingFarmId(null);
    setFormData({
      name: '',
      village: '',
      state: '',
      sizeAcres: '',
      soilType: 'loamy',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (farm) => {
    const id = farm._id || farm.id;
    setEditingFarmId(id);
    setFormData({
      name: farm.name || '',
      village: farm.location?.village || '',
      state: farm.location?.state || '',
      sizeAcres: farm.sizeAcres !== undefined && farm.sizeAcres !== null ? String(farm.sizeAcres) : '',
      soilType: farm.soilType || 'loamy',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (!submitting) {
      setShowModal(false);
      setEditingFarmId(null);
      setFormError('');
    }
  };

  // Submit farm (Create or Update)
  const handleSubmitFarm = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        location: {
          village: formData.village.trim(),
          state: formData.state.trim(),
        },
        sizeAcres: formData.sizeAcres ? parseFloat(formData.sizeAcres) : 0,
        soilType: formData.soilType,
      };

      if (editingFarmId) {
        const res = await api.put(`/farms/${editingFarmId}`, payload);
        const updatedFarm = res.data.farm;
        setFarms((prev) =>
          prev.map((f) => ((f._id || f.id) === editingFarmId ? updatedFarm : f))
        );
        setSuccessMsg('Farm updated successfully!');
      } else {
        await api.post('/farms', payload);
        setSuccessMsg('Farm created successfully!');
        await fetchFarms();
      }

      setShowModal(false);
      setEditingFarmId(null);

      // Clear success notification after 4 seconds
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error saving farm:', err);
      const backendMsg = err.response?.data?.message;
      if (backendMsg === 'validation.farm_name_required') {
        setFormError('Farm name is required.');
      } else if (backendMsg === 'validation.farm_soil_type_invalid') {
        setFormError('Selected soil type is invalid.');
      } else {
        setFormError(backendMsg || 'Failed to save farm. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Delete farm
  const handleDeleteFarm = async (farmId, farmName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${farmName || 'this farm'}"? All associated crops will also be deleted.`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/farms/${farmId}`);
      // Remove from UI state instantly
      setFarms((prev) => prev.filter((f) => (f._id || f.id) !== farmId));
      setSuccessMsg('Farm deleted successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error deleting farm:', err);
      setError(err.response?.data?.message || 'Failed to delete farm.');
      setTimeout(() => setError(''), 4000);
    }
  };

  return (
    <div className="bg-light min-vh-100">
      <AppNavbar />

      <Container className="py-5">
        {/* Header with Title and "Create New Farm" button */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <div>
            <h2 className="fw-bold text-success mb-1">{t('My Farms')}</h2>
            <p className="text-muted mb-0">Overview of all registered farms and land plots</p>
          </div>
          <Button variant="success" className="px-4 py-2 fw-semibold" onClick={handleOpenCreateModal}>
            + {t('Create New Farm')}
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

        {/* Loading Spinner */}
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
            <p className="text-muted mt-2">Loading your farms...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && farms.length === 0 && !error && (
          <Card className="text-center border-0 shadow-sm p-5 my-4">
            <Card.Body>
              <div className="fs-1 mb-3">🚜</div>
              <Card.Title className="fw-bold">No farms found</Card.Title>
              <Card.Text className="text-muted">
                You haven't added any farms yet. Click below to add your first farm.
              </Card.Text>
              <Button variant="success" onClick={handleOpenCreateModal}>
                {t('Create New Farm')}
              </Button>
            </Card.Body>
          </Card>
        )}

        {/* Responsive Grid of Farm Cards */}
        {!loading && farms.length > 0 && (
          <Row className="g-4">
            {farms.map((farm) => {
              const village = farm.location?.village || '';
              const state = farm.location?.state || '';
              const locationStr = [village, state].filter(Boolean).join(', ') || 'Not specified';

              return (
                <Col key={farm.id || farm._id} xs={12} sm={6} lg={4}>
                  <Card className="h-100 border-0 shadow-sm hover-shadow transition">
                    <Card.Body className="p-4 d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Card.Title className="fw-bold text-success mb-0 fs-5">
                          {farm.name}
                        </Card.Title>
                        <Badge bg="success" className="text-capitalize">
                          {farm.soilType || 'Soil: N/A'}
                        </Badge>
                      </div>

                      <hr className="my-3 text-muted opacity-25" />

                      <div className="mb-2">
                        <span className="text-muted small d-block">Location:</span>
                        <strong className="text-dark">📍 {locationStr}</strong>
                      </div>

                      <div className="mb-3">
                        <span className="text-muted small d-block">Size:</span>
                        <strong className="text-dark">
                          📏 {farm.sizeAcres !== undefined ? farm.sizeAcres : 0} Acres
                        </strong>
                      </div>

                      {farm.description && (
                        <p className="text-muted small mt-auto mb-0 pt-2 border-top">
                          {farm.description}
                        </p>
                      )}

                      <div className="mt-3 pt-3 border-top">
                        <div className="d-flex gap-2 mb-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="w-50 fw-semibold"
                            onClick={() => handleOpenEditModal(farm)}
                          >
                            ✏️ {t('Edit')}
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="w-50 fw-semibold"
                            onClick={() => handleDeleteFarm(farm._id || farm.id, farm.name)}
                          >
                            🗑️ {t('Delete')}
                          </Button>
                        </div>
                        <Button
                          as={Link}
                          to={`/farms/${farm._id || farm.id}`}
                          variant="outline-success"
                          className="w-100 fw-semibold"
                          size="sm"
                        >
                          View Details &rarr;
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Container>

      {/* Bootstrap Modal for Creating/Editing Farm */}
      <Modal show={showModal} onHide={handleCloseModal} centered backdrop="static">
        <Modal.Header closeButton={!submitting}>
          <Modal.Title className="fw-bold text-success">
            {editingFarmId ? `✏️ ${t('Edit')} Farm` : `🌱 ${t('Create New Farm')}`}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitFarm}>
          <Modal.Body className="p-4">
            {formError && (
              <Alert variant="danger" className="py-2 small">
                {formError}
              </Alert>
            )}

            <Form.Group className="mb-3" controlId="farmName">
              <Form.Label className="fw-semibold">Farm Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                placeholder="e.g. Green Valley Farm"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={submitting}
                autoFocus
              />
            </Form.Group>

            <Row className="g-2 mb-3">
              <Col sm={6}>
                <Form.Group controlId="farmVillage">
                  <Form.Label className="fw-semibold">Village</Form.Label>
                  <Form.Control
                    type="text"
                    name="village"
                    placeholder="e.g. Rampur"
                    value={formData.village}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group controlId="farmState">
                  <Form.Label className="fw-semibold">State</Form.Label>
                  <Form.Control
                    type="text"
                    name="state"
                    placeholder="e.g. Punjab"
                    value={formData.state}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2 mb-3">
              <Col sm={6}>
                <Form.Group controlId="farmSize">
                  <Form.Label className="fw-semibold">Size (Acres)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="0"
                    name="sizeAcres"
                    placeholder="e.g. 5.5"
                    value={formData.sizeAcres}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group controlId="farmSoil">
                  <Form.Label className="fw-semibold">Soil Type</Form.Label>
                  <Form.Select
                    name="soilType"
                    value={formData.soilType}
                    onChange={handleInputChange}
                    disabled={submitting}
                  >
                    {SOIL_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={submitting} className="px-4">
              {submitting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                  {editingFarmId ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingFarmId ? 'Update Farm' : 'Save Farm'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Farms;
