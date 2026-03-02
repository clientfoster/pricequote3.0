import { useNavigate } from 'react-router-dom';
import { Eye, MoreHorizontal, Send, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
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
    if (!confirm('Are you sure you want to delete this quotation?')) return;

    try {
      await api.delete(`/quotations/${id}`);
      toast.success('Quotation deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      // Also potentially invalidate stats
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (error: any) {
      toast.error('Failed to delete quotation');
    }
  };

  return (
    <div className={cn('bg-card rounded-xl shadow-card border border-border/50 overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Quote #
              </th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Client
              </th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Date
              </th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Valid Until
              </th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Amount
              </th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="text-right py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {quotations.map((quotation, index) => (
              <tr
                key={quotation._id}
                className="hover:bg-muted/20 transition-colors cursor-pointer animate-fade-in"
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
                      <DropdownMenuItem>
                        <Send className="mr-2 h-4 w-4" />
                        Send to Client
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        generateQuotationPDF(quotation);
                        toast.success('PDF downloaded successfully');
                        // Potentially update status to sent?
                      }}>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </DropdownMenuItem>
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
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No quotations found</p>
        </div>
      )}
    </div>
  );
}
