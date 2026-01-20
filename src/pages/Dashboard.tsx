import { FileText, CheckCircle, Clock, XCircle, Plus, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/StatCard';
import { QuotationTable } from '@/components/quotations/QuotationTable';
import { mockQuotations } from '@/data/mockQuotations';

export default function Dashboard() {
  const navigate = useNavigate();

  // Calculate stats from mock data
  const totalQuotations = mockQuotations.length;
  const acceptedQuotations = mockQuotations.filter((q) => q.status === 'accepted').length;
  const pendingQuotations = mockQuotations.filter((q) => q.status === 'sent' || q.status === 'draft').length;
  const totalRevenue = mockQuotations
    .filter((q) => q.status === 'accepted')
    .reduce((sum, q) => sum + q.totals.totalPayable, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get recent quotations (last 5)
  const recentQuotations = [...mockQuotations]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
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
      <div className="px-6 lg:px-8 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Quotations"
            value={totalQuotations}
            description="All time"
            icon={FileText}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Accepted"
            value={acceptedQuotations}
            description={`${Math.round((acceptedQuotations / totalQuotations) * 100)}% success rate`}
            icon={CheckCircle}
          />
          <StatCard
            title="Pending"
            value={pendingQuotations}
            description="Awaiting response"
            icon={Clock}
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            description="From accepted quotes"
            icon={TrendingUp}
            trend={{ value: 8, isPositive: true }}
          />
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
          <QuotationTable quotations={recentQuotations} />
        </div>
      </div>
    </div>
  );
}
