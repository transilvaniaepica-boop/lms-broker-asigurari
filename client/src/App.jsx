import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Courses from './pages/Courses';
import Classroom from './pages/Classroom';
import Exam from './pages/Exam';
import LectorProcedures from './pages/LectorProcedures';
import LectorUsers from './pages/LectorUsers';
import LectorAnnual from './pages/LectorAnnual';
import ObserverLive from './pages/ObserverLive';
import Reports from './pages/Reports';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Se încarcă...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/courses" replace />;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Rute Cursanți & Comune */}
          <Route path="/" element={<Navigate to="/courses" replace />} />
          <Route path="/courses" element={
            <ProtectedRoute>
              <Courses />
            </ProtectedRoute>
          } />
          <Route path="/classroom/:courseId" element={
            <ProtectedRoute>
              <Classroom />
            </ProtectedRoute>
          } />
          <Route path="/exam/:testId" element={
            <ProtectedRoute>
              <Exam />
            </ProtectedRoute>
          } />

          {/* Rute Lector */}
          <Route path="/lector/procedures" element={
            <ProtectedRoute allowedRoles={['lector']}>
              <LectorProcedures />
            </ProtectedRoute>
          } />
          <Route path="/lector/users" element={
            <ProtectedRoute allowedRoles={['lector']}>
              <LectorUsers />
            </ProtectedRoute>
          } />
          <Route path="/lector/annual" element={
            <ProtectedRoute allowedRoles={['lector']}>
              <LectorAnnual />
            </ProtectedRoute>
          } />

          {/* Rute Observator & Lector */}
          <Route path="/observer/live" element={
            <ProtectedRoute allowedRoles={['lector', 'observator']}>
              <ObserverLive />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['lector', 'observator']}>
              <Reports />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/courses" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
