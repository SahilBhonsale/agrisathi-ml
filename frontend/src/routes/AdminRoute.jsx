import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function AdminRoute({ user }) {
  return user?.isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}

export default AdminRoute;