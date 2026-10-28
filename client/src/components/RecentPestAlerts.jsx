import { useEffect, useState } from 'react';
import api from '../api/axios'; // Using YOUR custom axios instance
import { Card, Badge, ListGroup, Spinner, Alert } from 'react-bootstrap';

const SEVERITY_STYLES = {
  high: { bg: 'danger', text: 'white', label: 'High' },
  medium: { bg: 'warning', text: 'dark', label: 'Medium' },
  low: { bg: 'success', text: 'white', label: 'Low' },
};

const RecentPestAlerts = ({ limit = 3 }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const { data } = await api.get('/alerts');
        const list = Array.isArray(data) ? data : [];
        setAlerts(list.slice(0, limit)); // Assuming backend sorts newest first
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load pest alerts.');
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [limit]);

  return (
    <Card className="mb-4 shadow-sm border-0">
      <Card.Header as="h5" className="d-flex justify-content-between align-items-center bg-light fw-bold">
        <span>🐛 Recent Pest Alerts</span>
        <Badge bg="secondary">{alerts.length}</Badge>
      </Card.Header>
      <Card.Body>
        {loading && <div className="text-center"><Spinner animation="border" size="sm" /></div>}
        {!loading && error && <Alert variant="danger" className="mb-0">{error}</Alert>}
        {!loading && !error && alerts.length === 0 && <p className="text-muted mb-0">No active pest alerts right now.</p>}
        
        {!loading && !error && alerts.length > 0 && (
          <ListGroup variant="flush">
            {alerts.map((alert) => {
              const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.low;
              return (
                <ListGroup.Item key={alert._id} className="px-0">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <strong>{alert.title}</strong> <Badge bg={style.bg} text={style.text}>{style.label}</Badge>
                      <div className="small text-muted">{alert.region} · {new Date(alert.createdAt).toLocaleDateString()}</div>
                      <p className="mb-0 mt-1">{alert.description}</p>
                    </div>
                  </div>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
};

export default RecentPestAlerts;