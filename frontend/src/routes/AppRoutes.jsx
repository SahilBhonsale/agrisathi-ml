import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import { useAuth } from '../context/AuthContext';

// Lazy load components
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const PlantScanner = React.lazy(() => import('../pages/PlantScanner'));
const CareTips = React.lazy(() => import('../pages/CareTips'));
const Marketplace = React.lazy(() => import('../pages/Marketplace'));
const SellProduct = React.lazy(() => import('../pages/SellProduct'));
const MyProducts = React.lazy(() => import('../pages/MyProducts'));
const ProductDetail = React.lazy(() => import('../pages/ProductDetail'));
const EditProduct = React.lazy(() => import('../pages/EditProduct'));
const Chatbot = React.lazy(() => import('../pages/Chatbot'));
const CommunityForum = React.lazy(() => import('../pages/CommunityForum'));
const QuestionDetail = React.lazy(() => import('../pages/QuestionDetail'));
const AskQuestion = React.lazy(() => import('../pages/AskQuestion'));
const Weather = React.lazy(() => import('../pages/Weather'));
const AdminPanel = React.lazy(() => import('../pages/AdminPanel'));
const Profile = React.lazy(() => import('../pages/Profile'));
const Login = React.lazy(() => import('../pages/Login'));
const Signup = React.lazy(() => import('../pages/Signup'));
const NotFound = React.lazy(() => import('../pages/NotFound'));

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Suspense fallback={<div className="loading-screen">🌱 Loading...</div>}>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login />} 
        />
        <Route 
          path="/signup" 
          element={user ? <Navigate to="/" replace /> : <Signup />} 
        />

        {/* Protected Routes */}
        <Route 
          path="/" 
          element={user ? <Dashboard user={user} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/scanner" 
          element={user ? <PlantScanner user={user} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/care-tips" 
          element={user ? <CareTips user={user} /> : <Navigate to="/login" replace />} 
        />
        
        {/* Marketplace Routes */}
        <Route 
          path="/marketplace" 
          element={user ? <Marketplace user={user} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/marketplace/sell" 
          element={user ? <SellProduct user={user} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/marketplace/my-products" 
          element={user ? <MyProducts user={user} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/marketplace/product/:id" 
          element={user ? <ProductDetail user={user} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/marketplace/edit/:id" 
          element={user ? <EditProduct user={user} /> : <Navigate to="/login" replace />} 
        />
        
        <Route 
          path="/chatbot" 
          element={user ? <Chatbot user={user} /> : <Navigate to="/login" replace />} 
        />
        
        {/* Forum Routes */}
        <Route 
          path="/forum" 
          element={user ? <CommunityForum user={user} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/forum/ask" 
          element={user ? <AskQuestion user={user} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/forum/question/:id" 
          element={user ? <QuestionDetail user={user} /> : <Navigate to="/login" replace />} 
        />
        
        <Route 
          path="/weather" 
          element={user ? <Weather user={user} /> : <Navigate to="/login" replace />} 
        />
        
        <Route 
          path="/profile" 
          element={user ? <Profile user={user} /> : <Navigate to="/login" replace />} 
        />

        {/* Admin-only Routes */}
        <Route 
          path="/admin" 
          element={
            user?.isAdmin ? <AdminPanel user={user} /> : <Navigate to="/" replace />
          } 
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
