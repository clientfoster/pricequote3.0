const asyncHandler = require('express-async-handler');
const Quotation = require('../models/Quotation');
const Client = require('../models/Client');
const sendEmail = require('../utils/sendEmail');
const axios = require('axios');

// @desc    Create new quotation
// @route   POST /api/quotations
// @access  Private
const createQuotation = asyncHandler(async (req, res) => {
    const {
        quoteNumber,
        issuerCompanyName,
        issuerTaxIdType,
        issuerTaxIdValue,
        issuerLogoUrl,
        issuerSignatureUrl,
        clientId,
        clientName,
        companyName,
        contactNumber,
        email,
        clientReferenceNo,
        clientAddress,
        clientLogoUrl,
        country,
        taxIdName,
        taxIdValue,
        quoteDate,
        validUntil,
        lineItems,
        subtotal,
        discountRate,
        discountAmount,
        gst,
        gstRate,
        tax,
        taxRate,
        totalPayable,
        currency,
        exchangeRate,
        status,
        pdfUrl,
        includeCompanyName,
        includeGstin,
        includeCin,
        includeClientDetails
    } = req.body;

    let resolvedClientId = clientId;
    if (!resolvedClientId) {
        try {
            let clientQuery = null;
            if (email) {
                clientQuery = { email };
            } else if (clientName && companyName) {
                clientQuery = { name: clientName, companyName };
            }

            if (clientQuery) {
                const existingClient = await Client.findOne({ ...clientQuery, tenantId: req.user.tenantId });
                if (existingClient) {
                    resolvedClientId = existingClient._id;
                } else if (clientName || companyName || email) {
                    const createdClient = await Client.create({
                        tenantId: req.user.tenantId,
                        user: req.user._id,
                        name: clientName,
                        companyName: companyName,
                        email: email,
                        contactNumber: contactNumber,
                        address: clientAddress,
                        country: country,
                        taxIdName: taxIdName,
                        taxIdValue: taxIdValue,
                        gstin: taxIdValue,
                    });
                    resolvedClientId = createdClient._id;
                    console.log(`Auto-added new client: ${clientName}`);
                }
            }
        } catch (err) {
            console.error('Failed to resolve or auto-add client:', err);
            // Do not fail the request
        }
    }

    const quotation = new Quotation({
        tenantId: req.user.tenantId,
        user: req.user._id,
        clientId: resolvedClientId,
        quoteNumber,
        issuerCompanyName,
        issuerTaxIdType,
        issuerTaxIdValue,
        issuerLogoUrl,
        issuerSignatureUrl,
        clientName,
        companyName,
        contactNumber,
        email,
        clientReferenceNo,
        clientAddress,
        clientLogoUrl,
        country,
        taxIdName,
        taxIdValue,
        quoteDate,
        validUntil,
        lineItems,
        subtotal,
        discountRate,
        discountAmount,
        gst,
        gstRate,
        tax,
        taxRate,
        totalPayable,
        currency,
        exchangeRate,
        status,
        pdfUrl,
        includeCompanyName,
        includeGstin,
        includeCin,
        includeClientDetails
    });

    let createdQuotation;
    try {
        createdQuotation = await quotation.save();
    } catch (error) {
        if (error && error.code === 11000) {
            res.status(409);
            throw new Error('Quotation number already exists. Please generate a new quotation number.');
        }
        throw error;
    }

    // Auto-Send Email if Status is 'sent' and PDF URL exists
    console.log('Attempting auto-email. Data:', { status, pdfUrl, email });

    if (status === 'sent' && pdfUrl && email) {
        console.log('Conditions met. Sending email...');
        const emailSubject = `Quotation ${quoteNumber} from Semixon Technologies`;
        const emailMessage = `
            <h2>Quotation from Semixon Technologies</h2>
            <p>Dear ${clientName},</p>
            <p>Please find attached your quotation <strong>${quoteNumber}</strong>.</p>
            <p><strong>Total Amount:</strong> ₹${totalPayable.toLocaleString('en-IN')}</p>
            <p>You can view and download the quotation using the link below:</p>
            <a href="${pdfUrl}" style="background-color: #208279; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">View Quotation PDF</a>
            <p>If you have any questions, feel free to contact us.</p>
            <br>
            <p>Best Regards,</p>
            <p>Semixon Technologies Team</p>
        `;


        try {
            // Fetch PDF content explicitly to avoid Nodemailer 401 issues
            console.log('Fetching PDF for attachment...');
            const pdfResponse = await axios.get(pdfUrl, { responseType: 'arraybuffer' });

            await sendEmail({
                email,
                subject: emailSubject,
                message: emailMessage,
                replyTo: req.user?.email,
                attachments: [
                    {
                        filename: `${quoteNumber || 'Quotation'}.pdf`,
                        content: pdfResponse.data
                    }
                ]
            });
            console.log(`Email with attachment sent successfully to ${email}`);
        } catch (error) {
            console.error('Failed to send email with attachment:', error);
            console.log('Retrying email without attachment...');
            try {
                await sendEmail({
                    email,
                    subject: emailSubject,
                    message: emailMessage,
                    replyTo: req.user?.email
                    // No attachments
                });
                console.log(`Email (fallback) sent successfully to ${email}`);
            } catch (retryError) {
                console.error('Failed to send fallback email:', retryError);
            }
        }
    }

    res.status(201).json(createdQuotation);
});

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
const getQuotations = asyncHandler(async (req, res) => {
    let query = { tenantId: req.user.tenantId };
    if (req.user.role !== 'SuperAdmin') {
        query = { tenantId: req.user.tenantId, user: req.user._id };
    }
    const quotations = await Quotation.find(query).populate('user', 'name email').sort({ createdAt: -1 });
    res.json(quotations);
});

