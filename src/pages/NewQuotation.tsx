import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Send, Download } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { COMPANY_INFO, DEFAULT_LINE_ITEMS, type LineItem, type Quotation } from '@/types/quotation';
import { generateQuotationPDF } from '@/lib/pdfGenerator';
import { toast } from 'sonner';

interface FormLineItem extends Omit<LineItem, 'id'> {
  id: string;
}

export default function NewQuotation() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [quoteDate, setQuoteDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [validUntil, setValidUntil] = useState(format(addDays(new Date(), 15), 'yyyy-MM-dd'));
  const [includeGst, setIncludeGst] = useState(true);
  const [gstRate, setGstRate] = useState(18);

  // Line items with default items
  const [lineItems, setLineItems] = useState<FormLineItem[]>(
    DEFAULT_LINE_ITEMS.map((item, index) => ({
      ...item,
      id: `item-${index}`,
    }))
  );

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: `item-${Date.now()}`,
        service: '',
        description: '',
        price: 0,
        isFree: false,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof FormLineItem, value: string | number | boolean) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
              ...(field === 'isFree' && value === true ? { price: 0 } : {}),
            }
          : item
      )
    );
  };

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => sum + (item.isFree ? 0 : item.price), 0);
  const gstAmount = includeGst ? (subtotal * gstRate) / 100 : 0;
  const totalPayable = subtotal + gstAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSaveDraft = () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      toast.success('Quotation saved as draft');
      setIsSubmitting(false);
      navigate('/quotations');
    }, 1000);
  };

  const handleSend = () => {
    if (!clientName || !companyName || !contactNumber) {
      toast.error('Please fill in all required fields');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      toast.success('Quotation sent successfully');
      setIsSubmitting(false);
      navigate('/quotations');
    }, 1000);
  };

  const handleDownloadPDF = () => {
    if (!clientName || !companyName) {
      toast.error('Please fill in client details first');
      return;
    }

    const quotation: Quotation = {
      id: `temp-${Date.now()}`,
      quoteNumber: `QT-${format(new Date(), 'yyyy')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      header: {
        clientName,
        companyName,
        quoteDate: new Date(quoteDate),
        validUntil: new Date(validUntil),
        contactNumber,
        email: email || undefined,
      },
      lineItems: lineItems.map((item) => ({
        id: item.id,
        service: item.service,
        description: item.description,
        price: item.price,
        isFree: item.isFree,
      })),
      totals: {
        subtotal,
        gst: gstAmount,
        gstRate,
        totalPayable,
      },
      status: 'draft',
      createdBy: 'current-user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    generateQuotationPDF(quotation);
    toast.success('PDF downloaded successfully');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">New Quotation</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a new quotation for your client.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
                <Save className="w-4 h-4" />
                Save Draft
              </Button>
              <Button variant="accent" onClick={handleSend} disabled={isSubmitting}>
                <Send className="w-4 h-4" />
                Send Quotation
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 lg:px-8 py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Company Info Banner */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                <div>
                  <span className="font-semibold text-foreground">{COMPANY_INFO.name}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-muted-foreground">
                  <span>GSTIN: {COMPANY_INFO.gstin}</span>
                  <span>CIN: {COMPANY_INFO.cin}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Client Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Client Details</CardTitle>
                  <CardDescription>Enter the client information for this quotation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientName">
                        Client Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="clientName"
                        placeholder="Enter client name"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyName">
                        Company Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="companyName"
                        placeholder="Enter company name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactNumber">
                        Contact Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="contactNumber"
                        placeholder="+91 XXXXX XXXXX"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="client@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quoteDate">Quote Date</Label>
                      <Input
                        id="quoteDate"
                        type="date"
                        value={quoteDate}
                        onChange={(e) => setQuoteDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="validUntil">Valid Until</Label>
                      <Input
                        id="validUntil"
                        type="date"
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Line Items */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Services & Pricing</CardTitle>
                      <CardDescription>Add the services you're quoting for.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={addLineItem}>
                      <Plus className="w-4 h-4" />
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lineItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-4 animate-fade-in"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Item #{index + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeLineItem(item.id)}
                          disabled={lineItems.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Service Name</Label>
                          <Input
                            placeholder="e.g., Website Design"
                            value={item.service}
                            onChange={(e) => updateLineItem(item.id, 'service', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Price (₹)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.isFree ? '' : item.price || ''}
                            onChange={(e) =>
                              updateLineItem(item.id, 'price', parseInt(e.target.value) || 0)
                            }
                            disabled={item.isFree}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label>Description</Label>
                          <Input
                            placeholder="Brief description of the service"
                            value={item.description}
                            onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-2 flex items-center gap-2">
                          <Checkbox
                            id={`free-${item.id}`}
                            checked={item.isFree}
                            onCheckedChange={(checked) =>
                              updateLineItem(item.id, 'isFree', checked === true)
                            }
                          />
                          <Label htmlFor={`free-${item.id}`} className="text-sm cursor-pointer">
                            Mark as FREE (complimentary service)
                          </Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              {/* Pricing Summary */}
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Line items list */}
                  <div className="space-y-2">
                    {lineItems
                      .filter((item) => item.service)
                      .map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate max-w-[60%]">
                            {item.service}
                          </span>
                          <span className={item.isFree ? 'text-success font-medium' : ''}>
                            {item.isFree ? 'FREE' : formatCurrency(item.price)}
                          </span>
                        </div>
                      ))}
                  </div>

                  <Separator />

                  {/* Subtotal */}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>

                  {/* GST */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="includeGst"
                        checked={includeGst}
                        onCheckedChange={(checked) => setIncludeGst(checked === true)}
                      />
                      <Label htmlFor="includeGst" className="text-sm cursor-pointer">
                        Include GST ({gstRate}%)
                      </Label>
                    </div>
                    <span className="text-sm">{formatCurrency(gstAmount)}</span>
                  </div>

                  <Separator />

                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Payable</span>
                    <span className="text-xl font-display font-bold text-accent">
                      {formatCurrency(totalPayable)}
                    </span>
                  </div>

                  {/* Terms */}
                  <div className="pt-4 space-y-2 text-xs text-muted-foreground">
                    <p>• Timeline: {COMPANY_INFO.timeline}</p>
                    <p>• {COMPANY_INFO.paymentTerms}</p>
                    <p>• Bank: {COMPANY_INFO.bankName}</p>
                    <p>• IFSC: {COMPANY_INFO.ifsc}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
