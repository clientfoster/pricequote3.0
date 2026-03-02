import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, Send } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { generateQuotationPDF } from '@/lib/pdfGenerator';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Quotation } from '@/types/quotation';

export default function QuotationDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: quotation, isLoading, error } = useQuery<Quotation>({
        queryKey: ['quotations', id],
        queryFn: async () => {
            const { data } = await api.get(`/quotations/${id}`);
            return data;
        },
        enabled: !!id,
    });

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading quotation details...</div>;
    if (error || !quotation) return <div className="p-8 text-center text-destructive">Failed to load quotation.</div>;

    const formatCurrency = (amountInInr: number, currency: string = 'INR', rate: number = 1) => {
        const locale = currency === 'INR' ? 'en-IN' : 'en-US';
        const converted = currency === 'INR' ? amountInInr : amountInInr * rate;
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
        }).format(converted);
    };

    const showClientDetails = quotation.includeClientDetails !== false;

    return (
        <div className="min-h-screen p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/quotations')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-display font-bold text-foreground">
                                {quotation.quoteNumber}
                            </h1>
                            <StatusBadge status={quotation.status} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Created on {format(new Date(quotation.createdAt), 'dd MMM yyyy')}
                            {quotation.user && ` by ${typeof quotation.user === 'object' ? (quotation.user as any).name : 'Unknown'}`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => generateQuotationPDF(quotation)}>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                    </Button>
                    <Button variant="default" onClick={() => navigate(`/quotations/${id}/edit`)}>
                        Edit
                    </Button>
                    {/* We could add a 'Resend Email' feature later */}
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Col: Details */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Client & Services</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className={`grid ${showClientDetails ? 'grid-cols-2' : 'grid-cols-1'} gap-4 text-sm`}>
                            {showClientDetails && (
                                <div>
                                    <p className="font-semibold mb-1">Bill To</p>
                                    <p className="text-foreground">{quotation.clientName}</p>
                                    <p className="text-muted-foreground">{quotation.companyName}</p>
                                    <p className="text-muted-foreground">{quotation.email}</p>
                                    {quotation.clientReferenceNo && <p className="text-muted-foreground">Reference: {quotation.clientReferenceNo}</p>}
                                    {quotation.clientAddress && <p className="text-muted-foreground">Address: {quotation.clientAddress}</p>}
                                    {quotation.country && <p className="text-muted-foreground">Country: {quotation.country}</p>}
                                    {(quotation.taxIdName || quotation.taxIdValue) && (
                                        <p className="text-muted-foreground">
                                            {(quotation.taxIdName || 'Tax ID')}: {quotation.taxIdValue || '-'}
                                        </p>
                                    )}
                                </div>
                            )}
                            <div>
                                <p className="font-semibold mb-1">Dates</p>
                                <p className="text-muted-foreground">Quote Date: {format(new Date(quotation.quoteDate), 'dd MMM yyyy')}</p>
                                <p className="text-muted-foreground">Valid Until: {format(new Date(quotation.validUntil), 'dd MMM yyyy')}</p>
                            </div>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                <th className="text-left py-3 px-4 font-medium">Service</th>
                                <th className="text-right py-3 px-4 font-medium">
                                    Amount ({quotation.currency || 'INR'})
                                </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {quotation.lineItems.map((item, i) => (
                                        <tr key={i}>
                                            <td className="py-3 px-4">
                                                <p className="font-medium">{item.service}</p>
                                                <p className="text-xs text-muted-foreground">{item.description}</p>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                {item.isFree ? <span className="text-success">FREE</span> : formatCurrency(item.price, quotation.currency || 'INR', quotation.exchangeRate || 1)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Col: Totals */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Pricing Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>{formatCurrency(quotation.subtotal, quotation.currency || 'INR', quotation.exchangeRate || 1)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">GST ({quotation.gstRate}%)</span>
                            <span>{formatCurrency(quotation.gst, quotation.currency || 'INR', quotation.exchangeRate || 1)}</span>
                        </div>
                        {typeof quotation.tax === 'number' && quotation.tax > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tax ({quotation.taxRate || 0}%)</span>
                                <span>{formatCurrency(quotation.tax, quotation.currency || 'INR', quotation.exchangeRate || 1)}</span>
                            </div>
                        )}
                        <div className="pt-4 border-t flex justify-between items-center">
                            <span className="font-semibold">Total</span>
                            <span className="text-xl font-bold text-accent">{formatCurrency(quotation.totalPayable, quotation.currency || 'INR', quotation.exchangeRate || 1)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