// @desc    Get quotation by ID
// @route   GET /api/quotations/:id
// @access  Private
const getQuotationById = asyncHandler(async (req, res) => {
    const quotation = await Quotation.findOne({ _id: req.params.id, tenantId: req.user.tenantId }).populate('user', 'name email');

    if (quotation) {
        // Access Control: SuperAdmin or Owner only
        if (req.user.role !== 'SuperAdmin' &&
            (!quotation.user || (typeof quotation.user === 'object' ? quotation.user._id.toString() !== req.user._id.toString() : quotation.user.toString() !== req.user._id.toString()))) {
            res.status(401);
            throw new Error('Not authorized to view this quotation');
        }
        res.json(quotation);
    } else {
        res.status(404);
        throw new Error('Quotation not found');
    }
});

// @desc    Update quotation
// @route   PUT /api/quotations/:id
// @access  Private
const updateQuotation = asyncHandler(async (req, res) => {
    const {
        clientId,
        clientName,
        companyName,
        contactNumber,
        email,
        issuerCompanyName,
        issuerTaxIdType,
        issuerTaxIdValue,
        issuerLogoUrl,
        issuerSignatureUrl,
        clientReferenceNo,
        clientAddress,
        clientLogoUrl,
        country,
        taxIdName,
        taxIdValue,
        quoteDate,
        validUntil,
        lineItems,
        subtotal,
        discountRate,
        discountAmount,
        gst,
        gstRate,
        totalPayable,
        status
    } = req.body;

    const quotation = await Quotation.findOne({ _id: req.params.id, tenantId: req.user.tenantId });

    if (quotation) {
        if (clientId) quotation.clientId = clientId;
        if (typeof clientName === 'string') quotation.clientName = clientName;
        if (typeof companyName === 'string') quotation.companyName = companyName;
        if (typeof contactNumber === 'string') quotation.contactNumber = contactNumber;
        if (typeof email === 'string') quotation.email = email;
        if (typeof issuerCompanyName === 'string') quotation.issuerCompanyName = issuerCompanyName;
        if (typeof issuerTaxIdType === 'string') quotation.issuerTaxIdType = issuerTaxIdType;
        if (typeof issuerTaxIdValue === 'string') quotation.issuerTaxIdValue = issuerTaxIdValue;
        if (typeof issuerLogoUrl === 'string') quotation.issuerLogoUrl = issuerLogoUrl;
        if (typeof issuerSignatureUrl === 'string') quotation.issuerSignatureUrl = issuerSignatureUrl;
        if (typeof clientReferenceNo === 'string') quotation.clientReferenceNo = clientReferenceNo;
        if (typeof clientAddress === 'string') quotation.clientAddress = clientAddress;
        if (typeof clientLogoUrl === 'string') quotation.clientLogoUrl = clientLogoUrl;
        if (typeof country === 'string') quotation.country = country;
        if (typeof taxIdName === 'string') quotation.taxIdName = taxIdName;
        if (typeof taxIdValue === 'string') quotation.taxIdValue = taxIdValue;
        if (quoteDate) quotation.quoteDate = quoteDate;
        if (validUntil) quotation.validUntil = validUntil;
        if (Array.isArray(lineItems) && lineItems.length > 0) quotation.lineItems = lineItems;
        if (typeof subtotal === 'number') quotation.subtotal = subtotal;
        if (typeof discountRate === 'number') quotation.discountRate = discountRate;
        if (typeof discountAmount === 'number') quotation.discountAmount = discountAmount;
        if (typeof gst === 'number') quotation.gst = gst;
        if (typeof gstRate === 'number') quotation.gstRate = gstRate;
        if (typeof req.body.tax === 'number') quotation.tax = req.body.tax;
        if (typeof req.body.taxRate === 'number') quotation.taxRate = req.body.taxRate;
        if (typeof totalPayable === 'number') quotation.totalPayable = totalPayable;
        if (req.body.currency) quotation.currency = req.body.currency;
        if (typeof req.body.exchangeRate === 'number') quotation.exchangeRate = req.body.exchangeRate;
        if (typeof status === 'string') quotation.status = status;
        if (typeof req.body.includeCompanyName === 'boolean') quotation.includeCompanyName = req.body.includeCompanyName;
        if (typeof req.body.includeGstin === 'boolean') quotation.includeGstin = req.body.includeGstin;
        if (typeof req.body.includeCin === 'boolean') quotation.includeCin = req.body.includeCin;
        if (typeof req.body.includeClientDetails === 'boolean') quotation.includeClientDetails = req.body.includeClientDetails;
        if (req.body.pdfUrl) quotation.pdfUrl = req.body.pdfUrl;

        const updatedQuotation = await quotation.save();

        // Auto-Send Email if Status is 'sent' and PDF URL exists
        if (req.body.status === 'sent' && req.body.pdfUrl && email) {
            console.log('Attempting update auto-email...');
            const emailSubject = `Updated Quotation ${quotation.quoteNumber} from Semixon Technologies`;
            const emailMessage = `
                <h2>Quotation Updated from Semixon Technologies</h2>
                <p>Dear ${clientName},</p>
                <p>Please find attached your updated quotation <strong>${quotation.quoteNumber}</strong>.</p>
                <p><strong>Total Amount:</strong> ₹${totalPayable.toLocaleString('en-IN')}</p>
                <p>You can view and download the quotation using the link below:</p>
                <a href="${req.body.pdfUrl}" style="background-color: #208279; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">View Quotation PDF</a>
                <p>If you have any questions, feel free to contact us.</p>
                <br>
                <p>Best Regards,</p>
                <p>Semixon Technologies Team</p>
            `;

            try {
                // Fetch PDF content explicitly to avoid Nodemailer 401 issues
                console.log('Fetching PDF for attachment...');
                const pdfResponse = await axios.get(req.body.pdfUrl, { responseType: 'arraybuffer' });

                await sendEmail({
                    email,
                    subject: emailSubject,
                    message: emailMessage,
                    replyTo: req.user?.email,
                    attachments: [
                        {
                            filename: `${quotation.quoteNumber}.pdf`,
                            content: pdfResponse.data
                        }
                    ]
                });
                console.log(`Email with attachment sent successfully to ${email}`);
                quotation.emailSentAt = new Date();
                if (quotation.status === 'draft') {
                    quotation.status = 'sent';
                }
                await quotation.save();
            } catch (error) {
                console.error('Failed to send email with attachment:', error);
                console.log('Retrying email without attachment...');
                try {
                    await sendEmail({
                        email,
                        subject: emailSubject,
                        message: emailMessage,
                        replyTo: req.user?.email
                        // No attachments
                    });
                    console.log(`Email (fallback) sent successfully to ${email}`);
                    quotation.emailSentAt = new Date();
                    if (quotation.status === 'draft') {
                        quotation.status = 'sent';
                    }
                    await quotation.save();
                } catch (retryError) {
                    console.error('Failed to send fallback email:', retryError);
                }
            }
        }

        res.json(updatedQuotation);
    } else {
        res.status(404);
        throw new Error('Quotation not found');
    }
});

