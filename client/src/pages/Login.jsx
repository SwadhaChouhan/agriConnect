import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage || i18n.language || 'en';

  // Helper to map backend i18n error keys to user-friendly messages
  const getErrorMessage = (err) => {
    const rawMsg = err.response?.data?.message;
    if (rawMsg === 'auth.invalid_credentials') {
      return 'Invalid email or password. Please try again.';
    }
    if (rawMsg === 'auth.validation_failed') {
      const fieldErrors = err.response?.data?.errors;
      if (fieldErrors && fieldErrors.length > 0) {
        return fieldErrors.map((e) => e.message).join(', ');
      }
      return 'Please provide a valid email and password.';
    }
    if (rawMsg) return rawMsg;
    return err.message || 'Unable to connect to server. Please try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100 py-4">
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={10} md={8} lg={5} xl={4}>
          <Card className="shadow-sm border-0 rounded-3">
            <Card.Body className="p-4 p-md-5 position-relative">
              <div className="d-flex justify-content-end mb-2">
                <Dropdown align="end">
                  <Dropdown.Toggle variant="outline-secondary" size="sm" id="login-lang-dropdown">
                    🌐 {currentLanguage.startsWith('hi') ? 'हिंदी' : 'English'}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => i18n.changeLanguage('en')} active={!currentLanguage.startsWith('hi')}>
                      English (EN)
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => i18n.changeLanguage('hi')} active={currentLanguage.startsWith('hi')}>
                      हिंदी (HI)
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>

              <div className="text-center mb-4">
                <span className="fs-1" role="img" aria-label="sprout">🌾</span>
                <h3 className="fw-bold text-success mt-2 mb-1">AgriConnect</h3>
                <p className="text-muted small">Sign in to manage your farms & crops</p>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')} className="py-2 small">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formEmail">
                  <Form.Label className="fw-semibold">{t('Email')}</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="farmer@agriconnect.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    disabled={isSubmitting}
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="formPassword">
                  <Form.Label className="fw-semibold">{t('Password')}</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </Form.Group>

                <Button
                  variant="success"
                  type="submit"
                  className="w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 mb-3"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    t('Login')
                  )}
                </Button>

                {/* Link to Register page */}
                <div className="text-center pt-3 border-top">
                  <Link to="/register" className="text-success fw-semibold small text-decoration-none">
                    {t("Don't have an account? Sign up")}
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

export default Login;
