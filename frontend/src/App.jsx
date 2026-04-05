import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import HomePage        from './pages/HomePage';
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import SearchPage      from './pages/SearchPage';
import PropertyDetail  from './pages/PropertyDetail';
import FavoritesPage   from './pages/FavoritesPage';
import ChatPage        from './pages/ChatPage';
import NotificationsPage from './pages/NotificationsPage';

// Owner
import OwnerDashboard  from './pages/owner/OwnerDashboard';
import OwnerProperties from './pages/owner/OwnerProperties';
import OwnerInquiries  from './pages/owner/OwnerInquiries';
import CreateProperty  from './pages/owner/CreateProperty';
import EditProperty    from './pages/owner/EditProperty';
import PendingApproval from './pages/PendingApproval';

// Admin
import AdminDashboard    from './pages/admin/AdminDashboard';
import AdminUsers        from './pages/admin/AdminUsers';
import AdminProperties   from './pages/admin/AdminProperties';

// Misc
import UnauthorizedPage  from './pages/UnauthorizedPage';

function Layout({ children }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-dark)' }}>
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1a2e',
                color: '#f1f5f9',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '12px',
              },
            }}
          />
          <Routes>
            {/* Public */}
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/pending-approval" element={<PendingApproval />} />

            {/* Public with Navbar */}
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route path="/search" element={<Layout><SearchPage /></Layout>} />
            <Route path="/properties/:id" element={<Layout><PropertyDetail /></Layout>} />

            {/* Authenticated user routes */}
            <Route element={<ProtectedRoute allowedRoles={['user', 'owner', 'admin']} />}>
              <Route path="/favorites" element={<Layout><FavoritesPage /></Layout>} />
              <Route path="/chat" element={<Layout><ChatPage /></Layout>} />
              <Route path="/chat/:userId" element={<Layout><ChatPage /></Layout>} />
              <Route path="/notifications" element={<Layout><NotificationsPage /></Layout>} />
            </Route>

            {/* Owner routes */}
            <Route element={<ProtectedRoute allowedRoles={['owner']} requireApproved />}>
              <Route path="/owner" element={<Layout><OwnerDashboard /></Layout>} />
              <Route path="/owner/properties" element={<Layout><OwnerProperties /></Layout>} />
              <Route path="/owner/inquiries" element={<Layout><OwnerInquiries /></Layout>} />
              <Route path="/owner/properties/new" element={<Layout><CreateProperty /></Layout>} />
              <Route path="/owner/properties/edit/:id" element={<Layout><EditProperty /></Layout>} />
            </Route>

            {/* Admin routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
              <Route path="/admin/users" element={<Layout><AdminUsers /></Layout>} />
              <Route path="/admin/properties" element={<Layout><AdminProperties /></Layout>} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
