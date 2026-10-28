import { Navigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  // Not logged in -> login
  if (!user) return <Navigate to="/login" replace />;

  // Logged in but not an admin (e.g. farmer) -> farmer dashboard
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
};

export default AdminRoute;