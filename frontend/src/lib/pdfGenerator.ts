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
  const margin = 18;
  let yPos = 20;
  const includeCompanyName = quotation.includeCompanyName !== false;
  const includeGstin = quotation.includeGstin !== false;
  const includeClientDetails = quotation.includeClientDetails !== false;

  const addText = (
    text: string,
    x: number,
    y: number,
    size: number = 10,
    style: 'normal' | 'bold' = 'normal',
    color: [number, number, number] = COLORS.text,
    align: 'left' | 'center' | 'right' = 'left'
  ) => {
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

  // Header
  const logoSize = 22;
  const hasLogo = addImageIfAvailable(quotation.issuerLogoDataUrl || quotation.issuerLogoUrl, margin, yPos, logoSize, logoSize);
  if (!hasLogo) {
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(margin, yPos, logoSize, logoSize, 3, 3, 'F');
    addText('Q', margin + 7, yPos + 15, 14, 'bold', COLORS.white);
  }

  const companyX = margin + logoSize + 8;
  const issuerName = quotation.issuerCompanyName || COMPANY_INFO.name;
  if (includeCompanyName && issuerName) {
    addText(issuerName, companyX, yPos + 8, 13, 'bold', COLORS.primary);
  }
  const addressLines = COMPANY_INFO.addressLines || [];
  addressLines.forEach((line, idx) => {
    addText(line, companyX, yPos + 14 + idx * 4, 8, 'normal', COLORS.text);
  });
  if (includeGstin && quotation.issuerTaxIdValue) {
    addText(`${quotation.issuerTaxIdType || 'Tax ID'}: ${quotation.issuerTaxIdValue}`, companyX, yPos + 26, 8, 'normal', COLORS.text);
  }

  addText('QUOTATION', pageWidth - margin, yPos + 8, 12, 'bold', COLORS.primary, 'right');
  addText(`Quotation #: ${quotation.quoteNumber}`, pageWidth - margin, yPos + 14, 9, 'normal', COLORS.text, 'right');
  addText(`Quote Date: ${format(new Date(quotation.quoteDate), 'dd MMM yyyy')}`, pageWidth - margin, yPos + 20, 8, 'normal', COLORS.text, 'right');
  addText(`Valid Until: ${format(new Date(quotation.validUntil), 'dd MMM yyyy')}`, pageWidth - margin, yPos + 26, 8, 'normal', COLORS.text, 'right');

  yPos += 34;
  doc.setDrawColor(...COLORS.lightGray);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Bill To
  if (includeClientDetails) {
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 28, 2, 2, 'F');
    addText('BILL TO', margin + 6, yPos + 8, 8, 'bold', COLORS.accent);
    addText(quotation.clientName || '-', margin + 6, yPos + 14, 10, 'bold', COLORS.primary);
    addText(quotation.companyName || '-', margin + 6, yPos + 19, 8, 'normal', COLORS.text);
    const contactInfo = [quotation.email, quotation.contactNumber].filter(Boolean).join(' | ');
    addText(contactInfo || '-', margin + 6, yPos + 24, 8, 'normal', COLORS.text);
    yPos += 34;
  }

  // Services Table
  const tableData = quotation.lineItems.map((item) => {
    const quantity = 1;
    const unitPrice = item.isFree ? 0 : item.price;
    const total = unitPrice * quantity;
    return [
      item.service,
      item.description || '-',
      quantity.toString(),
      item.isFree ? 'FREE' : formatCurrency(unitPrice, quotation.currency || 'INR', quotation.exchangeRate || 1),
      item.isFree ? 'FREE' : formatCurrency(total, quotation.currency || 'INR', quotation.exchangeRate || 1),
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Item', 'Description', 'Quantity', 'Unit Price', 'Total']],
    body: tableData,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      textColor: COLORS.text,
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold' },
      1: { cellWidth: 60 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    styles: {
      lineColor: [230, 230, 230],
      lineWidth: 0.1,
    },
  });

  // Summary
  yPos = (doc as any).lastAutoTable.finalY + 10;
  const summaryX = pageWidth - margin - 70;
  const addSummaryRow = (label: string, value: string, bold: boolean = false) => {
    addText(label, summaryX, yPos, 9, bold ? 'bold' : 'normal', COLORS.text);
    addText(value, pageWidth - margin, yPos, 9, bold ? 'bold' : 'normal', COLORS.text, 'right');
    yPos += 6;
  };

  addSummaryRow('Subtotal', formatCurrency(quotation.subtotal, quotation.currency || 'INR', quotation.exchangeRate || 1));
  if ((quotation.discountAmount || 0) > 0) {
    addSummaryRow(`Discount (${quotation.discountRate || 0}%)`, `- ${formatCurrency(quotation.discountAmount || 0, quotation.currency || 'INR', quotation.exchangeRate || 1)}`);
  }
  if ((quotation.gst || 0) > 0) {
    addSummaryRow(`GST (${quotation.gstRate || 0}%)`, formatCurrency(quotation.gst || 0, quotation.currency || 'INR', quotation.exchangeRate || 1));
  }
  if ((quotation.tax || 0) > 0) {
    addSummaryRow(`Tax (${quotation.taxRate || 0}%)`, formatCurrency(quotation.tax || 0, quotation.currency || 'INR', quotation.exchangeRate || 1));
  }
  doc.setDrawColor(...COLORS.accent);
  doc.line(summaryX, yPos, pageWidth - margin, yPos);
  yPos += 5;
  addSummaryRow('Total Payable', formatCurrency(quotation.totalPayable, quotation.currency || 'INR', quotation.exchangeRate || 1), true);

  // Footer
  let footerY = yPos + 10;
  if (footerY + 40 > pageHeight - 20) {
    doc.addPage();
    footerY = 20;
  }
  addText('Payment Terms', margin, footerY, 9, 'bold', COLORS.primary);
  addText(COMPANY_INFO.paymentTerms, margin, footerY + 5, 8, 'normal', COLORS.text);
  addText('Thank you for your business!', margin, footerY + 16, 9, 'normal', COLORS.accent);

  const signatureX = pageWidth - margin - 60;
  const signatureSrc = quotation.issuerSignatureDataUrl || quotation.issuerSignatureUrl;
  if (signatureSrc) {
    addImageIfAvailable(signatureSrc, signatureX, footerY + 2, 60, 14);
  }
  addText('Authorized Signature', signatureX + 30, footerY + 20, 8, 'normal', COLORS.text, 'center');
  doc.setDrawColor(...COLORS.text);
  doc.line(signatureX, footerY + 18, pageWidth - margin, footerY + 18);
};
