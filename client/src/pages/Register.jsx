import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Check password match dynamically if confirmPassword has content
      if (name === 'confirmPassword' || name === 'password') {
        const other = name === 'confirmPassword' ? updated.password : updated.confirmPassword;
        if (other && value !== other) {
          setPasswordMismatch(true);
        } else {
          setPasswordMismatch(false);
        }
      }
      return updated;
    });
  };

  // Helper to map backend error messages to readable text
  const getErrorMessage = (err) => {
    const rawMsg = err.response?.data?.message;
    if (rawMsg === 'auth.email_taken' || rawMsg === 'auth.email_in_use') {
      return 'An account with this email already exists. Please sign in or use another email.';
    }
    if (rawMsg === 'auth.validation_failed') {
      const fieldErrors = err.response?.data?.errors;
      if (fieldErrors && fieldErrors.length > 0) {
        return fieldErrors.map((e) => e.message).join(', ');
      }
      return 'Validation failed. Password must be at least 8 characters and include at least one uppercase letter and one number.';
    }
    return rawMsg || err.message || 'Registration failed. Please try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Frontend validation: Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setPasswordMismatch(true);
      return;
    }

    setPasswordMismatch(false);
    setIsSubmitting(true);

    try {
      await api.post('/auth/register', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      // Show success alert
      setSuccess('Registration successful! Redirecting to login...');

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100 py-4">
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={10} md={8} lg={6} xl={5}>
          <Card className="shadow-sm border-0 rounded-3">
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-4">
                <span className="fs-1" role="img" aria-label="farmer">👨‍🌾</span>
                <h3 className="fw-bold text-success mt-2 mb-1">Join AgriConnect</h3>
                <p className="text-muted small">Create your free farmer account to get started</p>
              </div>

              {/* Success Alert */}
              {success && (
                <Alert variant="success" className="py-2 text-center shadow-sm">
                  {success}
                </Alert>
              )}

              {/* Error Alert */}
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')} className="py-2 small">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="regName">
                  <Form.Label className="fw-semibold">Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting || Boolean(success)}
                    autoFocus
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="regEmail">
                  <Form.Label className="fw-semibold">Email Address *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="farmer@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting || Boolean(success)}
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="regPassword">
                  <Form.Label className="fw-semibold">Password *</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    placeholder="At least 8 characters, 1 uppercase, 1 number"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={8}
                    disabled={isSubmitting || Boolean(success)}
                  />
                  <Form.Text className="text-muted small">
                    Must be at least 8 characters long, contain an uppercase letter and a number.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4" controlId="regConfirmPassword">
                  <Form.Label className="fw-semibold">Confirm Password *</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    isInvalid={passwordMismatch}
                    disabled={isSubmitting || Boolean(success)}
                  />
                  {passwordMismatch && (
                    <div className="text-danger small mt-1">
                      Passwords do not match.
                    </div>
                  )}
                </Form.Group>

                <Button
                  variant="success"
                  type="submit"
                  className="w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 mb-3"
                  disabled={isSubmitting || passwordMismatch || Boolean(success)}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    'Register as Farmer'
                  )}
                </Button>

                <div className="text-center pt-2 border-top">
                  <span className="text-muted small">Already have an account? </span>
                  <Link to="/login" className="text-success fw-semibold small text-decoration-none">
                    Sign in here
                  </Link>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
