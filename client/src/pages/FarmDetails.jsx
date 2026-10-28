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
  Table,
} from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios.js';
import AppNavbar from '../components/AppNavbar.jsx';

const SEASONS = [
  { value: 'kharif', label: 'Kharif (Monsoon)' },
  { value: 'rabi', label: 'Rabi (Winter)' },
  { value: 'zaid', label: 'Zaid (Summer)' },
  { value: 'year-round', label: 'Year-Round' },
];

const STATUSES = [
  { value: 'planned', label: 'Planned', bg: 'secondary' },
  { value: 'planted', label: 'Planted', bg: 'info' },
  { value: 'growing', label: 'Growing', bg: 'primary' },
  { value: 'ready', label: 'Ready for Harvest', bg: 'warning' },
  { value: 'harvested', label: 'Harvested', bg: 'success' },
  { value: 'failed', label: 'Failed', bg: 'danger' },
];

const FarmDetails = () => {
  const { farmId } = useParams();

  const [farm, setFarm] = useState(null);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add/Edit Crop Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCropId, setEditingCropId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [cropForm, setCropForm] = useState({
    name: '',
    variety: '',
    season: 'kharif',
    status: 'planted',
    areaUsedAcres: '',
    notes: '',
  });

  // Soil Health Advisory State
  const [soilType, setSoilType] = useState('Loamy');
  const [soilPh, setSoilPh] = useState('');
  const [soilAdvice, setSoilAdvice] = useState(null);

  const handleGenerateSoilAdvice = (e) => {
    if (e) e.preventDefault();
    const ph = parseFloat(soilPh);
    if (isNaN(ph) || ph < 0 || ph > 14) {
      setSoilAdvice(['Please enter a valid soil pH between 0 and 14.']);
      return;
    }

    const recommendations = [];

    // If pH < 6.0: Recommend adding lime.
    if (ph < 6.0) {
      recommendations.push('Recommend adding lime.');
    }
    // If pH > 7.5: Recommend adding gypsum.
    if (ph > 7.5) {
      recommendations.push('Recommend adding gypsum.');
    }
    // If Soil Type is 'Sandy': Recommend frequent, light irrigation.
    if (soilType === 'Sandy') {
      recommendations.push('Recommend frequent, light irrigation.');
    }
    // If Soil Type is 'Clay': Recommend avoiding over-watering.
    if (soilType === 'Clay') {
      recommendations.push('Recommend avoiding over-watering.');
    }
    // If Soil Type is 'Black' and pH is 6.5-7.5: Recommend it is ideal for cotton.
    if (soilType === 'Black' && ph >= 6.5 && ph <= 7.5) {
      recommendations.push('Recommend it is ideal for cotton.');
    }
    // If pH is 6.0-7.5 (and not Black): Recommend pH is optimal.
    if (ph >= 6.0 && ph <= 7.5 && soilType !== 'Black') {
      recommendations.push('Recommend pH is optimal.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Soil condition is within normal parameters.');
    }

    setSoilAdvice(recommendations);
  };

  // Fetch farm data and crops
  const fetchFarmAndCrops = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch farm details (includes populated crops)
      const farmRes = await api.get(`/farms/${farmId}`);
      const farmData = farmRes.data.farm;
      setFarm(farmData);

      // Fetch crops list directly
      const cropsRes = await api.get(`/farms/${farmId}/crops`);
      setCrops(cropsRes.data.crops || farmData.crops || []);
    } catch (err) {
      console.error('Error fetching farm details:', err);
      setError(err.response?.data?.message || 'Failed to load farm details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (farmId) {
      fetchFarmAndCrops();
    }
  }, [farmId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCropForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setEditingCropId(null);
    setCropForm({
      name: '',
      variety: '',
      season: 'kharif',
      status: 'planted',
      areaUsedAcres: '',
      notes: '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (crop) => {
    setEditingCropId(crop._id || crop.id);
    setCropForm({
      name: crop.name || '',
      variety: crop.variety || '',
      season: crop.season || 'kharif',
      status: crop.status || 'planted',
      areaUsedAcres: crop.areaUsedAcres !== undefined && crop.areaUsedAcres !== null ? String(crop.areaUsedAcres) : '',
      notes: crop.notes || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (!submitting) {
      setShowModal(false);
      setEditingCropId(null);
      setFormError('');
    }
  };

  // Submit crop (Add or Edit)
  const handleSubmitCrop = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const payload = {
        name: cropForm.name.trim(),
        variety: cropForm.variety.trim(),
        season: cropForm.season,
        status: cropForm.status,
        areaUsedAcres: cropForm.areaUsedAcres ? parseFloat(cropForm.areaUsedAcres) : 0,
        notes: cropForm.notes.trim(),
      };

      if (editingCropId) {
        await api.put(`/farms/${farmId}/crops/${editingCropId}`, payload);
        setSuccessMsg('Crop updated successfully!');
      } else {
        await api.post(`/farms/${farmId}/crops`, payload);
        setSuccessMsg('Crop added successfully!');
      }

      setShowModal(false);
      setEditingCropId(null);
      // Refresh crop list
      await fetchFarmAndCrops();

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error saving crop:', err);
      const backendMsg = err.response?.data?.message;
      if (backendMsg === 'validation.crop_name_required') {
        setFormError('Crop name is required.');
      } else if (backendMsg === 'validation.crop_season_invalid') {
        setFormError('Selected season is invalid.');
      } else {
        setFormError(backendMsg || 'Failed to save crop. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Delete crop
  const handleDeleteCrop = async (cropId, cropName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${cropName || 'this crop'}"?`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/farms/${farmId}/crops/${cropId}`);
      setSuccessMsg('Crop deleted successfully!');
      await fetchFarmAndCrops();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error deleting crop:', err);
      setError(err.response?.data?.message || 'Failed to delete crop.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const getStatusBadge = (status) => {
    const found = STATUSES.find((s) => s.value === status);
    return (
      <Badge bg={found?.bg || 'secondary'} className="text-capitalize px-2 py-1">
        {found?.label || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="bg-light min-vh-100">
        <AppNavbar />
        <Container className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <p className="text-muted mt-2">Loading farm details...</p>
        </Container>
      </div>
    );
  }

  if (error || !farm) {
    return (
      <div className="bg-light min-vh-100">
        <AppNavbar />
        <Container className="py-5">
          <Alert variant="danger">
            {error || 'Farm not found.'}
          </Alert>
          <Button as={Link} to="/farms" variant="outline-success">
            &larr; Back to My Farms
          </Button>
        </Container>
      </div>
    );
  }

  const village = farm.location?.village || '';
  const state = farm.location?.state || '';
  const address = farm.location?.address || '';
  const locationParts = [address, village, state].filter(Boolean).join(', ') || 'Not specified';

  return (
    <div className="bg-light min-vh-100">
      <AppNavbar />

      <Container className="py-5">
        {/* Navigation Breadcrumb / Back button */}
        <div className="mb-4">
          <Button as={Link} to="/farms" variant="link" className="text-success p-0 text-decoration-none fw-semibold">
            &larr; Back to My Farms
          </Button>
        </div>

        {/* Global Notifications */}
        {successMsg && (
          <Alert variant="success" dismissible onClose={() => setSuccessMsg('')} className="shadow-sm">
            {successMsg}
          </Alert>
        )}

        {/* Top Farm Details Card */}
        <Card className="border-0 shadow-sm rounded-3 mb-5">
          <Card.Body className="p-4 p-md-5">
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
              <div>
                <h2 className="fw-bold text-success mb-2">{farm.name}</h2>
                <div className="d-flex flex-wrap align-items-center gap-3 text-muted">
                  <span>📍 <strong>Location:</strong> {locationParts}</span>
                  <span>🌱 <strong>Soil Type:</strong> <Badge bg="success" className="text-capitalize">{farm.soilType || 'N/A'}</Badge></span>
                  <span>📏 <strong>Total Size:</strong> {farm.sizeAcres || 0} Acres</span>
                </div>
                {farm.description && (
                  <p className="text-muted mt-3 mb-0 pt-2 border-top">
                    {farm.description}
                  </p>
                )}
              </div>
              <Button variant="success" className="px-4 py-2 fw-semibold" onClick={handleOpenAddModal}>
                + Add Crop
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Crops Section Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-1">Crops in this Farm</h3>
            <p className="text-muted mb-0">Track planting stages, area utilization, and seasons</p>
          </div>
          <Badge bg="secondary" className="fs-6 px-3 py-2">
            {crops.length} {crops.length === 1 ? 'Crop' : 'Crops'}
          </Badge>
        </div>

        {/* Crops List or Empty State */}
        {crops.length === 0 ? (
          <Card className="text-center border-0 shadow-sm p-5">
            <Card.Body>
              <div className="fs-1 mb-3">🌾</div>
              <Card.Title className="fw-bold">No crops planted yet</Card.Title>
              <Card.Text className="text-muted">
                Add crops to track growth stages, seasons, and acreage for {farm.name}.
              </Card.Text>
              <Button variant="success" onClick={handleOpenAddModal}>
                Add Your First Crop
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <Card className="border-0 shadow-sm rounded-3 overflow-hidden">
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="py-3 ps-4">Crop Name</th>
                  <th className="py-3">Season</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Area Used</th>
                  <th className="py-3">Variety / Notes</th>
                  <th className="py-3 pe-4 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {crops.map((crop) => {
                  const cropId = crop._id || crop.id;
                  return (
                    <tr key={cropId}>
                      <td className="ps-4">
                        <strong className="text-dark fs-6">{crop.name}</strong>
                      </td>
                      <td>
                        <span className="text-capitalize">{crop.season || 'N/A'}</span>
                      </td>
                      <td>
                        {getStatusBadge(crop.status)}
                      </td>
                      <td>
                        <strong>{crop.areaUsedAcres !== undefined ? crop.areaUsedAcres : 0}</strong> Acres
                      </td>
                      <td className="text-muted small">
                        {crop.variety ? <span className="d-block">Variety: {crop.variety}</span> : null}
                        {crop.notes || '—'}
                      </td>
                      <td className="pe-4 text-end">
                        <div className="d-inline-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="fw-semibold"
                            onClick={() => handleOpenEditModal(crop)}
                          >
                            ✏️ Edit
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="fw-semibold"
                            onClick={() => handleDeleteCrop(cropId, crop.name)}
                          >
                            🗑️ Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card>
        )}

        {/* Soil Health Advisory Card */}
        <Card className="border-0 shadow-sm rounded-3 mt-5">
          <Card.Header className="bg-white border-0 pt-4 px-4 pb-0">
            <div className="d-flex align-items-center gap-2">
              <span className="fs-4">🧪</span>
              <div>
                <h4 className="fw-bold text-success mb-1">Soil Health Advisory</h4>
                <p className="text-muted small mb-0">
                  Analyze soil characteristics and receive customized agronomic recommendations
                </p>
              </div>
            </div>
          </Card.Header>
          <Card.Body className="p-4">
            <Form onSubmit={handleGenerateSoilAdvice}>
              <Row className="g-3 align-items-end">
                <Col md={5}>
                  <Form.Group controlId="soilTypeSelect">
                    <Form.Label className="fw-semibold">Soil Type</Form.Label>
                    <Form.Select
                      value={soilType}
                      onChange={(e) => setSoilType(e.target.value)}
                    >
                      <option value="Black">Black</option>
                      <option value="Clay">Clay</option>
                      <option value="Sandy">Sandy</option>
                      <option value="Loamy">Loamy</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="soilPhInput">
                    <Form.Label className="fw-semibold">Soil pH (0–14)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.1"
                      min="0"
                      max="14"
                      placeholder="e.g. 6.5"
                      value={soilPh}
                      onChange={(e) => setSoilPh(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Button
                    variant="success"
                    type="submit"
                    className="w-100 fw-semibold py-2"
                  >
                    Generate Advisory
                  </Button>
                </Col>
              </Row>
            </Form>

            {soilAdvice && (
              <Alert variant="info" className="mt-4 mb-0 shadow-sm">
                <h6 className="fw-bold mb-2">Advisory Recommendations:</h6>
                {Array.isArray(soilAdvice) && soilAdvice.length > 1 ? (
                  <ul className="mb-0 ps-3">
                    {soilAdvice.map((item, idx) => (
                      <li key={idx} className="mb-1">{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mb-0">
                    {Array.isArray(soilAdvice) ? soilAdvice[0] : soilAdvice}
                  </p>
                )}
              </Alert>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Add / Edit Crop Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered backdrop="static">
        <Modal.Header closeButton={!submitting}>
          <Modal.Title className="fw-bold text-success">
            {editingCropId ? '✏️ Edit Crop' : `🌾 Add New Crop to ${farm.name}`}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitCrop}>
          <Modal.Body className="p-4">
            {formError && (
              <Alert variant="danger" className="py-2 small">
                {formError}
              </Alert>
            )}

            <Form.Group className="mb-3" controlId="cropName">
              <Form.Label className="fw-semibold">Crop Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                placeholder="e.g. Wheat, Basmati Rice, Cotton"
                value={cropForm.name}
                onChange={handleInputChange}
                required
                disabled={submitting}
                autoFocus
              />
            </Form.Group>

            <Row className="g-2 mb-3">
              <Col sm={6}>
                <Form.Group controlId="cropSeason">
                  <Form.Label className="fw-semibold">Season *</Form.Label>
                  <Form.Select
                    name="season"
                    value={cropForm.season}
                    onChange={handleInputChange}
                    disabled={submitting}
                    required
                  >
                    {SEASONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group controlId="cropStatus">
                  <Form.Label className="fw-semibold">Status *</Form.Label>
                  <Form.Select
                    name="status"
                    value={cropForm.status}
                    onChange={handleInputChange}
                    disabled={submitting}
                    required
                  >
                    {STATUSES.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2 mb-3">
              <Col sm={6}>
                <Form.Group controlId="cropArea">
                  <Form.Label className="fw-semibold">Area Used (Acres)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="0"
                    name="areaUsedAcres"
                    placeholder="e.g. 4.5"
                    value={cropForm.areaUsedAcres}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group controlId="cropVariety">
                  <Form.Label className="fw-semibold">Variety (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="variety"
                    placeholder="e.g. Sharbati, HD-2967"
                    value={cropForm.variety}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-2" controlId="cropNotes">
              <Form.Label className="fw-semibold">Notes (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="notes"
                placeholder="Fertilizer schedule, seed treatment notes, etc."
                value={cropForm.notes}
                onChange={handleInputChange}
                disabled={submitting}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={submitting} className="px-4">
              {submitting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                  {editingCropId ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                editingCropId ? 'Update Crop' : 'Save Crop'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default FarmDetails;
