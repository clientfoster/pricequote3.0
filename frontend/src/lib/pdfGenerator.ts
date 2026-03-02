import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Quotation } from '@/types/quotation';
import { COMPANY_INFO } from '@/types/quotation';

// Colors
const COLORS = {
  primary: [30, 41, 59] as [number, number, number], // Slate-800
  accent: [20, 130, 121] as [number, number, number], // Teal
  text: [51, 65, 85] as [number, number, number], // Slate-600
  lightGray: [241, 245, 249] as [number, number, number], // Slate-100
  white: [255, 255, 255] as [number, number, number],
};

const formatCurrency = (amountInInr: number, currency: string = 'INR', rate: number = 1) => {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  const converted = currency === 'INR' ? amountInInr : amountInInr * rate;
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(converted);
  const prefix = currency === 'INR' ? 'Rs.' : currency;
  return `${prefix} ${formatted}`;
};

export const generateQuotationPDF = (quotation: Quotation) => {
  const doc = new jsPDF();
  generateDoc(doc, quotation);
  doc.save(`${quotation.quoteNumber}.pdf`);
};

export const getQuotationPDFBlob = (quotation: Quotation): Blob => {
  const doc = new jsPDF();
  generateDoc(doc, quotation);
  return doc.output('blob');
};

const generateDoc = (doc: jsPDF, quotation: Quotation) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = 0;
  const includeCompanyName = quotation.includeCompanyName !== false;
  const includeGstin = quotation.includeGstin !== false;
  const includeCin = quotation.includeCin !== false;
  const includeClientDetails = quotation.includeClientDetails !== false;

  // --- Helper Functions ---
  const addText = (text: string, x: number, y: number, size: number = 10, style: 'normal' | 'bold' = 'normal', color: [number, number, number] = COLORS.text, align: 'left' | 'center' | 'right' = 'left') => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.text(text, x, y, { align });
  };

  const addImageIfAvailable = (src?: string, x: number = 0, y: number = 0, w: number = 0, h: number = 0) => {
    if (!src) return false;
    try {
      doc.addImage(src, 'PNG', x, y, w, h);
      return true;
    } catch {
      return false;
    }
  };

  // --- Header ---
  // Background
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 40, 'F');
  yPos = 40;

  // Logo
  const hasIssuerLogo = addImageIfAvailable(quotation.issuerLogoDataUrl || quotation.issuerLogoUrl, margin, 10, 20, 20);
  if (!hasIssuerLogo) {
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(margin, 10, 20, 20, 3, 3, 'F');
    addText('S', margin + 6.5, 23, 14, 'bold', COLORS.white);
  }

  // Company Name
  if (includeCompanyName) {
    const issuerName = quotation.issuerCompanyName || COMPANY_INFO.name;
    addText(issuerName.replace(' Private Limited', ''), margin + 26, 18, 16, 'bold', COLORS.white);
    addText('Private Limited', margin + 26, 25, 10, 'normal', COLORS.white);
  }

  // Header Details (Right side)
  addText('QUOTATION', pageWidth - margin, 18, 14, 'bold', COLORS.white, 'right');
  addText(quotation.quoteNumber, pageWidth - margin, 26, 11, 'normal', COLORS.accent, 'right');

  // --- Info Section ---
  yPos += 15;

  // Company Address/Info
  const hasCompanyInfo = includeCompanyName || includeGstin || includeCin;
  if (hasCompanyInfo) {
    addText('FROM:', margin, yPos, 8, 'bold', COLORS.text);
    yPos += 5;
  }
  if (includeCompanyName) {
    addText(quotation.issuerCompanyName || COMPANY_INFO.name, margin, yPos, 9, 'bold');
    yPos += 5;
  }
  if (includeGstin) {
    const issuerTaxType = quotation.issuerTaxIdType || 'GSTIN';
    const issuerTaxValue = quotation.issuerTaxIdValue || COMPANY_INFO.gstin;
    addText(`${issuerTaxType}: ${issuerTaxValue}`, margin, yPos, 8);
    yPos += 4;
  }
  if (includeCin) {
    addText(`CIN: ${COMPANY_INFO.cin}`, margin, yPos, 8);
    yPos += 4;
  }
  yPos += hasCompanyInfo ? 8 : 2; // Spacer

  // Client Details (Bill To)
  const clientY = 55; // Align with "FROM" section roughly or slightly below header
  // Note: We'll place "Bill To" on the right side logic or keep left but lower?
  // Let's use two columns: Left for From, Right for Dates. Then simpler Bill To below.

  // Dates (Right synchronized with From)
  const dateX = pageWidth - margin - 40;
  addText('Quote Date:', dateX, 60, 9, 'bold', COLORS.text);
  addText(format(quotation.quoteDate, 'dd MMM yyyy'), pageWidth - margin, 60, 9, 'normal', COLORS.text, 'right');

  addText('Valid Until:', dateX, 66, 9, 'bold', COLORS.text);
  addText(format(quotation.validUntil, 'dd MMM yyyy'), pageWidth - margin, 66, 9, 'normal', COLORS.text, 'right');

  // --- Bill To Box ---
  yPos = includeClientDetails ? 80 : 70;
  if (includeClientDetails) {
    const hasCountry = Boolean(quotation.country);
    const hasTaxId = Boolean(quotation.taxIdName || quotation.taxIdValue);
    const hasReference = Boolean(quotation.clientReferenceNo);
    const hasAddress = Boolean(quotation.clientAddress);
    const extraLines = (hasCountry ? 1 : 0) + (hasTaxId ? 1 : 0) + (hasReference ? 1 : 0) + (hasAddress ? 1 : 0);
    const billToHeight = 35 + extraLines * 5;

    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, billToHeight, 2, 2, 'F');

    const boxPadding = 5;
    addText('BILL TO:', margin + boxPadding, yPos + 8 + boxPadding, 8, 'bold', COLORS.accent);
    addText(quotation.clientName, margin + boxPadding, yPos + 18, 11, 'bold', COLORS.primary);
    addText(quotation.companyName, margin + boxPadding, yPos + 24, 9, 'normal', COLORS.text);

    // Client logo on the top-right of bill-to block (if uploaded)
    addImageIfAvailable(quotation.clientLogoDataUrl || quotation.clientLogoUrl, pageWidth - margin - 26, yPos + 8, 18, 18);

    let clientLineY = yPos + 30;
    const contactInfo = [quotation.contactNumber, quotation.email].filter(Boolean).join(' | ');
    addText(contactInfo, margin + boxPadding, clientLineY, 9, 'normal', COLORS.text);
    if (hasCountry) {
      clientLineY += 5;
      addText(`Country: ${quotation.country}`, margin + boxPadding, clientLineY, 8, 'normal', COLORS.text);
    }
    if (hasTaxId) {
      clientLineY += 5;
      addText(`${quotation.taxIdName || 'Tax ID'}: ${quotation.taxIdValue || '-'}`, margin + boxPadding, clientLineY, 8, 'normal', COLORS.text);
    }
    if (quotation.clientReferenceNo) {
      clientLineY += 5;
      addText(`Reference: ${quotation.clientReferenceNo}`, margin + boxPadding, clientLineY, 8, 'normal', COLORS.text);
    }
    if (quotation.clientAddress) {
      clientLineY += 5;
      addText(`Address: ${quotation.clientAddress}`, margin + boxPadding, clientLineY, 8, 'normal', COLORS.text);
    }

    yPos += billToHeight + 10;
  }

  // --- Table ---
  const tableData = quotation.lineItems.map((item, index) => [
    (index + 1).toString(),
    item.service,
    item.description || '-',
    item.isFree ? 'FREE' : formatCurrency(item.price, quotation.currency || 'INR', quotation.exchangeRate || 1),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Service', 'Description', 'Amount']],
    body: tableData,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    bodyStyles: {
      textColor: COLORS.text,
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 50, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 30, halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    styles: {
      lineColor: [230, 230, 230],
      lineWidth: 0.1,
    },
  });

  // --- Totals ---
  yPos = (doc as any).lastAutoTable.finalY + 10;
  const totalsWidth = 70;
  const totalsX = pageWidth - margin - totalsWidth;

  const addTotalRow = (label: string, value: string, isBold: boolean = false, isLast: boolean = false) => {
    addText(label, totalsX, yPos, 9, isBold ? 'bold' : 'normal', COLORS.text);
    addText(value, pageWidth - margin, yPos, 9, isBold ? 'bold' : 'normal', isBold ? COLORS.primary : COLORS.text, 'right');
    yPos += 6;
  };

  addTotalRow('Subtotal:', formatCurrency(quotation.subtotal, quotation.currency || 'INR', quotation.exchangeRate || 1));
  addTotalRow(`GST (${quotation.gstRate}%):`, formatCurrency(quotation.gst, quotation.currency || 'INR', quotation.exchangeRate || 1));
  if (typeof quotation.tax === 'number' && quotation.tax > 0) {
    addTotalRow(`Tax (${quotation.taxRate || 0}%):`, formatCurrency(quotation.tax, quotation.currency || 'INR', quotation.exchangeRate || 1));
  }

  // Divider
  doc.setDrawColor(...COLORS.accent);
  doc.line(totalsX, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // Grand Total (clean line)
  addTotalRow('Total Payable:', formatCurrency(quotation.totalPayable, quotation.currency || 'INR', quotation.exchangeRate || 1), true);

  // --- Footer Content (Terms & Bank) ---
  // Using yPos from where Table ended (left side) instead of pushing down if table is short
  // But safer to verify yPos vs page height
  let footerContentY = (doc as any).lastAutoTable.finalY + 10;
  if (footerContentY < pageHeight - 100) {
    footerContentY = pageHeight - 100; // Push to bottom if plenty of space
  } else {
    footerContentY += 40; // Add space if table was long
  }

  // Ensure strict page break logic isn't needed for this simple redesign unless table is huge.
  // Setup Bank Details
  doc.setDrawColor(...COLORS.lightGray);
  doc.line(margin, footerContentY, pageWidth - margin, footerContentY);
  footerContentY += 10;

  // Two columns for footer: Terms (Left), Bank (Right)
  const colWidth = (pageWidth - 2 * margin) / 2 - 5;

  // Terms
  let termY = footerContentY;
  addText('Terms & Conditions', margin, termY, 9, 'bold', COLORS.primary);
  termY += 5;
  const terms = [
    `• Timeline: ${COMPANY_INFO.timeline}`,
    `• ${COMPANY_INFO.paymentTerms}`,
    '• Validity: 15 days from issue date',
    '• Prices subject to change post-validity',
  ];
  terms.forEach(term => {
    addText(term, margin, termY, 8, 'normal', COLORS.text);
    termY += 4;
  });

  // Bank Details
  let bankY = footerContentY;
  const bankX = pageWidth - margin - colWidth;
  addText('Bank Details', bankX, bankY, 9, 'bold', COLORS.primary);
  bankY += 5;
  addText(`Bank: ${COMPANY_INFO.bankName}`, bankX, bankY, 8, 'normal', COLORS.text);
  bankY += 4;
  addText(`Account: ${COMPANY_INFO.name}`, bankX, bankY, 8, 'normal', COLORS.text);
  bankY += 4;
  addText(`IFSC: ${COMPANY_INFO.ifsc}`, bankX, bankY, 8, 'normal', COLORS.text);

  // --- Global Footer (Page Number / Tagline) ---
  const bottomY = pageHeight - 10;
  addText('Thank you for your business!', pageWidth / 2, bottomY - 5, 8, 'normal', COLORS.accent, 'center');
  addText(`Generated on ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, pageWidth / 2, bottomY, 7, 'normal', [150, 160, 170], 'center');
};

