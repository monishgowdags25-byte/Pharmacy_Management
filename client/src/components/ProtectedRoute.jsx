import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Loading from './Loading';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!loading && isAuthenticated && allowedRoles && !allowedRoles.includes(user?.role)) {
      showToast('Decline Access. Your account role does not have authorization to view this section.', 'error');
    }
  }, [loading, isAuthenticated, user, allowedRoles, showToast]);

  if (loading) {
    return <Loading fullScreen={true} message="Authenticating session..." />;
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated user to Login
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect unauthorized user to Dashboard Home
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
