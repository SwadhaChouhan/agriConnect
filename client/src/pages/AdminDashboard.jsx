
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  Container,
  Table,
  Spinner,
  Alert,
  Badge,
  Button,
  Modal,
  Card,
  Form,
} from 'react-bootstrap';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import CreatePestAlertForm from '../components/CreatePestAlertForm';
import Navbar from '../components/Navbar';

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const formatLocation = (location) => {
  if (!location) return '—';
  if (typeof location === 'string') return location;
  // supports an object like { village, district, state }
  return Object.values(location).filter(Boolean).join(', ') || '—';
};

const formatSize = (farm) => {
  if (farm.size === undefined || farm.size === null) return '—';
  return `${farm.size} ${farm.sizeUnit || farm.unit || 'acres'}`;
};

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [farms, setFarms] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Consultation reply state
  const [replyInputs, setReplyInputs] = useState({});
  const [submittingReplyId, setSubmittingReplyId] = useState(null);
  const [consultationSuccess, setConsultationSuccess] = useState('');
  const [consultationError, setConsultationError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, farmsRes, consultRes] = await Promise.all([
          api.get('/users'),
          api.get('/farms'),
          api.get('/consultations'),
        ]);

        // Handles both `[...]` and `{ users: [...] }` / `{ farms: [...] }` responses
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.users || []);
        setFarms(Array.isArray(farmsRes.data) ? farmsRes.data : farmsRes.data.farms || []);
        setConsultations(
          Array.isArray(consultRes.data)
            ? consultRes.data
            : consultRes.data.consultations || []
        );
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load admin data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeleteUser = async (id, name) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${name || 'this user'}"?`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/users/${id}`);
    } catch (err) {
      console.error('Error deleting user:', err);
    } finally {
      // Remove the user from the local state so the table updates immediately
      setUsers((prev) => prev.filter((u) => u._id !== id));
    }
  };

  const handleDeleteFarm = async (id, farmName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${farmName || 'this farm'}"?`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/farms/${id}`);
    } catch (err) {
      console.error('Error deleting farm:', err);
    } finally {
      // Remove the farm from the local state immediately
      setFarms((prev) => prev.filter((f) => f._id !== id));
    }
  };

  const handleReplyChange = (id, text) => {
    setReplyInputs((prev) => ({ ...prev, [id]: text }));
  };

  const handleSendReply = async (id) => {
    const text = replyInputs[id];
    if (!text || !text.trim()) {
      setConsultationError('Please enter a reply message before sending.');
      return;
    }

    setSubmittingReplyId(id);
    setConsultationError('');

    try {
      await api.put(`/consultations/${id}/reply`, {
        adminReply: text.trim(),
      });

      // Update state locally so ticket moves to resolved immediately
      setConsultations((prev) =>
        prev.map((c) =>
          c._id === id
            ? { ...c, status: 'resolved', adminReply: text.trim() }
            : c
        )
      );

      // Clear the reply input for this ticket
      setReplyInputs((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      setConsultationSuccess('Reply sent successfully and ticket resolved!');
      setTimeout(() => setConsultationSuccess(''), 4000);
    } catch (err) {
      console.error('Failed to send consultation reply:', err);
      setConsultationError(
        err.response?.data?.message || 'Failed to send reply. Please try again.'
      );
    } finally {
      setSubmittingReplyId(null);
    }
  };

  const farmerCount = users.filter((u) => u.role === 'farmer').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  const roleChartData = [
    { name: 'Farmers', value: farmerCount, color: '#198754' }, // Green for Farmers
    { name: 'Admins', value: adminCount, color: '#dc3545' },   // Red/Dark for Admins
  ];

  if (loading) {
    return (
      <div className="bg-light min-vh-100">
        <Navbar />
        <Container className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <p className="text-muted mt-2">Loading admin control panel...</p>
        </Container>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100">
      <Navbar />

      <Container className="py-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <h2 className="mb-0 fw-bold text-success">Admin Control Panel</h2>
          <Button
            as={Link}
            to="/admin-inventory"
            variant="success"
            className="fw-semibold px-3 py-2 shadow-sm"
          >
            📦 Manage Marketplace Inventory &rarr;
          </Button>
        </div>

        {/* 👇 ADDED THE FORM HERE 👇 */}
        <CreatePestAlertForm />

        {error && <Alert variant="danger">{error}</Alert>}

        {/* ---------- Users ---------- */}
        <h4 className="mb-3 fw-bold">
          Registered Users <Badge bg="secondary">{users.length}</Badge>
        </h4>

        {/* Pie Chart: Users by Role */}
        {users.length > 0 && (
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
              <h6 className="fw-bold text-muted mb-3 text-center">
                User Distribution by Role (Farmers vs Admins)
              </h6>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={roleChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      innerRadius={45}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value, percent }) =>
                        `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {roleChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        )}

        <div className="table-responsive mb-5 shadow-sm rounded-3">
          <Table striped bordered hover className="mb-0 align-middle">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined Date</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-3">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u, index) => (
                  <tr key={u._id}>
                    <td>{index + 1}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <Badge bg={u.role === 'admin' ? 'danger' : 'success'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td className="text-center">
                      <Button
                        variant="danger"
                        size="sm"
                        className="btn-sm"
                        onClick={() => handleDeleteUser(u._id, u.name)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        {/* ---------- Farms ---------- */}
        <h4 className="mb-3 fw-bold">
          All Farms <Badge bg="secondary">{farms.length}</Badge>
        </h4>
        <div className="table-responsive shadow-sm rounded-3">
          <Table striped bordered hover className="mb-0 align-middle">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Farm Name</th>
                <th>Owner</th>
                <th>Location</th>
                <th>Size</th>
                <th>Soil Type</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {farms.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-3">
                    No farms found.
                  </td>
                </tr>
              ) : (
                farms.map((farm, index) => {
                  // `owner` or `user` must be populated by the backend (name + email)
                  const owner = farm.owner || farm.user;
                  return (
                    <tr key={farm._id}>
                      <td>{index + 1}</td>
                      <td>{farm.name}</td>
                      <td>
                        {owner && typeof owner === 'object' ? (
                          <>
                            {owner.name}
                            <br />
                            <small className="text-muted">{owner.email}</small>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{formatLocation(farm.location)}</td>
                      <td>{formatSize(farm)}</td>
                      <td>{farm.soilType || '—'}</td>
                      <td className="text-center">
                        <Button
                          variant="danger"
                          size="sm"
                          className="btn-sm"
                          onClick={() => handleDeleteFarm(farm._id, farm.name)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>

        {/* ---------- Farmer Consultations ---------- */}
        <div className="d-flex justify-content-between align-items-center mt-5 mb-3">
          <h4 className="mb-0 fw-bold">
            Farmer Consultations{' '}
            <Badge bg="secondary" className="fs-6 ms-1">
              {consultations.length}
            </Badge>
          </h4>
          <span className="text-muted small">
            {consultations.filter((c) => c.status === 'pending').length} Pending Review
          </span>
        </div>

        {consultationSuccess && (
          <Alert variant="success" dismissible onClose={() => setConsultationSuccess('')} className="shadow-sm">
            {consultationSuccess}
          </Alert>
        )}
        {consultationError && (
          <Alert variant="danger" dismissible onClose={() => setConsultationError('')} className="shadow-sm">
            {consultationError}
          </Alert>
        )}

        {/* List of Pending Tickets */}
        {consultations.filter((c) => c.status === 'pending').length === 0 ? (
          <Card className="text-center border-0 shadow-sm p-4 mb-4">
            <Card.Body>
              <div className="fs-2 mb-2">🎉</div>
              <Card.Title className="fw-bold">No Pending Consultations</Card.Title>
              <Card.Text className="text-muted small mb-0">
                All farmer consultation questions have been answered.
              </Card.Text>
            </Card.Body>
          </Card>
        ) : (
          <div className="d-flex flex-column gap-3 mb-4">
            {consultations
              .filter((c) => c.status === 'pending')
              .map((ticket) => (
                <Card key={ticket._id} className="border-0 shadow-sm rounded-3">
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <div>
                        <h5 className="fw-bold text-dark mb-1">{ticket.subject}</h5>
                        <div className="text-muted small">
                          <span>Farmer: <strong>{ticket.farmer?.name || 'Farmer'}</strong></span>
                          <span className="ms-2">({ticket.farmer?.email || 'N/A'})</span>
                          <span className="ms-2">• {formatDate(ticket.createdAt)}</span>
                        </div>
                      </div>
                      <Badge bg="warning" text="dark" className="px-2 py-1">
                        ⏳ Pending Review
                      </Badge>
                    </div>

                    <div className="p-3 bg-light rounded-2 my-3">
                      <span className="fw-semibold text-secondary small d-block mb-1">
                        Farmer Query:
                      </span>
                      <p className="mb-0 text-dark" style={{ whiteSpace: 'pre-wrap' }}>
                        {ticket.message}
                      </p>
                    </div>

                    <Form.Group className="mb-3" controlId={`reply-${ticket._id}`}>
                      <Form.Label className="fw-semibold small">
                        Admin Advisory Reply:
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Type agricultural advice, recommended dosage, or instructions..."
                        value={replyInputs[ticket._id] || ''}
                        onChange={(e) => handleReplyChange(ticket._id, e.target.value)}
                        disabled={submittingReplyId === ticket._id}
                      />
                    </Form.Group>

                    <div className="text-end">
                      <Button
                        variant="success"
                        size="sm"
                        className="px-4 fw-semibold"
                        onClick={() => handleSendReply(ticket._id)}
                        disabled={submittingReplyId === ticket._id}
                      >
                        {submittingReplyId === ticket._id ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                            Sending...
                          </>
                        ) : (
                          'Send Reply'
                        )}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              ))}
          </div>
        )}

        {/* Recently Resolved Consultations */}
        {consultations.filter((c) => c.status === 'resolved').length > 0 && (
          <div className="mt-4">
            <h6 className="fw-bold text-muted mb-3">
              Resolved Consultations ({consultations.filter((c) => c.status === 'resolved').length})
            </h6>
            <div className="d-flex flex-column gap-3">
              {consultations
                .filter((c) => c.status === 'resolved')
                .map((ticket) => (
                  <Card key={ticket._id} className="border-0 shadow-sm rounded-3">
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong className="text-dark">{ticket.subject}</strong>
                        <Badge bg="success">✓ Resolved</Badge>
                      </div>
                      <p className="text-muted small mb-2">{ticket.message}</p>
                      <Alert variant="success" className="mb-0 py-2 small">
                        <strong>Your Reply:</strong> {ticket.adminReply}
                      </Alert>
                    </Card.Body>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default AdminDashboard;
