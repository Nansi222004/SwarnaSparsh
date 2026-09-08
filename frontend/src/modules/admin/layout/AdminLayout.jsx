import { Outlet, Navigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { useAuth } from '../../../context/AuthContext';

const AdminLayout = () => {
    const { user, loading } = useAuth();

    if (loading) return null;

    // Check if user is logged in AND is an admin
    if (!user || user.role !== 'admin') {
        return <Navigate to="/admin/login" replace />;
    }

    return (
        <div className="bg-[#fcfcfc]">
            {/* Sidebar — already fixed left-0 top-0 w-64 h-screen inside AdminSidebar */}
            <AdminSidebar />

            {/* Header — pinned to top, sits right of the 256px sidebar, NEVER scrolls */}
            <div style={{ position: 'fixed', top: 0, left: '256px', right: 0, zIndex: 40 }}>
                <AdminHeader />
            </div>

            {/* Main content — starts below header (80px), left of sidebar (256px), scrolls on its own */}
            <main
                className="overflow-y-auto p-8 bg-[#fcfcfc]"
                style={{ position: 'fixed', top: '80px', left: '256px', right: 0, bottom: 0 }}
            >
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
