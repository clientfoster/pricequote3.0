import { FileText, CheckCircle, Clock, Plus, TrendingUp } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/StatCard';
import { QuotationTable } from '@/components/quotations/QuotationTable';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Quotation } from '@/types/quotation';
import { useAuth } from '@/context/AuthContext';

interface DashboardStats {
  totalQuotations: number;
  acceptedQuotations: number;
  pendingQuotations: number;
  totalRevenue: number;
  recentQuotations: Quotation[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user?.role === 'Employee') {
    return <Navigate to={`/employee/${user?._id}/dashboard`} replace />;
  }

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/quotations/stats');
      // Convert string dates to Date objects for recentQuotations
      const data = response.data;
      data.recentQuotations = data.recentQuotations.map((q: any) => ({
        ...q,
        quoteDate: new Date(q.quoteDate),
        validUntil: new Date(q.validUntil),
        createdAt: new Date(q.createdAt),
        updatedAt: new Date(q.updatedAt),
      }));
      return data;
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  // Fallback if data is undefined (shouldn't happen on success, but valid for type safety)
  const dashboardData = stats || {
    totalQuotations: 0,
    acceptedQuotations: 0,
    pendingQuotations: 0,
    totalRevenue: 0,
    recentQuotations: []
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-14 md:top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Welcome back! Here's an overview of your quotations.
              </p>
            </div>
            <Button variant="accent" onClick={() => navigate('/quotations/new')}>
              <Plus className="w-4 h-4" />
              New Quotation
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Quotations"
            value={dashboardData.totalQuotations}
            description="All time"
            icon={FileText}
          />
          <StatCard
            title="Accepted"
            value={dashboardData.acceptedQuotations}
            description={`${dashboardData.totalQuotations > 0 ? Math.round((dashboardData.acceptedQuotations / dashboardData.totalQuotations) * 100) : 0}% success rate`}
            icon={CheckCircle}
          />
          <StatCard
            title="Pending"
            value={dashboardData.pendingQuotations}
            description="Awaiting response"
            icon={Clock}
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(dashboardData.totalRevenue)}
            description="From accepted quotes"
            icon={TrendingUp}
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'draft', 'sent', 'accepted', 'rejected', 'expired'] as const).map((status) => (
            <Button
              key={status}
              size="sm"
              variant="outline"
              onClick={() => navigate(status === 'all' ? '/quotations' : `/quotations?status=${status}`)}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Recent Quotations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold text-foreground">
              Recent Quotations
            </h2>
            <Button variant="ghost" onClick={() => navigate('/quotations')}>
              View all
            </Button>
          </div>
          <QuotationTable quotations={dashboardData.recentQuotations} />
        </div>
      </div>
    </div>
  );
}
