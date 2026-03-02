import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Send, Download, Check, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COMPANY_INFO, DEFAULT_LINE_ITEMS, type LineItem, type Quotation } from '@/types/quotation';
import { generateQuotationPDF, getQuotationPDFBlob } from '@/lib/pdfGenerator';
import { toast } from 'sonner';
import api from '@/lib/api'; // Added API import

interface FormLineItem extends Omit<LineItem, 'id'> {
  id: string;
}

interface Client {
  _id: string;
  name: string;
  companyName: string;
  email?: string;
  contactNumber?: string;
}

const ensureBullets = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('•')) return text;
  return `• ${text.replace(/\n+/g, '\n• ')}`;
};

const CURRENCY_OPTIONS = [
  { code: 'INR', label: 'INR - Indian Rupee' },
  { code: 'USD', label: 'USD - US Dollar' },
  { code: 'EUR', label: 'EUR - Euro' },
  { code: 'GBP', label: 'GBP - British Pound' },
  { code: 'AED', label: 'AED - UAE Dirham' },
  { code: 'AUD', label: 'AUD - Australian Dollar' },
  { code: 'CAD', label: 'CAD - Canadian Dollar' },
  { code: 'SGD', label: 'SGD - Singapore Dollar' },
];

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
  const [includeTax, setIncludeTax] = useState(false);
  const [taxRate, setTaxRate] = useState(10);
  const [includeCompanyName, setIncludeCompanyName] = useState(true);
  const [includeGstin, setIncludeGstin] = useState(true);
  const [includeCin, setIncludeCin] = useState(true);
  const [includeClientDetails, setIncludeClientDetails] = useState(true);
  const [currency, setCurrency] = useState('INR');
  const [exchangeRate, setExchangeRate] = useState<number | null>(1);
  const [isRateLoading, setIsRateLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isClientsLoading, setIsClientsLoading] = useState(true);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showClientResults, setShowClientResults] = useState(false);

  // Line items with default items
  const [lineItems, setLineItems] = useState<FormLineItem[]>(
    DEFAULT_LINE_ITEMS.map((item, index) => ({
      ...item,
      description: ensureBullets(item.description),
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

  const moveLineItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= lineItems.length) return;
    const updated = [...lineItems];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setLineItems(updated);
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

  const handleDescriptionKeyDown = (id: string, e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    const target = e.currentTarget;
    const value = target.value;
    const start = target.selectionStart ?? value.length;
    const before = value.slice(0, start);
    const after = value.slice(start);

    e.preventDefault();
    const insert = `\n• `;
    const nextValue = `${before}${insert}${after}`;
    updateLineItem(id, 'description', nextValue);

    requestAnimationFrame(() => {
      const pos = start + insert.length;
      target.selectionStart = pos;
      target.selectionEnd = pos;
    });
  };

  const handleDescriptionFocus = (id: string, e: React.FocusEvent<HTMLTextAreaElement>) => {
    const value = e.currentTarget.value;
    if (value.trim().length === 0) {
      const nextValue = '• ';
      updateLineItem(id, 'description', nextValue);
      requestAnimationFrame(() => {
        e.currentTarget.selectionStart = nextValue.length;
        e.currentTarget.selectionEnd = nextValue.length;
      });
    }
  };

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => sum + (item.isFree ? 0 : item.price), 0);
  const gstAmount = includeGst ? (subtotal * gstRate) / 100 : 0;
  const taxAmount = includeTax ? (subtotal * taxRate) / 100 : 0;
  const totalPayable = subtotal + gstAmount + taxAmount;

  const formatCurrency = (amountInInr: number) => {
    if (currency !== 'INR' && exchangeRate === null) return '...';
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    const converted = currency === 'INR' ? amountInInr : amountInInr * (exchangeRate || 1);
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(converted);
  };

  const handleSaveDraft = async () => {
    if (currency !== 'INR' && exchangeRate === null) {
      toast.error('Exchange rate not loaded. Please try again.');
      return;
    }
    setIsSubmitting(true);
    try {
      const quotationData = prepareQuotationData('draft');
      await api.post('/quotations', quotationData);
      toast.success('Quotation saved as draft');
      navigate('/quotations');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSend = async () => {
    if (includeClientDetails && (!clientName || !companyName || !contactNumber)) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (currency !== 'INR' && exchangeRate === null) {
      toast.error('Exchange rate not loaded. Please try again.');
      return;
    }
    setIsSubmitting(true);
    try {
      const apiPayload = prepareQuotationData('sent');

      // Construct Quotation object for PDF Generator (now flat structure)
      const quotationForPDF: Quotation = {
        _id: 'temp-pdf-id',
        quoteNumber: apiPayload.quoteNumber,
        clientName: apiPayload.clientName,
        companyName: apiPayload.companyName,
        contactNumber: apiPayload.contactNumber,
        email: apiPayload.email,
        quoteDate: new Date(apiPayload.quoteDate),
        validUntil: new Date(apiPayload.validUntil),
        includeCompanyName: apiPayload.includeCompanyName,
        includeGstin: apiPayload.includeGstin,
        includeCin: apiPayload.includeCin,
        includeClientDetails: apiPayload.includeClientDetails,
        currency: apiPayload.currency,
        exchangeRate: apiPayload.exchangeRate,
        lineItems: lineItems.map((item) => ({
          id: item.id,
          service: item.service,
          description: item.description,
          price: item.price,
          isFree: item.isFree
        })),
        subtotal: apiPayload.subtotal,
        gst: apiPayload.gst,
        gstRate: apiPayload.gstRate,
        tax: apiPayload.tax,
        taxRate: apiPayload.taxRate,
        totalPayable: apiPayload.totalPayable,
        status: 'sent',
        createdBy: 'current-user', // Placeholder
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 1. Generate PDF Blob
      const blob = getQuotationPDFBlob(quotationForPDF);
      const file = new File([blob], `${apiPayload.quoteNumber}.pdf`, { type: 'application/pdf' });

      // 2. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      const { data: uploadData } = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // 3. Send to API with PDF URL
      const finalPayload = {
        ...apiPayload,
        pdfUrl: uploadData.filePath
      };

      await api.post('/quotations', finalPayload);
      toast.success('Quotation and PDF saved to cloud successfully');
      navigate('/quotations');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const prepareQuotationData = (status: 'draft' | 'sent') => {
    return {
      quoteNumber: `QT-${format(new Date(), 'yyyy')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`, // Backend should probably handle this but sticking to frontend logic for now or sending it
      clientName,
      companyName,
      contactNumber,
      email,
      quoteDate,
      validUntil,
      lineItems: lineItems.map(({ id, ...rest }) => rest), // Remove temp ID
      subtotal,
      gst: gstAmount,
      gstRate,
      tax: taxAmount,
      taxRate,
      totalPayable,
      currency,
      exchangeRate: exchangeRate || 1,
      includeCompanyName,
      includeGstin,
      includeCin,
      includeClientDetails,
      status
    };
  };

  const handleDownloadPDF = () => {
    if (includeClientDetails && (!clientName || !companyName)) {
      toast.error('Please fill in client details first');
      return;
    }
    if (currency !== 'INR' && exchangeRate === null) {
      toast.error('Exchange rate not loaded. Please try again.');
      return;
    }

    const quotation: Quotation = {
      _id: `temp-${Date.now()}`,
      quoteNumber: `QT-${format(new Date(), 'yyyy')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      clientName,
      companyName,
      quoteDate: new Date(quoteDate),
      validUntil: new Date(validUntil),
      contactNumber,
      email: email || undefined,
      lineItems: lineItems.map((item) => ({
        id: item.id,
        service: item.service,
        description: item.description,
        price: item.price,
        isFree: item.isFree,
      })),
      subtotal,
      gst: gstAmount,
      gstRate,
      tax: taxAmount,
      taxRate,
      totalPayable,
      currency,
      exchangeRate: exchangeRate || 1,
      includeCompanyName,
      includeGstin,
      includeCin,
      includeClientDetails,
      status: 'draft',
      createdBy: 'current-user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    generateQuotationPDF(quotation);
    toast.success('PDF downloaded successfully');
  };

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data } = await api.get('/clients');
        setClients(data);
      } catch (error: any) {
        toast.error('Failed to fetch clients');
      } finally {
        setIsClientsLoading(false);
      }
    };
    fetchClients();
  }, []);

  useEffect(() => {
    let ignore = false;
    const fetchRate = async () => {
      if (currency === 'INR') {
        setExchangeRate(1);
        return;
      }
      setIsRateLoading(true);
      setExchangeRate(null);
      try {
        const res = await fetch(`https://open.er-api.com/v6/latest/INR`);
        const data = await res.json();
        const rate = data?.rates?.[currency];
        if (!ignore) {
          setExchangeRate(typeof rate === 'number' ? rate : null);
        }
      } catch {
        if (!ignore) setExchangeRate(null);
      } finally {
        if (!ignore) setIsRateLoading(false);
      }
    };
    fetchRate();
    return () => {
      ignore = true;
    };
  }, [currency]);

  const filteredClients = clients.filter((client) => {
    const query = clientSearch.trim().toLowerCase();
    if (query.length < 2) return false;
    return (
      client.name.toLowerCase().includes(query) ||
      client.companyName.toLowerCase().includes(query) ||
      (client.email || '').toLowerCase().includes(query) ||
      (client.contactNumber || '').toLowerCase().includes(query)
    );
  });

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
                <div className="flex items-center gap-2 text-foreground">
                  <Checkbox
                    id="includeCompanyName"
                    checked={includeCompanyName}
                    onCheckedChange={(checked) => setIncludeCompanyName(checked === true)}
                  />
                  {includeCompanyName && (
                    <Label htmlFor="includeCompanyName" className="cursor-pointer text-sm font-semibold">
                      {COMPANY_INFO.name}
                    </Label>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="includeGstin"
                      checked={includeGstin}
                      onCheckedChange={(checked) => setIncludeGstin(checked === true)}
                    />
                    {includeGstin && (
                      <Label htmlFor="includeGstin" className="cursor-pointer text-sm">
                        GSTIN: {COMPANY_INFO.gstin}
                      </Label>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="includeCin"
                      checked={includeCin}
                      onCheckedChange={(checked) => setIncludeCin(checked === true)}
                    />
                    {includeCin && (
                      <Label htmlFor="includeCin" className="cursor-pointer text-sm">
                        CIN: {COMPANY_INFO.cin}
                      </Label>
                    )}
                  </div>
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
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="includeClientDetails"
                        checked={includeClientDetails}
                        onCheckedChange={(checked) => setIncludeClientDetails(checked === true)}
                      />
                      <CardTitle>
                        <Label htmlFor="includeClientDetails" className="cursor-pointer">
                          Client Details
                        </Label>
                      </CardTitle>
                    </div>
                    {includeClientDetails && (
                      <div className="relative w-[320px]">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Search client by name, company, email..."
                            value={clientSearch}
                            onChange={(e) => {
                              setClientSearch(e.target.value);
                              setShowClientResults(true);
                            }}
                            className="pl-9"
                          />
                        </div>

                        {showClientResults && clientSearch.trim().length >= 2 && (
                          <div className="absolute z-20 mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
                            <Command>
                              <CommandList>
                                <CommandEmpty>
                                  {isClientsLoading ? 'Loading clients...' : 'No clients found.'}
                                </CommandEmpty>
                                <CommandGroup>
                                  {filteredClients.map((client) => (
                                    <CommandItem
                                      key={client._id}
                                      value={`${client.name} ${client.companyName} ${client.email || ''} ${client.contactNumber || ''}`}
                                      onSelect={() => {
                                        setSelectedClientId(client._id);
                                        setClientName(client.name);
                                        setCompanyName(client.companyName);
                                        setEmail(client.email || '');
                                        setContactNumber(client.contactNumber || '');
                                        setClientSearch(client.name);
                                        setShowClientResults(false);
                                      }}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${selectedClientId === client._id ? 'opacity-100' : 'opacity-0'}`}
                                      />
                                      <div className="flex flex-col">
                                        <span className="text-sm">{client.name}</span>
                                        <span className="text-xs text-muted-foreground">{client.companyName}</span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                  {selectedClientId && (
                                    <CommandItem
                                      value="__clear__"
                                      onSelect={() => {
                                        setSelectedClientId(null);
                                        setClientSearch('');
                                        setShowClientResults(true);
                                      }}
                                    >
                                      Clear selection
                                    </CommandItem>
                                  )}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <CardDescription>Enter the client information for this quotation.</CardDescription>
                </CardHeader>
                {includeClientDetails && (
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
                )}
              </Card>

              {/* Tax (Optional) */}
              <Card>
                <CardHeader>
                  <CardTitle>Taxes (Optional)</CardTitle>
                  <CardDescription>Enable tax for countries that don't use GST.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="includeTax"
                      checked={includeTax}
                      onCheckedChange={(checked) => {
                        const next = checked === true;
                        setIncludeTax(next);
                        if (next) setIncludeGst(false);
                      }}
                    />
                    <Label htmlFor="includeTax" className="text-sm cursor-pointer">
                      Enable Tax
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="taxRate" className="text-sm text-muted-foreground">
                      Tax
                    </Label>
                    <Input
                      id="taxRate"
                      type="number"
                      className="w-20"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseInt(e.target.value) || 0)}
                      disabled={!includeTax}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
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
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => moveLineItem(index, index - 1)}
                            disabled={index === 0}
                            title="Move up"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => moveLineItem(index, index + 1)}
                            disabled={index === lineItems.length - 1}
                            title="Move down"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeLineItem(item.id)}
                            disabled={lineItems.length === 1}
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
                            onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                            disabled={item.isFree}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            placeholder={"Add details (auto-bulleted):\n• "}
                            value={item.description}
                            onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                            onFocus={(e) => handleDescriptionFocus(item.id, e)}
                            onClick={(e) => handleDescriptionFocus(item.id, e)}
                            onKeyDown={(e) => handleDescriptionKeyDown(item.id, e)}
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground">
                            Tip: Just press Enter for the next bullet.
                          </p>
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

                  {/* Currency */}
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-sm text-muted-foreground">Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="h-8 w-[170px] text-sm">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_OPTIONS.map((option) => (
                          <SelectItem key={option.code} value={option.code}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {currency !== 'INR' && (
                    <div className="text-xs text-muted-foreground">
                      {isRateLoading
                        ? 'Fetching exchange rate...'
                        : exchangeRate === null
                          ? 'Exchange rate unavailable'
                          : `Rate: 1 INR = ${exchangeRate.toFixed(4)} ${currency}`}
                    </div>
                  )}

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
                        disabled={includeTax}
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
