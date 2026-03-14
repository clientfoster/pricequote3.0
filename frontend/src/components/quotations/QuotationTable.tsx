import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Eye, MoreHorizontal, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { generateQuotationPDF } from '@/lib/pdfGenerator';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Quotation } from '@/types/quotation';

interface QuotationTableProps {
  quotations: Quotation[];
  className?: string;
}

export function QuotationTable({ quotations, className }: QuotationTableProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const formatCurrency = (amountInInr: number, currency: string = 'INR', rate: number = 1) => {
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    const converted = currency === 'INR' ? amountInInr : amountInInr * rate;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(converted);
  };

  const handleDelete = async (id: string) => {
    const target = quotations.find((item) => item._id === id) || null;
    setDeleteTarget(target);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await api.delete(`/quotations/${deleteTarget._id}`);
      toast.success('Quotation deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      // Also potentially invalidate stats
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (error: any) {
      toast.error('Failed to delete quotation');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const updateStatus = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      setStatusUpdatingId(id);
      await api.put(`/quotations/${id}`, { status });
      toast.success(`Marked as ${status}`);
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <div className={cn('bg-card rounded-xl shadow-card border border-border/50 overflow-hidden', className)}>
      <div className="sm:hidden divide-y divide-border">
        {quotations.map((quotation) => (
          <div
            key={quotation._id}
            className="p-4 space-y-3"
            onClick={() => navigate(`/quotations/${quotation._id}`)}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Quote #</p>
                <p className="font-mono text-sm font-semibold text-foreground">{quotation.quoteNumber}</p>
              </div>
              <StatusBadge status={quotation.status} />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">{quotation.clientName}</p>
              <p className="text-sm text-muted-foreground">{quotation.companyName}</p>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{format(new Date(quotation.quoteDate), 'dd MMM yyyy')}</span>
              <span>{formatCurrency(quotation.totalPayable, quotation.currency || 'INR', quotation.exchangeRate || 1)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  generateQuotationPDF(quotation);
                  toast.success('PDF downloaded successfully');
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(quotation._id);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        ))}
        {quotations.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-muted-foreground">No quotations found</p>
          </div>
        )}
      </div>
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="sticky top-0 z-10 bg-muted/70 backdrop-blur text-left py-3 px-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Quote #
              </th>
              <th className="sticky top-0 z-10 bg-muted/70 backdrop-blur text-left py-3 px-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Client
              </th>
              <th className="sticky top-0 z-10 bg-muted/70 backdrop-blur text-left py-3 px-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Date
              </th>
              <th className="sticky top-0 z-10 bg-muted/70 backdrop-blur text-left py-3 px-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Valid Until
              </th>
              <th className="sticky top-0 z-10 bg-muted/70 backdrop-blur text-left py-3 px-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Amount
              </th>
              <th className="sticky top-0 z-10 bg-muted/70 backdrop-blur text-left py-3 px-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="sticky top-0 z-10 bg-muted/70 backdrop-blur text-right py-3 px-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {quotations.map((quotation, index) => (
              <tr
                key={quotation._id}
                className="hover:bg-muted/30 transition-colors cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => navigate(`/quotations/${quotation._id}`)}
              >
                <td className="py-4 px-6">
                  <span className="font-mono text-sm font-medium text-foreground">
                    {quotation.quoteNumber}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div>
                    <p className="font-medium text-foreground">{quotation.clientName}</p>
                    <p className="text-sm text-muted-foreground">{quotation.companyName}</p>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-muted-foreground">
                  {format(new Date(quotation.quoteDate), 'dd MMM yyyy')}
                </td>
                <td className="py-4 px-6 text-sm text-muted-foreground">
                  {format(new Date(quotation.validUntil), 'dd MMM yyyy')}
                </td>
                <td className="py-4 px-6">
                  <span className="font-semibold text-foreground">
                          {formatCurrency(quotation.totalPayable, quotation.currency || 'INR', quotation.exchangeRate || 1)}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <StatusBadge status={quotation.status} />
                </td>
                <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => navigate(`/quotations/${quotation._id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        generateQuotationPDF(quotation);
                        toast.success('PDF downloaded successfully');
                        // Potentially update status to sent?
                      }}>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </DropdownMenuItem>
                      {quotation.status !== 'accepted' && (
                        <DropdownMenuItem
                          onClick={() => updateStatus(quotation._id, 'accepted')}
                          disabled={statusUpdatingId === quotation._id}
                        >
                          Mark Accepted
                        </DropdownMenuItem>
                      )}
                      {quotation.status !== 'rejected' && (
                        <DropdownMenuItem
                          onClick={() => updateStatus(quotation._id, 'rejected')}
                          disabled={statusUpdatingId === quotation._id}
                        >
                          Mark Rejected
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(quotation._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {quotations.length === 0 && (
        <div className="hidden sm:block py-12 text-center">
          <p className="text-muted-foreground">No quotations found</p>
        </div>
      )}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete quotation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the quotation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
