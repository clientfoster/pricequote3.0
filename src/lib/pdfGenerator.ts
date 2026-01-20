import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Quotation } from '@/types/quotation';
import { COMPANY_INFO } from '@/types/quotation';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const generateQuotationPDF = (quotation: Quotation) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Colors
  const primaryColor: [number, number, number] = [30, 41, 59]; // Slate-800
  const accentColor: [number, number, number] = [20, 130, 121]; // Teal
  const textColor: [number, number, number] = [51, 65, 85]; // Slate-600
  const lightGray: [number, number, number] = [241, 245, 249]; // Slate-100

  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Company Logo (stylized "S")
  doc.setFillColor(...accentColor);
  doc.roundedRect(margin, 12, 26, 26, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('S', margin + 9, 30);

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Semixon Technologies', margin + 34, 24);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Private Limited', margin + 34, 32);

  // Quote Number (right side)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', pageWidth - margin, 20, { align: 'right' });
  doc.setFontSize(14);
  doc.setTextColor(...accentColor);
  doc.text(quotation.quoteNumber, pageWidth - margin, 30, { align: 'right' });

  yPos = 60;

  // Company details section
  doc.setTextColor(...textColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`GSTIN: ${COMPANY_INFO.gstin}`, margin, yPos);
  doc.text(`CIN: ${COMPANY_INFO.cin}`, margin, yPos + 5);

  // Quote details (right side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Quote Date:', pageWidth - 80, yPos);
  doc.text('Valid Until:', pageWidth - 80, yPos + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(format(quotation.header.quoteDate, 'dd MMM yyyy'), pageWidth - margin, yPos, { align: 'right' });
  doc.text(format(quotation.header.validUntil, 'dd MMM yyyy'), pageWidth - margin, yPos + 6, { align: 'right' });

  yPos = 80;

  // Bill To Section
  doc.setFillColor(...lightGray);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, 'F');

  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', margin + 8, yPos + 10);

  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.text(quotation.header.clientName, margin + 8, yPos + 18);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(quotation.header.companyName, margin + 8, yPos + 24);
  doc.text(`${quotation.header.contactNumber}${quotation.header.email ? ` | ${quotation.header.email}` : ''}`, margin + 8, yPos + 30);

  yPos = 125;

  // Services Table
  const tableData = quotation.lineItems.map((item, index) => [
    (index + 1).toString(),
    item.service,
    item.description,
    item.isFree ? 'FREE' : formatCurrency(item.price),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Service', 'Description', 'Amount']],
    body: tableData,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      textColor: textColor,
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 45 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 35, halign: 'right' },
    },
    styles: {
      cellPadding: 4,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
  });

  // Get the final Y position after the table
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Totals Section
  const totalsX = pageWidth - margin - 70;
  const totalsWidth = 70;

  doc.setFillColor(...lightGray);
  doc.roundedRect(totalsX - 5, yPos, totalsWidth + 10, 45, 3, 3, 'F');

  doc.setTextColor(...textColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // Subtotal
  doc.text('Subtotal:', totalsX, yPos + 10);
  doc.text(formatCurrency(quotation.totals.subtotal), totalsX + totalsWidth, yPos + 10, { align: 'right' });

  // GST
  doc.text(`GST (${quotation.totals.gstRate}%):`, totalsX, yPos + 20);
  doc.text(formatCurrency(quotation.totals.gst), totalsX + totalsWidth, yPos + 20, { align: 'right' });

  // Total line
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.5);
  doc.line(totalsX, yPos + 27, totalsX + totalsWidth, yPos + 27);

  // Total Payable
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text('Total:', totalsX, yPos + 37);
  doc.setTextColor(...accentColor);
  doc.text(formatCurrency(quotation.totals.totalPayable), totalsX + totalsWidth, yPos + 37, { align: 'right' });

  yPos = yPos + 60;

  // Terms & Conditions
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Terms & Conditions', margin, yPos);

  doc.setTextColor(...textColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  yPos += 8;

  const terms = [
    `• Timeline: ${COMPANY_INFO.timeline}`,
    `• ${COMPANY_INFO.paymentTerms}`,
    '• This quotation is valid for 15 days from the date of issue.',
    '• Prices are subject to change without prior notice after the validity period.',
    '• Work will commence upon receipt of advance payment.',
  ];

  terms.forEach((term) => {
    doc.text(term, margin, yPos);
    yPos += 5;
  });

  yPos += 10;

  // Bank Details
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 30, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Bank Details for Payment', margin + 10, yPos + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Bank: ${COMPANY_INFO.bankName}  |  IFSC: ${COMPANY_INFO.ifsc}`, margin + 10, yPos + 18);
  doc.text(`Account Name: ${COMPANY_INFO.name}`, margin + 10, yPos + 24);

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setTextColor(...textColor);
  doc.setFontSize(8);
  doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
  doc.setFontSize(7);
  doc.text(`Generated on ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, pageWidth / 2, footerY + 5, { align: 'center' });

  // Save the PDF
  doc.save(`${quotation.quoteNumber}.pdf`);
};
