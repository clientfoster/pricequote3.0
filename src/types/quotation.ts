export interface LineItem {
  id: string;
  service: string;
  description: string;
  price: number;
  isFree: boolean;
}

export interface QuotationHeader {
  clientName: string;
  companyName: string;
  quoteDate: Date;
  validUntil: Date;
  contactNumber: string;
  email?: string;
}

export interface QuotationTotals {
  subtotal: number;
  gst: number;
  gstRate: number;
  totalPayable: number;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  header: QuotationHeader;
  lineItems: LineItem[];
  totals: QuotationTotals;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  createdBy: string;
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
  { service: 'Website Design', description: 'Custom responsive website design', price: 4000, isFree: false },
  { service: 'Social Media Setup', description: 'Complete social media profile setup', price: 1500, isFree: false },
  { service: 'Website Hosting', description: '1 year website hosting included', price: 0, isFree: true },
];
