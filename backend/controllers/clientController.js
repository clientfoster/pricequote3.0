const asyncHandler = require('express-async-handler');
const Client = require('../models/Client');

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
    const clients = await Client.find({ tenantId: req.user.tenantId });
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

module.exports = { createClient, getClients, updateClient, deleteClient };
