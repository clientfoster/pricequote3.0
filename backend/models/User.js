const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Tenant',
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: false, // Not required initially for invited users
    },
    role: {
        type: String,
        enum: ['SuperAdmin', 'Employee'],
        default: 'Employee',
    },
    profileImage: {
        type: String,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    invitationToken: {
        type: String,
    },
    invitationExpires: {
        type: Date,
    },
}, {
    timestamps: true,
});

userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

userSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

module.exports = User;
