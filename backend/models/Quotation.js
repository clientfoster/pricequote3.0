const mongoose = require('mongoose');

const lineItemSchema = mongoose.Schema({
    service: { type: String, required: true },
    description: { type: String, required: false },
    price: { type: Number, required: true, default: 0 },
    isFree: { type: Boolean, default: false },
});

const quotationSchema = mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Tenant',
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
    },
    quoteNumber: {
        type: String,
        required: true,
    },
    issuerCompanyName: { type: String },
    issuerTaxIdType: { type: String },
    issuerTaxIdValue: { type: String },
    issuerLogoUrl: { type: String },
    issuerSignatureUrl: { type: String },
    clientName: { type: String },
    companyName: { type: String },
    contactNumber: { type: String },
    email: { type: String },
    clientReferenceNo: { type: String },
    clientAddress: { type: String },
    clientLogoUrl: { type: String },
    country: { type: String },
    taxIdName: { type: String },
    taxIdValue: { type: String },
    quoteDate: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    lineItems: [lineItemSchema],
    subtotal: { type: Number, required: true },
    discountRate: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    gst: { type: Number, required: true },
    gstRate: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    totalPayable: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    exchangeRate: { type: Number, default: 1 },
    includeCompanyName: { type: Boolean, default: true },
    includeGstin: { type: Boolean, default: true },
    includeCin: { type: Boolean, default: true },
    includeClientDetails: { type: Boolean, default: true },
    status: {
        type: String,
        enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
        default: 'draft',
    },
    emailSentAt: { type: Date },
    pdfUrl: { type: String },
}, {
    timestamps: true,
});

quotationSchema.index({ tenantId: 1, quoteNumber: 1 }, { unique: true });

const Quotation = mongoose.model('Quotation', quotationSchema);

module.exports = Quotation;
