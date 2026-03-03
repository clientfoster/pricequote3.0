const mongoose = require('mongoose');

const tenantSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { timestamps: true }
);

const Tenant = mongoose.model('Tenant', tenantSchema);

module.exports = Tenant;
