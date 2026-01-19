// App.js - Naaber Community Management App
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CommunityProvider } from './contexts/CommunityContext';

// Auth Pages
import {
  LoginPage,
  RegisterPage,
  RegisterMemberPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from './components/Auth';

// Dashboard Components
import PresidentDashboard from './components/Dashboard/PresidentDashboard';
import MemberDashboard from './components/Dashboard/MemberDashboard';

// Flat Management
import FlatManagement from './components/Flats/FlatManagement';
import FlatDetails from './components/Flats/FlatDetails';

// Member Management
import MemberManagement from './components/Members/MemberManagement';

// Announcement Management
import AnnouncementManagement from './components/Announcements/AnnouncementManagement';
import AnnouncementDetail from './components/Announcements/AnnouncementDetail';

// Chat
import CommunityChat from './components/Chat/CommunityChat';

// Messages
import { ConversationList, Conversation } from './components/Messages';

// Maintenance
import { MaintenanceList } from './components/Maintenance';

// Documents
import { DocumentList } from './components/Documents';

// Payments
import { PaymentList } from './components/Payments';

// Events
import { EventList } from './components/Events';

// Meters
import { MeterReadings } from './components/Meters';

// Profile
import { ProfilePage } from './components/Profile';

// Common Components
import NotFound from './components/Pages/NotFound';

// Styles
import './App.css';

// Initialize i18n
import './services/i18n';

// Safari viewport height fix
function setSafeViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Call on mount and resize
if (typeof window !== 'undefined') {
  setSafeViewportHeight();
  window.addEventListener('resize', setSafeViewportHeight);
  window.addEventListener('orientationchange', () => {
    setTimeout(setSafeViewportHeight, 100);
  });
}

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F8F7] flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect based on role
    if (user?.role === 'president') {
      return <Navigate to="/dashboard" replace />;
    } else if (user?.role === 'member') {
      return <Navigate to="/home" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirects authenticated users)
const PublicRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F8F7] flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect based on role
    if (user?.role === 'president') {
      return <Navigate to="/dashboard" replace />;
    } else if (user?.role === 'member') {
      return <Navigate to="/home" replace />;
    }
  }

  return children;
};

// App Content with Routes
function AppContent() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <Navigate to="/login" replace />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register/member/:communityId"
        element={<RegisterMemberPage />}
      />
      <Route
        path="/register/member"
        element={<RegisterMemberPage />}
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password/:token"
        element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        }
      />

      {/* President Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['president']}>
            <PresidentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/flats"
        element={
          <ProtectedRoute allowedRoles={['president']}>
            <FlatManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/flats/:flatId"
        element={
          <ProtectedRoute allowedRoles={['president']}>
            <FlatDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/members"
        element={
          <ProtectedRoute allowedRoles={['president']}>
            <MemberManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/members/pending"
        element={
          <ProtectedRoute allowedRoles={['president']}>
            <MemberManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/announcements"
        element={
          <ProtectedRoute allowedRoles={['president']}>
            <AnnouncementManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/announcements/:id"
        element={
          <ProtectedRoute allowedRoles={['president', 'member']}>
            <AnnouncementDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute allowedRoles={['president', 'member']}>
            <CommunityChat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute allowedRoles={['president', 'member']}>
            <ConversationList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages/:flatId"
        element={
          <ProtectedRoute allowedRoles={['president', 'member']}>
            <Conversation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance"
        element={
          <ProtectedRoute allowedRoles={['president', 'member']}>
            <MaintenanceList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute allowedRoles={['president', 'member']}>
            <DocumentList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute allowedRoles={['president', 'member']}>
            <PaymentList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events"
        element={
          <ProtectedRoute allowedRoles={['president', 'member']}>
            <EventList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/meters"
        element={
          <ProtectedRoute allowedRoles={['president', 'member']}>
            <MeterReadings />
          </ProtectedRoute>
        }
      />

      {/* Profile - accessible by both roles */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['president', 'member']}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Member Routes */}
      <Route
        path="/home"
        element={
          <ProtectedRoute allowedRoles={['member']}>
            <MemberDashboard />
          </ProtectedRoute>
        }
      />

      {/* 404 - Page Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// Main App Component
function App() {
  return (
    <AuthProvider>
      <CommunityProvider>
        <AppContent />
      </CommunityProvider>
    </AuthProvider>
  );
}

export default App;
