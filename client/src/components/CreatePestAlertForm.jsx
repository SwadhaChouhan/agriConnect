import { useState } from 'react';
import api from '../api/axios'; // Using YOUR custom axios instance
import { Card, Form, Button, Alert, Row, Col, Spinner } from 'react-bootstrap';

const initialForm = { title: '', description: '', severity: 'medium', region: '' };

const CreatePestAlertForm = ({ onCreated }) => {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback({ type: '', text: '' });

    try {
      // No need for headers/tokens, your api instance handles it!
      const { data } = await api.post('/alerts', form);
      setFeedback({ type: 'success', text: `Alert "${data.title}" published.` });
      setForm(initialForm);
      if (onCreated) onCreated(data);
    } catch (err) {
      setFeedback({
        type: 'danger',
        text: err.response?.data?.message || 'Failed to create alert.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mb-5 shadow-sm border-0">
      <Card.Header as="h5" className="bg-warning bg-opacity-25 fw-bold">Create Pest Alert</Card.Header>
      <Card.Body>
        {feedback.text && (
          <Alert variant={feedback.type} dismissible onClose={() => setFeedback({ type: '', text: '' })}>
            {feedback.text}
          </Alert>
        )}
        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={8}>
              <Form.Group>
                <Form.Label>Title</Form.Label>
                <Form.Control type="text" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Fall armyworm outbreak" required />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Region</Form.Label>
                <Form.Control type="text" name="region" value={form.region} onChange={handleChange} placeholder="e.g. Malwa" required />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Severity</Form.Label>
                <Form.Select name="severity" value={form.severity} onChange={handleChange} required>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group>
                <Form.Label>Description</Form.Label>
                <Form.Control as="textarea" rows={2} name="description" value={form.description} onChange={handleChange} placeholder="What farmers should look for..." required />
              </Form.Group>
            </Col>
            <Col xs={12} className="text-end">
              <Button type="submit" variant="warning" disabled={submitting} className="fw-bold">
                {submitting ? <><Spinner size="sm" className="me-2" /> Publishing...</> : 'Publish Alert'}
              </Button>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default CreatePestAlertForm;