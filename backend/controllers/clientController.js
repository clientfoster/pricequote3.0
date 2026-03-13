const asyncHandler = require('express-async-handler');
const Client = require('../models/Client');
const Quotation = require('../models/Quotation');

const clean = (value) => (typeof value === 'string' ? value.trim() : value);

// @desc    Create new client
// @route   POST /api/clients
// @access  Private
const createClient = asyncHandler(async (req, res) => {
    const {
        name,
        companyName,
        email,
        contactNumber,
        address,
        country,
        taxIdName,
        taxIdValue,
        gstin,
    } = req.body;
    const normalizedTaxIdValue = clean(taxIdValue) || clean(gstin) || '';

    const client = new Client({
        tenantId: req.user.tenantId,
        user: req.user._id,
        name,
        companyName,
        email,
        contactNumber,
        address,
        country: clean(country),
        taxIdName: clean(taxIdName),
        taxIdValue: normalizedTaxIdValue,
        gstin: normalizedTaxIdValue,
    });

    const createdClient = await client.save();
    res.status(201).json(createdClient);
});

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
const getClients = asyncHandler(async (req, res) => {
    const { search } = req.query;
    let query = { tenantId: req.user.tenantId };

    if (typeof search === 'string' && search.trim().length > 0) {
        const regex = new RegExp(search.trim(), 'i');
        query = {
            tenantId: req.user.tenantId,
            $or: [{ name: regex }, { companyName: regex }, { email: regex }],
        };
    }

    const clients = await Client.find(query).sort({ createdAt: -1 });
    res.json(clients);
});

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
const updateClient = asyncHandler(async (req, res) => {
    const {
        name,
        companyName,
        email,
        contactNumber,
        address,
        country,
        taxIdName,
        taxIdValue,
        gstin,
    } = req.body;

    const client = await Client.findOne({ _id: req.params.id, tenantId: req.user.tenantId });

    if (client) {
        client.name = name || client.name;
        client.companyName = companyName || client.companyName;
        client.email = email || client.email;
        client.contactNumber = contactNumber || client.contactNumber;
        client.address = address || client.address;
        client.country = clean(country) || client.country;
        client.taxIdName = clean(taxIdName) || client.taxIdName;
        const normalizedTaxIdValue = clean(taxIdValue) || clean(gstin);
        if (typeof normalizedTaxIdValue === 'string' && normalizedTaxIdValue.length > 0) {
            client.taxIdValue = normalizedTaxIdValue;
            client.gstin = normalizedTaxIdValue;
        }

        const updatedClient = await client.save();
        res.json(updatedClient);
    } else {
        res.status(404);
        throw new Error('Client not found');
    }
});

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private
const deleteClient = asyncHandler(async (req, res) => {
    const client = await Client.findOne({ _id: req.params.id, tenantId: req.user.tenantId });

    if (client) {
        await client.deleteOne();
        res.json({ message: 'Client removed' });
    } else {
        res.status(404);
        throw new Error('Client not found');
    }
});

// @desc    Get client stats and history
// @route   GET /api/clients/:id/stats
// @access  Private
const getClientStats = asyncHandler(async (req, res) => {
    const client = await Client.findOne({ _id: req.params.id, tenantId: req.user.tenantId });

    if (!client) {
        res.status(404);
        throw new Error('Client not found');
    }

    const match = {
        tenantId: req.user.tenantId,
        $or: [
            { clientId: client._id },
            client.email ? { email: client.email } : null,
            client.name && client.companyName ? { clientName: client.name, companyName: client.companyName } : null,
        ].filter(Boolean),
    };

    const quotations = await Quotation.find(match).sort({ quoteDate: -1 });
    const totalQuotations = quotations.length;
    const totalRevenue = quotations
        .filter((q) => q.status === 'accepted')
        .reduce((sum, q) => sum + q.totalPayable, 0);
    const lastQuotationDate = quotations.length > 0 ? quotations[0].quoteDate : null;

    res.json({
        totalQuotations,
        totalRevenue,
        lastQuotationDate,
    });
});

module.exports = { createClient, getClients, updateClient, deleteClient, getClientStats };
