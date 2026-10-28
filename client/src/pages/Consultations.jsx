import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Badge,
} from 'react-bootstrap';
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

const Consultations = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // New question form state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/consultations/my');
      setConsultations(res.data.consultations || []);
    } catch (err) {
      console.error('Failed to load consultations:', err);
      setError(err.response?.data?.message || 'Failed to load consultation history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setFormError('Please enter both a subject and question details.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      await api.post('/consultations', {
        subject: subject.trim(),
        message: message.trim(),
      });

      setSubject('');
      setMessage('');
      setSuccessMsg('Your question has been submitted to agricultural experts!');
      await fetchConsultations();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Failed to submit consultation:', err);
      setFormError(err.response?.data?.message || 'Failed to submit question. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-light min-vh-100">
      <Navbar />

      <Container className="py-4">
        {/* Header */}
        <div className="mb-4">
          <h2 className="fw-bold text-success mb-1">👨‍🌾 Expert Consultation</h2>
          <p className="text-muted mb-0">
            Ask questions directly to agricultural specialists and track expert advisory answers.
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

        <Row className="g-4">
          {/* Form: Ask a New Question */}
          <Col lg={5}>
            <Card className="border-0 shadow-sm rounded-3">
              <Card.Header className="bg-white border-0 pt-4 px-4 pb-0">
                <h4 className="fw-bold text-success mb-1">Ask a Specialist</h4>
                <p className="text-muted small mb-0">
                  Provide details about your crop symptoms, soil, or farming query.
                </p>
              </Card.Header>
              <Card.Body className="p-4">
                {formError && (
                  <Alert variant="danger" className="py-2 small">
                    {formError}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="consultationSubject">
                    <Form.Label className="fw-semibold">Subject *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Yellow leaves on wheat, Pest on cotton"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      disabled={submitting}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="consultationMessage">
                    <Form.Label className="fw-semibold">Question / Details *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      placeholder="Describe the issue, soil type, crop stage, or fertilizers applied..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      disabled={submitting}
                    />
                  </Form.Group>

                  <Button
                    variant="success"
                    type="submit"
                    className="w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      '📩 Submit Question'
                    )}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Past Questions & Replies List */}
          <Col lg={7}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="fw-bold mb-0">
                Your Past Consultations{' '}
                <Badge bg="secondary" className="fs-6 ms-1">
                  {consultations.length}
                </Badge>
              </h4>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="success" />
                <p className="text-muted mt-2">Loading your consultations...</p>
              </div>
            ) : consultations.length === 0 ? (
              <Card className="text-center border-0 shadow-sm p-5">
                <Card.Body>
                  <div className="fs-1 mb-3">💬</div>
                  <Card.Title className="fw-bold">No consultations yet</Card.Title>
                  <Card.Text className="text-muted">
                    Have questions about crops, soil health, or diseases? Submit your question on the left to receive advice from agricultural experts.
                  </Card.Text>
                </Card.Body>
              </Card>
            ) : (
              <div className="d-flex flex-column gap-3">
                {consultations.map((ticket) => {
                  const isResolved = ticket.status === 'resolved';

                  return (
                    <Card key={ticket._id} className="border-0 shadow-sm rounded-3">
                      <Card.Body className="p-4">
                        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                          <h5 className="fw-bold text-dark mb-0">{ticket.subject}</h5>
                          <Badge
                            bg={isResolved ? 'success' : 'warning'}
                            text={isResolved ? 'white' : 'dark'}
                            className="text-capitalize px-2 py-1"
                          >
                            {isResolved ? '✓ Resolved' : '⏳ Pending Review'}
                          </Badge>
                        </div>

                        <p className="text-muted small mb-3">
                          Submitted on: {formatDate(ticket.createdAt)}
                        </p>

                        <div className="p-3 bg-light rounded-2 mb-3">
                          <span className="fw-semibold text-secondary small d-block mb-1">
                            Your Query:
                          </span>
                          <p className="mb-0 text-dark" style={{ whiteSpace: 'pre-wrap' }}>
                            {ticket.message}
                          </p>
                        </div>

                        {/* Resolved: show adminReply in a green success box */}
                        {isResolved ? (
                          <Alert variant="success" className="mb-0 border-0 shadow-sm">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <span className="fs-5">🌿</span>
                              <strong className="fs-6">Agricultural Specialist Advisory:</strong>
                            </div>
                            <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                              {ticket.adminReply || 'No reply text provided.'}
                            </p>
                            {ticket.updatedAt && (
                              <div className="text-success-emphasis small mt-2 opacity-75">
                                Answered on: {formatDate(ticket.updatedAt)}
                              </div>
                            )}
                          </Alert>
                        ) : (
                          <div className="text-muted small fst-italic">
                            ⏳ An agronomist or admin is reviewing your query. You will see the expert advice here once answered.
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  );
                })}
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Consultations;
