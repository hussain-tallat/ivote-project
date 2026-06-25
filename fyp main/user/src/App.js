
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { TranslationProvider } from './contexts/TranslationContext';
import Header from './components/Header';
import Footer from './components/Footer';
import PakistanFlag from './components/PakistanFlag';
import AdminTopHeader from './components/AdminTopHeader';
import { loadFaceApiModels } from './utils/faceCapture';

// Import all pages
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import CNICVerificationPage from './pages/CNICVerificationPage';
import AgeRestrictionPage from './pages/AgeRestrictionPage';
import BiometricSetupPage from './pages/BiometricSetupPage';
import OTPVerificationPage from './pages/OTPVerificationPage';
import SecurityQuestionsPage from './pages/SecurityQuestionsPage';
import LoginPage from './pages/LoginPage';
import UserDashboard from './pages/UserDashboard';
import OngoingElections from './pages/OngoingElections';
import MeetCandidates from './pages/MeetCandidates';
import CastVoteV2 from './pages/CastVoteV2';
import VoteSuccess from './pages/VoteSuccess';
import AdminDashboard from './pages/AdminDashboard';
import ElectionManagement from './pages/ElectionManagement';
import CandidateManagement from './pages/CandidateManagement';
import ReportsExport from './pages/ReportsExport';
import FraudDetectionV2 from './pages/FraudDetectionV2';
import LiveAnalyticsV2 from './pages/LiveAnalyticsV2';
import AccountSuspended from './pages/AccountSuspended';
import AddElection from './pages/AddElection';
import AddCandidate from './pages/AddCandidate';
import AddParty from './pages/AddParty';
import PartiesListPage from './pages/PartiesListPage';
import AvailablePartiesPage from './pages/AvailablePartiesPage';
import AdminAuthPage from './pages/AdminAuthPage';
import VoterManagementPage from './pages/VoterManagementPage';
import AboutPage from './pages/AboutPage';
import HowItWorksPage from './pages/HowItWorksPage';
import HelpFAQsPage from './pages/HelpFAQsPage';
import TermsConditionsPage from './pages/TermsConditionsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ContactPage from './pages/ContactPage';
import SupportChatbot from './pages/SupportChatbot';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ActivityLogsPage from './pages/ActivityLogsPage';
import LostDeviceRecoveryPage from './pages/LostDeviceRecoveryPage';
import SecuritySettingsPage from './pages/SecuritySettingsPage';
import AdminLoginForgotPassword from './pages/AdminLoginForgotPassword';
import PakistanHistoryPage from './pages/PakistanHistoryPage';

import '@fortawesome/fontawesome-free/css/all.min.css';
import './CSS/admin-theme.css';

const RequireRole = ({ role, children }) => {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('userData');
  if (!token || !userRaw) return <Navigate to={role === 'admin' ? '/admin/auth' : '/login'} replace />;
  try {
    const user = JSON.parse(userRaw);
    if (user?.role !== role) return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/user-dashboard'} replace />;
  } catch {
    return <Navigate to={role === 'admin' ? '/admin/auth' : '/login'} replace />;
  }
  return children;
};

const AppShell = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const isAdminAuth = location.pathname === '/admin' || location.pathname === '/admin/auth';

  useEffect(() => {
    loadFaceApiModels().catch((error) => {
      console.warn('[App] Face model preloading skipped:', error?.message || error);
    });
  }, []);

  return (
    <div className="App" style={{
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {!isAdminPath && <PakistanFlag />}
      {/* Keep a clean header only for admin auth, no voter footer in admin area */}
      {!isAdminPath && <Header />}
      {isAdminPath && !isAdminAuth && <AdminTopHeader />}
      {isAdminAuth && (
        <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 24px' }}>
          <h3 style={{ margin: 0, color: '#00563B' }}>Admin Access</h3>
        </header>
      )}
      <main>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/cnic-verification" element={<CNICVerificationPage />} />
          <Route path="/age-restriction" element={<AgeRestrictionPage />} />
          <Route path="/fingerprint-setup" element={<BiometricSetupPage />} />
          <Route path="/register/fingerprint" element={<BiometricSetupPage />} />
          <Route path="/face-recognition" element={<BiometricSetupPage />} />
          <Route path="/register/face" element={<BiometricSetupPage />} />
          <Route path="/biometric-setup" element={<BiometricSetupPage />} />
          <Route path="/otp-verification" element={<OTPVerificationPage />} />
          <Route path="/security-questions" element={<SecurityQuestionsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/recover-access" element={<LostDeviceRecoveryPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/help" element={<HelpFAQsPage />} />
          <Route path="/terms" element={<TermsConditionsPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/support" element={<SupportChatbot />} />
          <Route path="/history" element={<PakistanHistoryPage />} />

          {/* User Pages */}
          <Route path="/user-dashboard" element={<RequireRole role="voter"><UserDashboard /></RequireRole>} />
          <Route path="/elections" element={<RequireRole role="voter"><OngoingElections /></RequireRole>} />
          <Route path="/candidates" element={<RequireRole role="voter"><MeetCandidates /></RequireRole>} />
          <Route path="/parties" element={<RequireRole role="voter"><AvailablePartiesPage /></RequireRole>} />
          <Route path="/vote" element={<RequireRole role="voter"><CastVoteV2 /></RequireRole>} />
          <Route path="/vote-success" element={<RequireRole role="voter"><VoteSuccess /></RequireRole>} />
          <Route path="/activity-logs" element={<RequireRole role="voter"><ActivityLogsPage /></RequireRole>} />
          <Route path="/security-settings" element={<RequireRole role="voter"><SecuritySettingsPage /></RequireRole>} />

          {/* Admin Pages */}
          <Route path="/admin" element={<AdminAuthPage />} />
          <Route path="/admin/auth" element={<AdminAuthPage />} />
          <Route path="/admin/forgot-password" element={<AdminLoginForgotPassword />} />
          <Route path="/admin/dashboard" element={<RequireRole role="admin"><AdminDashboard /></RequireRole>} />
          <Route path="/admin/elections" element={<RequireRole role="admin"><ElectionManagement /></RequireRole>} />
          <Route path="/admin/add-election" element={<RequireRole role="admin"><AddElection /></RequireRole>} />
          <Route path="/admin/candidates" element={<RequireRole role="admin"><CandidateManagement /></RequireRole>} />
          <Route path="/admin/add-candidate" element={<RequireRole role="admin"><AddCandidate /></RequireRole>} />
          <Route path="/admin/parties" element={<RequireRole role="admin"><PartiesListPage /></RequireRole>} />
          <Route path="/admin/add-party" element={<RequireRole role="admin"><AddParty /></RequireRole>} />
          <Route path="/admin/voters" element={<RequireRole role="admin"><VoterManagementPage /></RequireRole>} />
          <Route path="/admin/reports" element={<RequireRole role="admin"><ReportsExport /></RequireRole>} />
          <Route path="/admin/fraud" element={<RequireRole role="admin"><FraudDetectionV2 /></RequireRole>} />
          <Route path="/admin/fraud-detection" element={<RequireRole role="admin"><FraudDetectionV2 /></RequireRole>} />
          <Route path="/admin/live-analytics" element={<RequireRole role="admin"><LiveAnalyticsV2 /></RequireRole>} />

          {/* System Pages */}
          <Route path="/suspended" element={<AccountSuspended />} />
        </Routes>
      </main>
      {!isAdminPath && <Footer />}
    </div>
  );
};

function App() {
  return (
    <TranslationProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppShell />
      </Router>
    </TranslationProvider>
  );
}

export default App;
