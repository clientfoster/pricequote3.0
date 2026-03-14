import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Download, ArrowUp, ArrowDown, Upload, MoreVertical, LogIn, Calendar, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { COMPANY_INFO, DEFAULT_LINE_ITEMS, type LineItem, type Quotation } from '@/types/quotation';
import type { Client } from '@/types/client';
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

const createQuoteNumber = () => {
  const year = format(new Date(), 'yyyy');
  const random = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
  const time = String(Date.now()).slice(-4);
  return `QT-${year}-${random}${time}`;
};

const toDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read PDF'));
    reader.readAsDataURL(blob);
  });

export default function NewQuotation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uxMode, setUxMode] = useState<'outside' | 'inline'>('outside');
  const isPublicQuote = location.pathname === '/quote';
  const canSendQuotation = Boolean(user) && !isPublicQuote;

  // Form state
  const [quoteNumber, setQuoteNumber] = useState(createQuoteNumber);
  const [issuerCompanyName, setIssuerCompanyName] = useState('');
  const [issuerTaxIdType, setIssuerTaxIdType] = useState('');
  const [issuerTaxIdCustomType, setIssuerTaxIdCustomType] = useState('');
  const [issuerTaxIdValue, setIssuerTaxIdValue] = useState('');
  const [issuerLogoFile, setIssuerLogoFile] = useState<File | null>(null);
  const [issuerLogoPreview, setIssuerLogoPreview] = useState<string>('');
  const [issuerSignatureFile, setIssuerSignatureFile] = useState<File | null>(null);
  const [issuerSignaturePreview, setIssuerSignaturePreview] = useState<string>('');
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
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isClientsLoading, setIsClientsLoading] = useState(false);
  const [quoteDate, setQuoteDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [validUntil, setValidUntil] = useState('');
  const [includeTax, setIncludeTax] = useState(true);
  const [taxType, setTaxType] = useState<'GST' | 'TAX'>('GST');
  const [taxRate, setTaxRate] = useState<number | ''>('');
  const [includeDiscount, setIncludeDiscount] = useState(false);
  const [discountRate, setDiscountRate] = useState<number | ''>('');
  const [showTaxSection, setShowTaxSection] = useState(true);
  const [showServicesSection] = useState(true);
  const [includeCompanyName, setIncludeCompanyName] = useState(true);
  const [includeGstin, setIncludeGstin] = useState(true);
  const [includeClientDetails, setIncludeClientDetails] = useState(true);
  const [currency, setCurrency] = useState('INR');
  const [exchangeRate, setExchangeRate] = useState<number | null>(1);
  const [isRateLoading, setIsRateLoading] = useState(false);
  const issuerLogoInputRef = useRef<HTMLInputElement | null>(null);
  const issuerSignatureInputRef = useRef<HTMLInputElement | null>(null);
  const clientLogoInputRef = useRef<HTMLInputElement | null>(null);
  const quoteDateInputRef = useRef<HTMLInputElement | null>(null);
  const validUntilInputRef = useRef<HTMLInputElement | null>(null);
  const isInlineLabels = uxMode === 'inline';
  const fieldSpaceClass = isInlineLabels ? 'space-y-1' : 'space-y-2';
  const gridGapClass = isInlineLabels ? 'gap-3' : 'gap-4';

  // Line items start empty (single blank row)
  const [lineItems, setLineItems] = useState<FormLineItem[]>([
    {
      id: `item-${Date.now()}`,
      service: '',
      description: '',
      price: 0,
      isFree: false,
    },
  ]);

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
  const resolvedTaxRate = typeof taxRate === 'number' ? taxRate : 0;
  const resolvedDiscountRate = typeof discountRate === 'number' ? discountRate : 0;
  const rawDiscount = includeDiscount ? (subtotal * resolvedDiscountRate) / 100 : 0;
  const discountAmount = Math.min(rawDiscount, subtotal);
  const taxableSubtotal = subtotal - discountAmount;
  const taxAmount = includeTax ? (taxableSubtotal * resolvedTaxRate) / 100 : 0;
  const totalPayable = taxableSubtotal + taxAmount;

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

  const handleSaveDraft = async () => {
    if (!validateCustomTaxIds()) {
      return;
    }
    if (!validUntil) {
      toast.error('Please select a valid until date.');
      return;
    }
    if (currency !== 'INR' && exchangeRate === null) {
      toast.error('Exchange rate not loaded. Please try again.');
      return;
    }
    setIsSubmitting(true);
    try {
      const issuerLogoUrl = issuerLogoPreview || undefined;
      const issuerSignatureUrl = issuerSignaturePreview || undefined;
      const clientLogoUrl = clientLogoPreview || undefined;
      const quotationData = prepareQuotationData('draft');
      await api.post('/quotations', {
        ...quotationData,
        issuerLogoUrl,
        issuerSignatureUrl,
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
    if (!validateCustomTaxIds()) {
      return;
    }
    if (!email.trim()) {
      toast.error('Please enter the client email to send the quotation.');
      return;
    }
    if (!validUntil) {
      toast.error('Please select a valid until date.');
      return;
    }
    if (currency !== 'INR' && exchangeRate === null) {
      toast.error('Exchange rate not loaded. Please try again.');
      return;
    }
    setIsSubmitting(true);
    try {
      const apiPayload = prepareQuotationData('sent');
      if (apiPayload.lineItems.length === 0) {
        toast.error('Please add at least one service before sending.');
        return;
      }
      const issuerLogoUrl = issuerLogoPreview || undefined;
      const issuerSignatureUrl = issuerSignaturePreview || undefined;
      const clientLogoUrl = clientLogoPreview || undefined;

      // Construct Quotation object for PDF Generator (now flat structure)
      const quotationForPDF: Quotation = {
        _id: 'temp-pdf-id',
        quoteNumber: apiPayload.quoteNumber,
        issuerCompanyName: apiPayload.issuerCompanyName,
        issuerTaxIdType: apiPayload.issuerTaxIdType,
        issuerTaxIdValue: apiPayload.issuerTaxIdValue,
        issuerLogoUrl,
        issuerLogoDataUrl: issuerLogoPreview || undefined,
        issuerSignatureUrl,
        issuerSignatureDataUrl: issuerSignaturePreview || undefined,
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
        lineItems: apiPayload.lineItems.map((item, index) => ({
          id: `item-${index}`,
          service: item.service,
          description: item.description,
          price: item.price,
          isFree: item.isFree
        })),
        subtotal: apiPayload.subtotal,
        discountRate: apiPayload.discountRate,
        discountAmount: apiPayload.discountAmount,
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
      const pdfBase64 = await blobToBase64(blob);

      // 2. Save quotation (draft) first
      const finalPayload = {
        ...apiPayload,
        issuerLogoUrl,
        issuerSignatureUrl,
        clientLogoUrl,
      };

      const { data: createdQuotation } = await api.post('/quotations', finalPayload);

      // 3. Send email with PDF attachment (no cloud storage)
      await api.post(`/quotations/${createdQuotation._id}/send-email`, {
        email: apiPayload.email,
        subject: `Quotation ${apiPayload.quoteNumber} from ${apiPayload.issuerCompanyName || 'Quotemaster'}`,
        message: `<div style="font-family:Arial, sans-serif; line-height:1.5;">Please find your quotation attached.</div>`,
        pdfBase64,
        filename: `${apiPayload.quoteNumber}.pdf`,
      });

      toast.success('Quotation sent successfully');
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

    const cleanedLineItems = lineItems
      .map(({ id, ...rest }) => ({
        ...rest,
        service: rest.service.trim(),
        description: rest.description.trim(),
      }))
      .filter((item) => {
        const hasText = item.service.length > 0 || item.description.length > 0;
        const hasValue = item.isFree || item.price > 0;
        return hasText || hasValue;
      });

    return {
      quoteNumber,
      clientId: selectedClientId || undefined,
      issuerCompanyName: issuerCompanyName.trim() || undefined,
      issuerTaxIdType: resolvedIssuerTaxIdType || undefined,
      issuerTaxIdValue: issuerTaxIdValue.trim() || undefined,
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
      lineItems: cleanedLineItems,
      subtotal,
      discountRate: includeDiscount ? resolvedDiscountRate : 0,
      discountAmount,
      gst: taxType === 'GST' ? taxAmount : 0,
      gstRate: taxType === 'GST' ? resolvedTaxRate : 0,
      tax: taxType === 'TAX' ? taxAmount : 0,
      taxRate: taxType === 'TAX' ? resolvedTaxRate : 0,
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
    if (!validateCustomTaxIds()) {
      return;
    }
    if (!validUntil) {
      toast.error('Please select a valid until date.');
      return;
    }
    if (currency !== 'INR' && exchangeRate === null) {
      toast.error('Exchange rate not loaded. Please try again.');
      return;
    }

    const quotation: Quotation = {
      _id: `temp-${Date.now()}`,
      quoteNumber,
      issuerCompanyName: issuerCompanyName.trim() || undefined,
      issuerTaxIdType:
        (issuerTaxIdType === OTHER_TAX_ID_OPTION ? issuerTaxIdCustomType.trim() : issuerTaxIdType) || undefined,
      issuerTaxIdValue: issuerTaxIdValue.trim() || undefined,
      issuerLogoDataUrl: issuerLogoPreview || undefined,
      issuerSignatureDataUrl: issuerSignaturePreview || undefined,
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
      discountRate: includeDiscount ? resolvedDiscountRate : 0,
      discountAmount,
      gst: taxType === 'GST' ? taxAmount : 0,
      gstRate: taxType === 'GST' ? resolvedTaxRate : 0,
      tax: taxType === 'TAX' ? taxAmount : 0,
      taxRate: taxType === 'TAX' ? resolvedTaxRate : 0,
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

  const handleIssuerSignatureSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIssuerSignatureFile(file);
    try {
      setIssuerSignaturePreview(await toDataUrl(file));
    } catch {
      toast.error('Failed to load signature preview');
    }
  };

  const handleClientSelect = (value: string) => {
    const selectedId = value === 'none' ? '' : value;
    setSelectedClientId(selectedId);
    if (!selectedId) return;
    const selected = clients.find((client) => client._id === selectedId);
    if (!selected) return;
    setClientName(selected.name || '');
    setCompanyName(selected.companyName || '');
    setEmail(selected.email || '');
    setContactNumber(selected.contactNumber || '');
    setClientAddress(selected.address || '');
    setCountry(selected.country || '');
    setTaxIdName(selected.taxIdName || '');
    setTaxIdValue(selected.taxIdValue || selected.gstin || '');
  };

  const validateCustomTaxIds = () => {
    const issuerOtherSelected = issuerTaxIdType === OTHER_TAX_ID_OPTION;
    const issuerHasAny = issuerTaxIdCustomType.trim() || issuerTaxIdValue.trim();
    if (issuerOtherSelected && issuerHasAny && (!issuerTaxIdCustomType.trim() || !issuerTaxIdValue.trim())) {
      toast.error('Enter both Company Tax ID type and value, or leave both empty.');
      return false;
    }

    const clientOtherSelected = taxIdName === OTHER_TAX_ID_OPTION;
    const clientHasAny = clientTaxIdCustomType.trim() || taxIdValue.trim();
    if (clientOtherSelected && clientHasAny && (!clientTaxIdCustomType.trim() || !taxIdValue.trim())) {
      toast.error('Enter both Client Tax ID type and value, or leave both empty.');
      return false;
    }

    return true;
  };

  useEffect(() => {
    if (!user || isPublicQuote) {
      setClients([]);
      return;
    }
    let ignore = false;
    const fetchClients = async () => {
      setIsClientsLoading(true);
      try {
        const { data } = await api.get('/clients');
        if (!ignore) {
          setClients(data);
        }
      } catch {
        if (!ignore) {
          toast.error('Failed to load clients');
        }
      } finally {
        if (!ignore) {
          setIsClientsLoading(false);
        }
      }
    };

    fetchClients();
    return () => {
      ignore = true;
    };
  }, [user, isPublicQuote]);

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
        <div className="px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-lg font-display font-bold text-foreground sm:text-2xl">New Quotation</h1>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  No login required. Fill details and download instantly.
                </p>
              </div>
            </div>
            <div className="hidden sm:flex sm:items-center sm:gap-2">
              <Button variant="accent" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
              {canSendQuotation && (
                <Button variant="default" onClick={handleSend} disabled={isSubmitting}>
                  <Mail className="w-4 h-4" />
                  Send Quotation
                </Button>
              )}
              <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
                <Save className="w-4 h-4" />
                Save Draft
              </Button>
              {isPublicQuote && (
                <button
                  type="button"
                  onClick={() => navigate('/login', { state: { from: '/dashboard' } })}
                  className="text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 pb-28 sm:pb-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex w-full flex-col gap-3 rounded-xl border border-border/60 bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Label Style</p>
              <p className="text-xs text-muted-foreground">Choose how field labels appear.</p>
            </div>
            <div className="inline-flex w-full rounded-md border border-border bg-muted/30 p-1 sm:w-auto">
              <Button
                type="button"
                size="sm"
                variant={uxMode === 'outside' ? 'default' : 'ghost'}
                className="h-8 flex-1 sm:flex-none"
                onClick={() => setUxMode('outside')}
              >
                Outside
              </Button>
              <Button
                type="button"
                size="sm"
                variant={uxMode === 'inline' ? 'default' : 'ghost'}
                className="h-8 flex-1 sm:flex-none"
                onClick={() => setUxMode('inline')}
              >
                Inline
              </Button>
            </div>
          </div>
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
                <CardTitle className="text-lg sm:text-xl">
                  Company Details <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
                </CardTitle>
              </div>
              <CardDescription className="text-sm text-muted-foreground">
                Company branding and tax identity used on the quotation.
              </CardDescription>
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
                      <SelectTrigger className="w-full sm:w-[220px] whitespace-nowrap">
                        <SelectValue placeholder={isInlineLabels ? 'Tax ID Type' : 'Select Tax ID Type'} />
                      </SelectTrigger>
                      <SelectContent className="min-w-[220px]">
                        <SelectItem value="__EMPTY__">Select Tax ID Type</SelectItem>
                        {TAX_ID_TYPE_OPTIONS.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                        <SelectItem value={OTHER_TAX_ID_OPTION}>Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {issuerTaxIdType !== OTHER_TAX_ID_OPTION || issuerTaxIdCustomType.trim() ? (
                      <Input
                        placeholder={isInlineLabels ? 'Tax ID Number' : 'Tax ID Number'}
                        value={issuerTaxIdValue}
                        onChange={(e) => setIssuerTaxIdValue(e.target.value)}
                      />
                    ) : null}
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
                  <div className="relative">
                    <Input
                      id="quoteDate"
                      type="date"
                      className="pr-10"
                      value={quoteDate}
                      onChange={(e) => setQuoteDate(e.target.value)}
                      ref={quoteDateInputRef}
                    />
                    <Calendar
                      className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground cursor-pointer"
                      onClick={() => quoteDateInputRef.current?.showPicker?.() ?? quoteDateInputRef.current?.focus()}
                    />
                  </div>
                </div>
                <div className={`md:col-span-2 ${fieldSpaceClass}`}>
                  {!isInlineLabels && <Label htmlFor="validUntil">Valid Till</Label>}
                  <div className="relative">
                    <Input
                      id="validUntil"
                      type="date"
                      className="pr-10"
                      value={validUntil}
                      min={quoteDate}
                      required
                      onChange={(e) => setValidUntil(e.target.value)}
                      ref={validUntilInputRef}
                    />
                    <Calendar
                      className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground cursor-pointer"
                      onClick={() => validUntilInputRef.current?.showPicker?.() ?? validUntilInputRef.current?.focus()}
                    />
                  </div>
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
                <div className={`md:col-span-2 ${fieldSpaceClass}`}>
                  {!isInlineLabels && <Label>Company Logo</Label>}
                  <div className="flex items-center gap-2">
                    <input
                      ref={issuerLogoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={handleIssuerLogoSelect}
                    />
                    <Button variant="outline" type="button" onClick={() => issuerLogoInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </Button>
                    {issuerLogoFile && (
                      <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {issuerLogoFile.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`md:col-span-2 ${fieldSpaceClass}`}>
                  {!isInlineLabels && <Label>Authorized Signature</Label>}
                  <div className="flex items-center gap-2">
                    <input
                      ref={issuerSignatureInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={handleIssuerSignatureSelect}
                    />
                    <Button variant="outline" type="button" onClick={() => issuerSignatureInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Signature
                    </Button>
                    {issuerSignatureFile && (
                      <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {issuerSignatureFile.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column - Form */}
            <div className="order-1 lg:col-span-2 space-y-6">
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
                      <CardTitle className="text-lg sm:text-xl">
                        Client Details <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
                      </CardTitle>
                    </div>
                  </div>
                  {!isInlineLabels && (
                    <CardDescription className="text-sm text-muted-foreground">
                      Enter the client information for this quotation.
                    </CardDescription>
                  )}
                </CardHeader>
                {includeClientDetails && (
                  <CardContent className="space-y-4">
                    <div className={`grid grid-cols-1 md:grid-cols-2 ${gridGapClass}`}>
                      <div className={fieldSpaceClass}>
                        {!isInlineLabels && <Label htmlFor="clientSelect">Select Existing Client</Label>}
                        <Select
                          value={selectedClientId || 'none'}
                          onValueChange={handleClientSelect}
                          disabled={isClientsLoading}
                        >
                          <SelectTrigger id="clientSelect">
                            <SelectValue placeholder={isClientsLoading ? 'Loading clients...' : 'Choose a client'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {clients.map((client) => (
                              <SelectItem key={client._id} value={client._id}>
                                {client.name} {client.companyName ? `• ${client.companyName}` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {isClientsLoading && (
                          <p className="text-xs text-muted-foreground">Loading client list...</p>
                        )}
                      </div>
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
                            <SelectTrigger id="taxIdName" className="w-full sm:w-[220px] whitespace-nowrap">
                              <SelectValue placeholder={isInlineLabels ? 'Tax ID Type' : 'Select Tax ID Type'} />
                            </SelectTrigger>
                            <SelectContent className="min-w-[220px]">
                              <SelectItem value="__EMPTY__">Select Tax ID Type</SelectItem>
                              {TAX_ID_TYPE_OPTIONS.map((item) => (
                                <SelectItem key={item} value={item}>
                                  {item}
                                </SelectItem>
                              ))}
                              <SelectItem value={OTHER_TAX_ID_OPTION}>Other</SelectItem>
                            </SelectContent>
                          </Select>
                          {taxIdName !== OTHER_TAX_ID_OPTION || clientTaxIdCustomType.trim() ? (
                            <Input
                              id="taxIdValue"
                              placeholder={isInlineLabels ? 'Tax ID Number' : 'Tax ID Number'}
                              value={taxIdValue}
                              onChange={(e) => setTaxIdValue(e.target.value)}
                            />
                          ) : null}
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
                <CardDescription>Select GST or Tax and set the percentage.</CardDescription>
                </CardHeader>
                {showTaxSection && (
                <CardContent className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="includeTax"
                      checked={includeTax}
                      onCheckedChange={(checked) => setIncludeTax(checked === true)}
                    />
                    <Label htmlFor="includeTax" className="text-sm cursor-pointer">
                      Enable Tax
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isInlineLabels && (
                      <Label htmlFor="taxType" className="text-sm text-muted-foreground">
                        Type
                      </Label>
                    )}
                    <Select
                      value={taxType}
                      onValueChange={(value) => setTaxType(value as 'GST' | 'TAX')}
                      disabled={!includeTax}
                    >
                      <SelectTrigger id="taxType" className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GST">GST</SelectItem>
                        <SelectItem value="TAX">Tax</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isInlineLabels && (
                      <Label htmlFor="taxRate" className="text-sm text-muted-foreground">
                        Rate
                      </Label>
                    )}
                    <Input
                      id="taxRate"
                      type="number"
                      className="w-20"
                      placeholder={isInlineLabels ? 'Rate %' : undefined}
                      value={taxRate}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTaxRate(value === '' ? '' : parseInt(value, 10) || 0);
                      }}
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
                      <CardTitle className="text-lg sm:text-xl">Services & Pricing</CardTitle>
                    </div>
                    <div className="order-3 sm:order-2 sm:flex-1">
                      <CardDescription className="text-sm text-muted-foreground">
                        Add billable services with clear descriptions and rates. Totals update instantly.
                      </CardDescription>
                    </div>
                    <Button
                      className="order-2 w-full sm:order-3 sm:w-auto text-primary font-semibold"
                      variant="outline"
                      size="sm"
                      onClick={addLineItem}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lineItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="animate-fade-in space-y-4 rounded-xl border border-border/70 bg-background/95 p-4 shadow-sm ring-1 ring-transparent transition hover:ring-border"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                            Line {index + 1}
                          </span>
                          {item.service && (
                            <span className="text-sm font-medium text-foreground truncate max-w-[220px]">
                              {item.service}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:justify-end">
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
              </Card>
            </div>

            {/* Right Column - Summary */}
            <div className="order-2 space-y-6">
              {/* Pricing Summary */}
              <Card className="shadow-card xl:sticky xl:top-24">
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

                  {/* Discount */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="includeDiscount"
                        checked={includeDiscount}
                        onCheckedChange={(checked) => setIncludeDiscount(checked === true)}
                      />
                      <Label htmlFor="includeDiscount" className="text-sm cursor-pointer">
                        Discount
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        id="discountRate"
                        type="number"
                        className="w-20"
                        placeholder="0"
                        value={discountRate}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDiscountRate(value === '' ? '' : Math.min(parseInt(value, 10) || 0, 100));
                        }}
                        disabled={!includeDiscount}
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  {includeDiscount && discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount ({resolvedDiscountRate}%)</span>
                      <span className="text-destructive">- {formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  {/* Tax */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {taxType} ({resolvedTaxRate}%)
                      </span>
                    </div>
                    <span className="text-sm">{formatCurrency(taxAmount)}</span>
                  </div>

                  <Separator />

                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Payable</span>
                    <span className="text-2xl font-display font-bold text-success">
                      {formatCurrency(totalPayable)}
                    </span>
                  </div>

                  {/* Terms */}
                  <div className="pt-4 space-y-2 text-xs text-muted-foreground">
                    <p>- Timeline: {COMPANY_INFO.timeline}</p>
                    <p>- {COMPANY_INFO.paymentTerms}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Action Bar */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur">
        <div className="px-4 py-3 flex items-center gap-2">
          <Button className="flex-1" variant="accent" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          {canSendQuotation && (
            <Button className="flex-1" variant="default" onClick={handleSend} disabled={isSubmitting}>
              <Mail className="w-4 h-4 mr-2" />
              Send
            </Button>
          )}
          <Button className="flex-1" variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            Draft
          </Button>
          {isPublicQuote && (
            <Button
              className="flex-1"
              variant="ghost"
              onClick={() => navigate('/login', { state: { from: '/dashboard' } })}
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