// @desc    Get dashboard stats
// @route   GET /api/quotations/stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
    let query = { tenantId: req.user.tenantId };
    if (req.user.role !== 'SuperAdmin') {
        query = { tenantId: req.user.tenantId, user: req.user._id };
    }

    const quotations = await Quotation.find(query);

    const totalQuotations = quotations.length;
    const acceptedQuotations = quotations.filter(q => q.status === 'accepted').length;
    const pendingQuotations = quotations.filter(q => q.status === 'sent' || q.status === 'draft').length;
    const totalRevenue = quotations
        .filter(q => q.status === 'accepted')
        .reduce((sum, q) => sum + q.totalPayable, 0);

    const recentQuotations = await Quotation.find(query)
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .limit(5);

    res.json({
        totalQuotations,
        acceptedQuotations,
        pendingQuotations,
        totalRevenue,
        recentQuotations
    });
});

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
// @access  Private
const deleteQuotation = asyncHandler(async (req, res) => {
    const quotation = await Quotation.findOne({ _id: req.params.id, tenantId: req.user.tenantId });

    if (quotation) {
        await quotation.deleteOne();
        res.json({ message: 'Quotation removed' });
    } else {
        res.status(404);
        throw new Error('Quotation not found');
    }
});

// @desc    Send quotation email with PDF attachment
// @route   POST /api/quotations/:id/send-email
// @access  Private
const sendQuotationEmail = asyncHandler(async (req, res) => {
    const { email, subject, message, pdfBase64, filename } = req.body;

    if (!email || !subject || !message || !pdfBase64) {
        res.status(400);
        throw new Error('Email, subject, message, and PDF attachment are required');
    }

    const quotation = await Quotation.findOne({ _id: req.params.id, tenantId: req.user.tenantId }).populate('user', 'name email');

    if (!quotation) {
        res.status(404);
        throw new Error('Quotation not found');
    }

    if (req.user.role !== 'SuperAdmin' &&
        (!quotation.user || (typeof quotation.user === 'object' ? quotation.user._id.toString() !== req.user._id.toString() : quotation.user.toString() !== req.user._id.toString()))) {
        res.status(401);
        throw new Error('Not authorized to send this quotation');
    }

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    await sendEmail({
        email,
        subject,
        message,
        replyTo: req.user?.email,
        attachments: [
            {
                filename: filename || `${quotation.quoteNumber}.pdf`,
                content: pdfBuffer,
            },
        ],
    });

    quotation.status = 'sent';
    quotation.emailSentAt = new Date();
    await quotation.save();

    res.json({ message: 'Email sent successfully' });
});

module.exports = { createQuotation, getQuotations, getQuotationById, updateQuotation, deleteQuotation, getDashboardStats, sendQuotationEmail };
