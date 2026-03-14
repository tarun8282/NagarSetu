import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import OfficerDashboard from './pages/DepartmentDashboard';
import OfficerComplaints from './pages/OfficerComplaints';
import OfficerAnalytics from './pages/OfficerAnalytics';
import AdminDashboard from './pages/AdminDashboard';
import ComplaintDetail from './pages/ComplaintDetail';
import ComplaintForm from './pages/ComplaintForm';
import HeatmapView from './pages/HeatmapView';
import Emergency from './pages/Emergency';
import Alerts from './pages/Alerts';
import StateDashboard from './pages/StateDashboard';
import { useAuth } from './context/AuthContext';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (location.pathname === '/emergency') {
    return (
      <Routes>
        <Route path="/emergency" element={<Emergency />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFB] dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Citizen */}
          <Route path="/dashboard" element={user ? <CitizenDashboard /> : <Navigate to="/login" />} />
          <Route path="/alerts" element={user ? <Alerts /> : <Navigate to="/login" />} />
          <Route path="/complaint/new" element={user ? <ComplaintForm /> : <Navigate to="/login" />} />
          <Route path="/complaint/:id" element={user ? <ComplaintDetail /> : <Navigate to="/login" />} />

          {/* Officer — all three routes from admin-login branch */}
          <Route path="/officer/dashboard" element={user?.role === 'dept_officer' ? <OfficerDashboard /> : <Navigate to="/login" />} />
          <Route path="/officer/complaints" element={(user?.role === 'dept_officer' || user?.role === 'state_admin' || user?.role === 'mc_admin') ? <OfficerComplaints /> : <Navigate to="/login" />} />
          <Route path="/officer/analytics" element={user?.role === 'dept_officer' ? <OfficerAnalytics /> : <Navigate to="/login" />} />

          {/* Admin Dashboards */}
          <Route path="/admin/dashboard" element={user?.role === 'mc_admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
          <Route path="/state/dashboard" element={user?.role === 'state_admin' ? <StateDashboard /> : <Navigate to="/login" />} />

          <Route path="/heatmap" element={<HeatmapView />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;