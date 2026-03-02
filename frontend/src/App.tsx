import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider, useAuth } from "@/context/AuthContext";

// Pages
import Dashboard from "./pages/Dashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import QuotationList from "./pages/QuotationList";
import QuotationDetails from "./pages/QuotationDetails";
import NewQuotation from "./pages/NewQuotation";
import Clients from "./pages/Clients";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SetupPassword from "./pages/SetupPassword";
import UserManagement from "./pages/UserManagement";
import Setup from "./pages/Setup";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ role }: { role?: 'SuperAdmin' | 'Employee' }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  if (!user) {
    return <Navigate to="/quote" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

// Layout Wrapper
const LayoutWrapper = () => (
  <AppLayout>
    <Outlet />
  </AppLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/quote" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/setup-password/:token" element={<SetupPassword />} />
            <Route path="/quote" element={<NewQuotation />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<LayoutWrapper />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/employee/:userId/dashboard" element={<EmployeeDashboard />} />
                <Route path="/employee/:userId/profile" element={<Settings />} />
                <Route path="/quotations" element={<QuotationList />} />
                <Route path="/quotations/new" element={<NewQuotation />} />
                <Route path="/quotations/:id/edit" element={<NewQuotation />} />
                <Route path="/quotations/:id" element={<QuotationDetails />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/profile" element={<Profile />} />

                {/* Admin Only Routes */}
                <Route element={<ProtectedRoute role="SuperAdmin" />}>
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/users" element={<UserManagement />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
