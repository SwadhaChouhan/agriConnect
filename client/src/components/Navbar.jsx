import React from 'react';
import { Navbar as BsNavbar, Container, Nav, Button, Badge, Dropdown } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const currentLanguage = i18n.resolvedLanguage || i18n.language || 'en';

  return (
    <BsNavbar bg="success" variant="dark" expand="lg" className="shadow-sm">
      <Container>
        <BsNavbar.Brand as={Link} to="/dashboard" className="fw-bold d-flex align-items-center gap-2">
          <span>🌾</span> AgriConnect
        </BsNavbar.Brand>
        <BsNavbar.Toggle aria-controls="dashboard-navbar-nav" />
        <BsNavbar.Collapse id="dashboard-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/dashboard" active={location.pathname === '/dashboard'}>
              {t('Dashboard')}
            </Nav.Link>
            <Nav.Link as={Link} to="/farms" active={location.pathname === '/farms'}>
              {t('My Farms')}
            </Nav.Link>
            {(!user || user.role === 'farmer') && (
              <>
                <Nav.Link as={Link} to="/marketplace" active={location.pathname === '/marketplace'}>
                  🛒 Marketplace
                </Nav.Link>
                <Nav.Link as={Link} to="/orders" active={location.pathname === '/orders'}>
                  📦 My Orders
                </Nav.Link>
                <Nav.Link as={Link} to="/consultations" active={location.pathname === '/consultations'}>
                  💬 Consultations
                </Nav.Link>
              </>
            )}
            {user?.role === 'admin' && (
              <Nav.Link as={Link} to="/admin-inventory" active={location.pathname === '/admin-inventory'}>
                📦 Inventory
              </Nav.Link>
            )}
          </Nav>
          <Nav className="d-flex align-items-center gap-3">
            {/* Language Switcher */}
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-light" size="sm" id="language-dropdown" className="d-flex align-items-center gap-1">
                🌐 {currentLanguage.startsWith('hi') ? 'हिंदी (HI)' : 'English (EN)'}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item
                  active={!currentLanguage.startsWith('hi')}
                  onClick={() => i18n.changeLanguage('en')}
                >
                  English (EN)
                </Dropdown.Item>
                <Dropdown.Item
                  active={currentLanguage.startsWith('hi')}
                  onClick={() => i18n.changeLanguage('hi')}
                >
                  हिंदी (HI)
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            {user && (
              <span className="text-white-50 small">
                {t('Signed in as')} <strong className="text-white">{user.name}</strong>{' '}
                <Badge bg="warning" text="dark" className="text-capitalize ms-1">
                  {user.role}
                </Badge>
              </span>
            )}
            <Button
              variant="outline-light"
              size="sm"
              onClick={handleLogout}
              className="px-3"
            >
              {t('Logout')}
            </Button>
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
};

export default Navbar;
