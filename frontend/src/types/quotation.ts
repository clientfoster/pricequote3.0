export interface LineItem {
  id: string;
  service: string;
  description: string;
  price: number;
  isFree: boolean;
}

export interface Quotation {
  _id: string; // MongoDB uses _id
  id?: string; // For compatibility if needed, but best to stick to _id or map it
  quoteNumber: string;
  issuerCompanyName?: string;
  issuerTaxIdType?: string;
  issuerTaxIdValue?: string;
  issuerLogoUrl?: string;
  issuerLogoDataUrl?: string;
  clientName: string;
  companyName: string;
  contactNumber: string;
  email?: string;
  clientReferenceNo?: string;
  clientAddress?: string;
  clientLogoUrl?: string;
  clientLogoDataUrl?: string;
  country?: string;
  taxIdName?: string;
  taxIdValue?: string;
  quoteDate: Date;
  validUntil: Date;
  lineItems: LineItem[];
  subtotal: number;
  gst: number;
  gstRate: number;
  tax?: number;
  taxRate?: number;
  totalPayable: number;
  currency?: string;
  exchangeRate?: number; // currency per 1 INR
  includeCompanyName?: boolean;
  includeGstin?: boolean;
  includeCin?: boolean;
  includeClientDetails?: boolean;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  pdfUrl?: string; // Added from backend
  user?: {
    _id: string;
    name: string;
    email: string;
  } | string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type QuotationStatus = Quotation['status'];

export const COMPANY_INFO = {
  name: 'Semixon Technologies Private Limited',
  gstin: '29ABQCS8084G1ZI',
  cin: 'U58200TS2025PTC201438',
  bankName: 'YES BANK',
  ifsc: 'YESB0000476',
  timeline: '4-7 working days',
  paymentTerms: '100% advance payment required',
} as const;

export const DEFAULT_LINE_ITEMS: Omit<LineItem, 'id'>[] = [
  { service: 'Website Design', description: 'Custom responsive website design', price: 0, isFree: false },
  { service: 'Social Media Setup', description: 'Complete social media profile setup', price: 0, isFree: false },
  { service: 'Website Hosting', description: '1 year website hosting included', price: 0, isFree: true },
];
