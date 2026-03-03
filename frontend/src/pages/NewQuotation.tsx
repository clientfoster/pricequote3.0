import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Download, ArrowUp, ArrowDown, Upload } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COMPANY_INFO, DEFAULT_LINE_ITEMS, type LineItem, type Quotation } from '@/types/quotation';
import { generateQuotationPDF, getQuotationPDFBlob } from '@/lib/pdfGenerator';
import { toast } from 'sonner';
import api from '@/lib/api'; // Added API import
import { useAuth } from '@/context/AuthContext';

interface FormLineItem extends Omit<LineItem, 'id'> {
  id: string;
}

const ensureBullets = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('- ')) return text;
  return `- ${text.replace(/\n+/g, '\n- ')}`;
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

const COMMON_TAX_ID_TYPES = ['GSTIN', 'VAT', 'EIN', 'TIN'];
const OTHER_TAX_ID_OPTION = '__OTHER__';

const TAX_ID_TYPE_OPTIONS = [...COMMON_TAX_ID_TYPES];

const createQuoteNumber = () =>
  `QT-${format(new Date(), 'yyyy')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

const toDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

export default function NewQuotation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uxMode, setUxMode] = useState<'outside' | 'inline'>('outside');
  const isPublicQuote = location.pathname === '/quote';

  // Form state
  const [quoteNumber, setQuoteNumber] = useState(createQuoteNumber);
  const [issuerCompanyName, setIssuerCompanyName] = useState(COMPANY_INFO.name);
  const [issuerTaxIdType, setIssuerTaxIdType] = useState('');
  const [issuerTaxIdCustomType, setIssuerTaxIdCustomType] = useState('');
  const [issuerTaxIdValue, setIssuerTaxIdValue] = useState(COMPANY_INFO.gstin);
  const [issuerLogoFile, setIssuerLogoFile] = useState<File | null>(null);
  const [issuerLogoPreview, setIssuerLogoPreview] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [clientReferenceNo, setClientReferenceNo] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [country, setCountry] = useState('');
  const [taxIdName, setTaxIdName] = useState('');
  const [clientTaxIdCustomType, setClientTaxIdCustomType] = useState('');
  const [taxIdValue, setTaxIdValue] = useState('');
  const [clientLogoFile, setClientLogoFile] = useState<File | null>(null);
  const [clientLogoPreview, setClientLogoPreview] = useState<string>('');
  const [quoteDate, setQuoteDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [validUntil, setValidUntil] = useState(format(addDays(new Date(), 15), 'yyyy-MM-dd'));
  const [includeGst, setIncludeGst] = useState(true);
  const [gstRate, setGstRate] = useState(18);
  const [includeTax, setIncludeTax] = useState(false);
  const [taxRate, setTaxRate] = useState(10);
  const [showTaxSection, setShowTaxSection] = useState(true);
  const [showServicesSection, setShowServicesSection] = useState(true);
  const [includeCompanyName, setIncludeCompanyName] = useState(true);
  const [includeGstin, setIncludeGstin] = useState(true);
  const [includeClientDetails, setIncludeClientDetails] = useState(true);
  const [currency, setCurrency] = useState('INR');
  const [exchangeRate, setExchangeRate] = useState<number | null>(1);
  const [isRateLoading, setIsRateLoading] = useState(false);
  const issuerLogoInputRef = useRef<HTMLInputElement | null>(null);
  const clientLogoInputRef = useRef<HTMLInputElement | null>(null);
  const isInlineLabels = uxMode === 'inline';
  const fieldSpaceClass = isInlineLabels ? 'space-y-1' : 'space-y-2';
  const gridGapClass = isInlineLabels ? 'gap-3' : 'gap-4';

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
    const insert = `\n- `;
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
      const nextValue = '- ';
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

  const toBillingAmount = (amountInInr: number) => {
    if (currency === 'INR') return amountInInr;
    return amountInInr * (exchangeRate || 1);
  };

  const toBaseInrAmount = (amountInCurrency: number) => {
    if (currency === 'INR') return amountInCurrency;
    return exchangeRate ? amountInCurrency / exchangeRate : 0;
  };

  const uploadFileToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.filePath as string;
  };

  const handleSaveDraft = async () => {
    if (currency !== 'INR' && exchangeRate === null) {
      toast.error('Exchange rate not loaded. Please try again.');
      return;
    }
    setIsSubmitting(true);
    try {
      const issuerLogoUrl = issuerLogoFile ? await uploadFileToCloudinary(issuerLogoFile) : undefined;
      const clientLogoUrl = clientLogoFile ? await uploadFileToCloudinary(clientLogoFile) : undefined;
      const quotationData = prepareQuotationData('draft');
      await api.post('/quotations', {
        ...quotationData,
        issuerLogoUrl,
        clientLogoUrl,
      });
      toast.success('Quotation saved as draft');
      navigate('/quotations');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSend = async () => {
    if (currency !== 'INR' && exchangeRate === null) {
      toast.error('Exchange rate not loaded. Please try again.');
      return;
    }
    setIsSubmitting(true);
    try {
      const apiPayload = prepareQuotationData('sent');
      const issuerLogoUrl = issuerLogoFile ? await uploadFileToCloudinary(issuerLogoFile) : undefined;
      const clientLogoUrl = clientLogoFile ? await uploadFileToCloudinary(clientLogoFile) : undefined;

      // Construct Quotation object for PDF Generator (now flat structure)
      const quotationForPDF: Quotation = {
        _id: 'temp-pdf-id',
        quoteNumber: apiPayload.quoteNumber,
        issuerCompanyName: apiPayload.issuerCompanyName,
        issuerTaxIdType: apiPayload.issuerTaxIdType,
        issuerTaxIdValue: apiPayload.issuerTaxIdValue,
        issuerLogoUrl,
        issuerLogoDataUrl: issuerLogoPreview || undefined,
        clientName: apiPayload.clientName,
        companyName: apiPayload.companyName,
        contactNumber: apiPayload.contactNumber,
        email: apiPayload.email,
        clientReferenceNo: apiPayload.clientReferenceNo,
        clientAddress: apiPayload.clientAddress,
        clientLogoUrl,
        clientLogoDataUrl: clientLogoPreview || undefined,
        country: apiPayload.country,
        taxIdName: apiPayload.taxIdName,
        taxIdValue: apiPayload.taxIdValue,
        quoteDate: new Date(apiPayload.quoteDate),
        validUntil: new Date(apiPayload.validUntil),
        includeCompanyName: apiPayload.includeCompanyName,
        includeGstin: apiPayload.includeGstin,
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
        issuerLogoUrl,
        clientLogoUrl,
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
    const resolvedIssuerTaxIdType =
      issuerTaxIdType === OTHER_TAX_ID_OPTION ? issuerTaxIdCustomType.trim() : issuerTaxIdType;
    const resolvedClientTaxIdType =
      taxIdName === OTHER_TAX_ID_OPTION ? clientTaxIdCustomType.trim() : taxIdName;

    return {
      quoteNumber,
      issuerCompanyName: issuerCompanyName.trim() || COMPANY_INFO.name,
      issuerTaxIdType: resolvedIssuerTaxIdType || 'GSTIN',
      issuerTaxIdValue: issuerTaxIdValue.trim() || COMPANY_INFO.gstin,
      clientName,
      companyName,
      contactNumber,
      email,
      clientReferenceNo,
      clientAddress,
      country,
      taxIdName: resolvedClientTaxIdType,
      taxIdValue,
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
      includeClientDetails,
      status
    };
  };

  const handleDownloadPDF = () => {
    if (currency !== 'INR' && exchangeRate === null) {
      toast.error('Exchange rate not loaded. Please try again.');
      return;
    }

    const quotation: Quotation = {
      _id: `temp-${Date.now()}`,
      quoteNumber,
      issuerCompanyName: issuerCompanyName.trim() || COMPANY_INFO.name,
      issuerTaxIdType:
        (issuerTaxIdType === OTHER_TAX_ID_OPTION ? issuerTaxIdCustomType.trim() : issuerTaxIdType) || 'GSTIN',
      issuerTaxIdValue: issuerTaxIdValue.trim() || COMPANY_INFO.gstin,
      issuerLogoDataUrl: issuerLogoPreview || undefined,
      clientName,
      companyName,
      quoteDate: new Date(quoteDate),
      validUntil: new Date(validUntil),
      contactNumber,
      email: email || undefined,
      clientReferenceNo: clientReferenceNo || undefined,
      clientAddress: clientAddress || undefined,
      clientLogoDataUrl: clientLogoPreview || undefined,
      country: country || undefined,
      taxIdName:
        (taxIdName === OTHER_TAX_ID_OPTION ? clientTaxIdCustomType.trim() : taxIdName) || undefined,
      taxIdValue: taxIdValue || undefined,
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
        includeClientDetails,
      status: 'draft',
      createdBy: 'current-user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    generateQuotationPDF(quotation);
    toast.success('PDF downloaded successfully');
  };

  const handleIssuerLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIssuerLogoFile(file);
    try {
      setIssuerLogoPreview(await toDataUrl(file));
    } catch {
      toast.error('Failed to load company logo preview');
    }
  };

  const handleClientLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setClientLogoFile(file);
    try {
      setClientLogoPreview(await toDataUrl(file));
    } catch {
      toast.error('Failed to load client logo preview');
    }
  };

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

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-14 md:top-0 z-10 border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-xl font-display font-bold text-foreground sm:text-2xl">New Quotation</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Professional quotation builder for public users.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  No login required. Fill details and download instantly.
                </p>
                <div className="mt-3 inline-flex rounded-md border border-border bg-background p-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={uxMode === 'outside' ? 'default' : 'ghost'}
                    className="h-8"
                    onClick={() => setUxMode('outside')}
                  >
                    Outside Labels
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={uxMode === 'inline' ? 'default' : 'ghost'}
                    className="h-8"
                    onClick={() => setUxMode('inline')}
                  >
                    Inline Labels
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3 lg:w-auto">
              {isPublicQuote && (
                <Button size="sm" variant="secondary" onClick={() => navigate('/login', { state: { from: '/dashboard' } })}>
                  Login
                </Button>
              )}
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button className="w-full sm:w-auto" variant="outline" onClick={handleDownloadPDF}>
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
                <Button className="w-full sm:w-auto" variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
                  <Save className="w-4 h-4" />
                  Save Draft
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Company Details */}
            <Card className="border-primary/20 bg-primary/5 shadow-sm">
              <CardHeader className="border-b border-primary/10 bg-background/60">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="includeCompanyDetails"
                    checked={includeCompanyName || includeGstin}
                    onCheckedChange={(checked) => {
                      const next = checked === true;
                      setIncludeCompanyName(next);
                      setIncludeGstin(next);
                    }}
                  />
                <CardTitle>
                  <Label htmlFor="includeCompanyDetails" className="cursor-pointer">
                    Company Details
                  </Label>
                </CardTitle>
              </div>
            </CardHeader>
            {(includeCompanyName || includeGstin) && (
            <CardContent className="py-4 space-y-4">
              <div className={`grid grid-cols-1 md:grid-cols-12 ${gridGapClass}`}>
                <div className={`md:col-span-3 ${fieldSpaceClass}`}>
                  {!isInlineLabels && <Label htmlFor="issuerCompanyName">Company Name</Label>}
                  <Input
                    id="issuerCompanyName"
                    placeholder={isInlineLabels ? 'Company Name' : 'Enter company name'}
                    value={issuerCompanyName}
                    onChange={(e) => setIssuerCompanyName(e.target.value)}
                  />
                </div>
                <div className={`md:col-span-3 ${fieldSpaceClass}`}>
                  {!isInlineLabels && <Label>Primary Tax ID</Label>}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Select value={issuerTaxIdType || '__EMPTY__'} onValueChange={(value) => setIssuerTaxIdType(value === '__EMPTY__' ? '' : value)}>
                      <SelectTrigger className="w-full sm:w-[160px]">
                        <SelectValue placeholder={isInlineLabels ? 'Tax ID Type' : 'Select Tax ID Type'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__EMPTY__">Select Tax ID Type</SelectItem>
                        {TAX_ID_TYPE_OPTIONS.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                        <SelectItem value={OTHER_TAX_ID_OPTION}>Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder={isInlineLabels ? 'Tax ID Number' : 'Enter Tax ID Number'}
                      value={issuerTaxIdValue}
                      onChange={(e) => setIssuerTaxIdValue(e.target.value)}
                    />
                  </div>
                  {issuerTaxIdType === OTHER_TAX_ID_OPTION && (
                    <Input
                      placeholder="Specify Tax ID Type"
                      value={issuerTaxIdCustomType}
                      onChange={(e) => setIssuerTaxIdCustomType(e.target.value)}
                    />
                  )}
                  {!isInlineLabels && (
                    <p className="text-xs text-muted-foreground">GST, VAT, EIN, or local business tax number</p>
                  )}
                </div>
                <div className={`md:col-span-2 ${fieldSpaceClass}`}>
                  {!isInlineLabels && <Label htmlFor="quoteDate">Quote Date</Label>}
                  <Input
                    id="quoteDate"
                    type="date"
                    value={quoteDate}
                    onChange={(e) => setQuoteDate(e.target.value)}
                  />
                </div>
                <div className={`md:col-span-2 ${fieldSpaceClass}`}>
                  {!isInlineLabels && <Label htmlFor="validUntil">Valid Till</Label>}
                  <Input
                    id="validUntil"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
                <div className={`md:col-span-2 ${fieldSpaceClass}`}>
                  {!isInlineLabels && <Label htmlFor="quoteNumber">Quotation No</Label>}
                  <Input
                    id="quoteNumber"
                    placeholder={isInlineLabels ? 'Quotation No' : undefined}
                    value={quoteNumber}
                    onChange={(e) => setQuoteNumber(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <input
                  ref={issuerLogoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleIssuerLogoSelect}
                />
                <Button variant="outline" type="button" onClick={() => issuerLogoInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Company Logo
                </Button>
                {issuerLogoFile && (
                  <p className="mt-2 text-xs text-muted-foreground">{issuerLogoFile.name}</p>
                )}
              </div>
            </CardContent>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Client Details */}
              <Card className="shadow-sm">
                <CardHeader className="border-b border-border/60 bg-muted/30">
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
                  </div>
                  {!isInlineLabels && <CardDescription>Enter the client information for this quotation.</CardDescription>}
                </CardHeader>
                {includeClientDetails && (
                  <CardContent className="space-y-4">
                    <div className={`grid grid-cols-1 md:grid-cols-2 ${gridGapClass}`}>
                      <div className={fieldSpaceClass}>
                        {!isInlineLabels && <Label htmlFor="clientName">Client Name</Label>}
                        <Input
                          id="clientName"
                          placeholder={isInlineLabels ? 'Client Name' : 'Enter client name'}
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                        />
                      </div>
                      <div className={fieldSpaceClass}>
                        {!isInlineLabels && <Label htmlFor="companyName">Company Name</Label>}
                        <Input
                          id="companyName"
                          placeholder={isInlineLabels ? 'Company Name' : 'Enter company name'}
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                        />
                      </div>
                      <div className={fieldSpaceClass}>
                        {!isInlineLabels && <Label htmlFor="contactNumber">Contact Number</Label>}
                        <Input
                          id="contactNumber"
                          placeholder={isInlineLabels ? 'Contact Number' : '+91 XXXXX XXXXX'}
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                        />
                      </div>
                      <div className={fieldSpaceClass}>
                        {!isInlineLabels && <Label htmlFor="email">Email</Label>}
                        <Input
                          id="email"
                          type="email"
                          placeholder={isInlineLabels ? 'Email' : 'client@company.com'}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div className={fieldSpaceClass}>
                        {!isInlineLabels && <Label htmlFor="taxIdName">Primary Tax ID Name</Label>}
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Select
                            value={taxIdName || '__EMPTY__'}
                            onValueChange={(value) => setTaxIdName(value === '__EMPTY__' ? '' : value)}
                          >
                            <SelectTrigger id="taxIdName" className="w-full sm:w-[160px]">
                              <SelectValue placeholder={isInlineLabels ? 'Tax ID Type' : 'Select Tax ID Type'} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__EMPTY__">Select Tax ID Type</SelectItem>
                              {TAX_ID_TYPE_OPTIONS.map((item) => (
                                <SelectItem key={item} value={item}>
                                  {item}
                                </SelectItem>
                              ))}
                              <SelectItem value={OTHER_TAX_ID_OPTION}>Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            id="taxIdValue"
                            placeholder={isInlineLabels ? 'Tax ID Number' : 'Enter Tax ID Number'}
                            value={taxIdValue}
                            onChange={(e) => setTaxIdValue(e.target.value)}
                          />
                        </div>
                        {taxIdName === OTHER_TAX_ID_OPTION && (
                          <Input
                            placeholder="Specify Tax ID Type"
                            value={clientTaxIdCustomType}
                            onChange={(e) => setClientTaxIdCustomType(e.target.value)}
                          />
                        )}
                        {!isInlineLabels && (
                          <p className="text-xs text-muted-foreground">GST, VAT, EIN, or local business tax number</p>
                        )}
                      </div>
                      <div className={fieldSpaceClass}>
                        {!isInlineLabels && <Label htmlFor="clientReferenceNo">Client PO / Reference No.</Label>}
                        <Input
                          id="clientReferenceNo"
                          placeholder={isInlineLabels ? 'Client PO / Reference No.' : 'Optional - provided by client if available'}
                          value={clientReferenceNo}
                          onChange={(e) => setClientReferenceNo(e.target.value)}
                        />
                      </div>
                      <div className={`${fieldSpaceClass} md:col-span-2`}>
                        {!isInlineLabels && <Label htmlFor="clientAddress">Client Address</Label>}
                        <Textarea
                          id="clientAddress"
                          placeholder={isInlineLabels ? 'Client Address' : 'Enter client address'}
                          value={clientAddress}
                          onChange={(e) => setClientAddress(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="md:col-span-2 flex justify-start md:justify-end">
                        <input
                          ref={clientLogoInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          className="hidden"
                          onChange={handleClientLogoSelect}
                        />
                        <Button type="button" variant="outline" onClick={() => clientLogoInputRef.current?.click()}>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Client Logo
                        </Button>
                      </div>
                      {clientLogoFile && (
                        <div className="md:col-span-2 text-right text-xs text-muted-foreground">
                          {clientLogoFile.name}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Tax (Optional) */}
              <Card className="shadow-sm">
                <CardHeader className="border-b border-border/60 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showTaxSection"
                      checked={showTaxSection}
                      onCheckedChange={(checked) => {
                        const next = checked === true;
                        setShowTaxSection(next);
                        if (!next) setIncludeTax(false);
                      }}
                    />
                    <CardTitle>
                      <Label htmlFor="showTaxSection" className="cursor-pointer">
                        Taxes (Optional)
                      </Label>
                    </CardTitle>
                  </div>
                  <CardDescription>Enable tax for countries that don't use GST.</CardDescription>
                </CardHeader>
                {showTaxSection && (
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
                    {!isInlineLabels && (
                      <Label htmlFor="taxRate" className="text-sm text-muted-foreground">
                        Tax
                      </Label>
                    )}
                    <Input
                      id="taxRate"
                      type="number"
                      className="w-20"
                      placeholder={isInlineLabels ? 'Tax %' : undefined}
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseInt(e.target.value) || 0)}
                      disabled={!includeTax}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </CardContent>
                )}
              </Card>

              {/* Line Items */}
              <Card className="shadow-sm">
                <CardHeader className="border-b border-border/60 bg-muted/30">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="showServicesSection"
                        checked={showServicesSection}
                        onCheckedChange={(checked) => setShowServicesSection(checked === true)}
                      />
                      <CardTitle>
                        <Label htmlFor="showServicesSection" className="cursor-pointer">
                          Services & Pricing
                        </Label>
                      </CardTitle>
                    </div>
                    <div className="order-3 sm:order-2 sm:flex-1">
                      <CardDescription>
                        Add billable services with clear descriptions and rates. Totals update instantly.
                      </CardDescription>
                    </div>
                    <Button className="order-2 w-full sm:order-3 sm:w-auto" variant="outline" size="sm" onClick={addLineItem}>
                      <Plus className="w-4 h-4" />
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                {showServicesSection && (
                <CardContent className="space-y-4">
                  {lineItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="animate-fade-in space-y-4 rounded-xl border border-border/70 bg-background/95 p-4 shadow-sm ring-1 ring-transparent transition hover:ring-border"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Line {index + 1}
                          </span>
                          {item.service && (
                            <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
                              {item.service}
                            </span>
                          )}
                        </div>
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
                          {!isInlineLabels && <Label>Service Name</Label>}
                          {isInlineLabels && item.service && (
                            <p className="text-xs text-muted-foreground">Service Name</p>
                          )}
                          <Input
                            placeholder={isInlineLabels ? 'Service Name' : 'e.g., Website Design'}
                            value={item.service}
                            onChange={(e) => updateLineItem(item.id, 'service', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          {!isInlineLabels && <Label>{`Amount (${currency})`}</Label>}
                          {isInlineLabels && (item.isFree || item.price > 0) && (
                            <p className="text-xs text-muted-foreground">{`Amount (${currency})`}</p>
                          )}
                          <Input
                            type="number"
                            placeholder={
                              currency !== 'INR' && exchangeRate === null
                                ? 'Rate loading...'
                                : isInlineLabels
                                  ? `Amount (${currency})`
                                  : '0'
                            }
                            value={item.isFree ? '' : (currency !== 'INR' && exchangeRate !== null
                              ? Math.round(toBillingAmount(item.price))
                              : item.price || '')}
                            onChange={(e) =>
                              updateLineItem(
                                item.id,
                                'price',
                                Math.round(toBaseInrAmount(parseFloat(e.target.value) || 0))
                              )
                            }
                            onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                            disabled={item.isFree || (currency !== 'INR' && exchangeRate === null)}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          {!isInlineLabels && <Label>Description</Label>}
                          {isInlineLabels && item.description && (
                            <p className="text-xs text-muted-foreground">Description</p>
                          )}
                          <Textarea
                            placeholder={isInlineLabels ? 'Description' : "Add details (auto-bulleted):\n- "}
                            value={item.description}
                            onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                            onFocus={(e) => handleDescriptionFocus(item.id, e)}
                            onClick={(e) => handleDescriptionFocus(item.id, e)}
                            onKeyDown={(e) => handleDescriptionKeyDown(item.id, e)}
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground">
                            Tip: Press Enter for the next bullet.
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
                            Mark as complimentary (no charge)
                          </Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
                )}
              </Card>
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              {/* Pricing Summary */}
              <Card className="shadow-sm xl:sticky xl:top-24">
                <CardHeader className="border-b border-border/60 bg-muted/30">
                  <CardTitle>Pricing Summary</CardTitle>
                  <CardDescription>Client-facing totals are shown in the selected billing currency.</CardDescription>
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
                    {!isInlineLabels && (
                      <Label className="text-sm text-muted-foreground">Billing Currency</Label>
                    )}
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
                  {currency !== 'INR' && isRateLoading && (
                    <div className="text-xs text-muted-foreground">Fetching exchange rate...</div>
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
                    <p>- Timeline: {COMPANY_INFO.timeline}</p>
                    <p>- {COMPANY_INFO.paymentTerms}</p>
                    <p>- Bank: {COMPANY_INFO.bankName}</p>
                    <p>- IFSC: {COMPANY_INFO.ifsc}</p>
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



