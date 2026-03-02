const asyncHandler = require('express-async-handler');
const Client = require('../models/Client');

// @desc    Create new client
// @route   POST /api/clients
// @access  Private
const createClient = asyncHandler(async (req, res) => {
    const { name, companyName, email, contactNumber, address, gstin } = req.body;

    const client = new Client({
        user: req.user._id,
        name,
        companyName,
        email,
        contactNumber,
        address,
        gstin,
    });

    const createdClient = await client.save();
    res.status(201).json(createdClient);
});

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
const getClients = asyncHandler(async (req, res) => {
    const clients = await Client.find({});
    res.json(clients);
});

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
const updateClient = asyncHandler(async (req, res) => {
    const { name, companyName, email, contactNumber, address, gstin } = req.body;

    const client = await Client.findById(req.params.id);

    if (client) {
        client.name = name || client.name;
        client.companyName = companyName || client.companyName;
        client.email = email || client.email;
        client.contactNumber = contactNumber || client.contactNumber;
        client.address = address || client.address;
        client.gstin = gstin || client.gstin;

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
    const client = await Client.findById(req.params.id);

    if (client) {
        await client.deleteOne();
        res.json({ message: 'Client removed' });
    } else {
        res.status(404);
        throw new Error('Client not found');
    }
});

module.exports = { createClient, getClients, updateClient, deleteClient };
