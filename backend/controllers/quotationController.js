const asyncHandler = require('express-async-handler');
const Quotation = require('../models/Quotation');
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

    const quotation = new Quotation({
        user: req.user._id,
        quoteNumber,
        issuerCompanyName,
        issuerTaxIdType,
        issuerTaxIdValue,
        issuerLogoUrl,
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

    const createdQuotation = await quotation.save();

    // Auto-Add Client if not exists
    try {
        const Client = require('../models/Client');
        // Find by email if exists, otherwise by fuzzy name/company match? 
        // Safer to just use email if present, or strict name + company match.
        let clientQuery = {};
        if (email) {
            clientQuery = { email };
        } else {
            clientQuery = { name: clientName, companyName: companyName };
        }

        const existingClient = await Client.findOne(clientQuery);

        if (!existingClient) {
            await Client.create({
                user: req.user._id, // Assign to current user? Or is Client global? Check Client model.
                name: clientName,
                companyName: companyName,
                email: email,
                contactNumber: contactNumber,
                address: clientAddress,
                country: country,
                taxIdName: taxIdName,
                taxIdValue: taxIdValue,
                gstin: taxIdValue,
                // address? gstin? Not in quotation body usually.
            });
            console.log(`Auto-added new client: ${clientName}`);
        }
    } catch (err) {
        console.error('Failed to auto-add client:', err);
        // Do not fail the request
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
                    message: emailMessage
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
    let query = {};
    if (req.user.role !== 'SuperAdmin') {
        query = { user: req.user._id };
    }
    const quotations = await Quotation.find(query).populate('user', 'name email').sort({ createdAt: -1 });
    res.json(quotations);
});

// @desc    Get quotation by ID
// @route   GET /api/quotations/:id
// @access  Private
const getQuotationById = asyncHandler(async (req, res) => {
    const quotation = await Quotation.findById(req.params.id).populate('user', 'name email');

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
        clientName,
        companyName,
        contactNumber,
        email,
        issuerCompanyName,
        issuerTaxIdType,
        issuerTaxIdValue,
        issuerLogoUrl,
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
        gst,
        gstRate,
        totalPayable,
        status
    } = req.body;

    const quotation = await Quotation.findById(req.params.id);

    if (quotation) {
        quotation.clientName = clientName;
        quotation.companyName = companyName;
        quotation.contactNumber = contactNumber;
        quotation.email = email;
        if (typeof issuerCompanyName === 'string') quotation.issuerCompanyName = issuerCompanyName;
        if (typeof issuerTaxIdType === 'string') quotation.issuerTaxIdType = issuerTaxIdType;
        if (typeof issuerTaxIdValue === 'string') quotation.issuerTaxIdValue = issuerTaxIdValue;
        if (typeof issuerLogoUrl === 'string') quotation.issuerLogoUrl = issuerLogoUrl;
        if (typeof clientReferenceNo === 'string') quotation.clientReferenceNo = clientReferenceNo;
        if (typeof clientAddress === 'string') quotation.clientAddress = clientAddress;
        if (typeof clientLogoUrl === 'string') quotation.clientLogoUrl = clientLogoUrl;
        if (typeof country === 'string') quotation.country = country;
        if (typeof taxIdName === 'string') quotation.taxIdName = taxIdName;
        if (typeof taxIdValue === 'string') quotation.taxIdValue = taxIdValue;
        quotation.quoteDate = quoteDate;
        quotation.validUntil = validUntil;
        quotation.lineItems = lineItems;
        quotation.subtotal = subtotal;
        quotation.gst = gst;
        quotation.gstRate = gstRate;
        if (typeof req.body.tax === 'number') quotation.tax = req.body.tax;
        if (typeof req.body.taxRate === 'number') quotation.taxRate = req.body.taxRate;
        quotation.totalPayable = totalPayable;
        if (req.body.currency) quotation.currency = req.body.currency;
        if (typeof req.body.exchangeRate === 'number') quotation.exchangeRate = req.body.exchangeRate;
        quotation.status = status;
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
                    attachments: [
                        {
                            filename: `${quotation.quoteNumber}.pdf`,
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
                        message: emailMessage
                        // No attachments
                    });
                    console.log(`Email (fallback) sent successfully to ${email}`);
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
    let query = {};
    if (req.user.role !== 'SuperAdmin') {
        query = { user: req.user._id };
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
    const quotation = await Quotation.findById(req.params.id);

    if (quotation) {
        await quotation.deleteOne();
        res.json({ message: 'Quotation removed' });
    } else {
        res.status(404);
        throw new Error('Quotation not found');
    }
});

module.exports = { createQuotation, getQuotations, getQuotationById, updateQuotation, deleteQuotation, getDashboardStats };
