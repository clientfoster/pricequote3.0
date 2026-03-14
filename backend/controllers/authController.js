const asyncHandler = require('express-async-handler');
const generateToken = require('../utils/generateToken');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const getTenantName = async (tenantId) => {
    if (!tenantId) return undefined;
    const tenant = await Tenant.findById(tenantId);
    return tenant?.name;
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });

    if (user && (await user.matchPassword(password))) {
        const tenantName = await getTenantName(user.tenantId);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            tenantId: user.tenantId,
            tenantName,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Accept invitation & set password
// @route   POST /api/auth/accept-invite
// @access  Public
const acceptInvite = asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    const user = await User.findOne({
        invitationToken: token,
        invitationExpires: { $gt: Date.now() },
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired invitation token');
    }

    user.password = password;
    user.invitationToken = undefined;
    user.invitationExpires = undefined;
    user.isVerified = true;

    await user.save();
    const tenantName = await getTenantName(user.tenantId);

    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenantName,
        token: generateToken(user._id),
    });
});

// @desc    Setup initial Super Admin
// @route   POST /api/auth/setup
// @access  Public
const setupSuperAdmin = asyncHandler(async (req, res) => {
    const { name, email, password, companyName } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const tenant = await Tenant.create({
        name: companyName || `${name}'s Company`,
    });

    const user = await User.create({
        tenantId: tenant._id,
        name,
        email: normalizedEmail,
        password,
        role: 'SuperAdmin',
        isVerified: true, // Auto verify since they are setting it up
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            tenantId: user.tenantId,
            tenantName: tenant.name,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const requestPasswordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail }).lean();
    if (!user) {
        return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpires = Date.now() + 1000 * 60 * 30; // 30 minutes

    // Use updateOne to avoid validation failures for legacy users missing tenantId
    await User.updateOne(
        { _id: user._id },
        { $set: { resetPasswordToken: hashedResetToken, resetPasswordExpires } },
        { runValidators: false }
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `
        <div style="font-family:Arial, sans-serif; line-height:1.5;">
            <p>Hi ${user.name || 'there'},</p>
            <p>We received a request to reset your password.</p>
            <p><a href="${resetUrl}">Click here to reset your password</a></p>
            <p>This link will expire in 30 minutes.</p>
            <p>If you didn't request this, you can ignore this email.</p>
        </div>
    `;

    await sendEmail({
        email: user.email,
        subject: 'Reset your password',
        message,
    });

    res.json({ message: 'If that email exists, a reset link has been sent.' });
});

// @desc    Reset password with token
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Update directly to avoid validation failures
    await User.updateOne(
        { _id: user._id },
        {
            $set: { password: hashedPassword, isVerified: true },
            $unset: { resetPasswordToken: '', resetPasswordExpires: '' },
        }
    );

    res.json({ message: 'Password reset successful. Please login.' });
});

module.exports = { authUser, acceptInvite, setupSuperAdmin, requestPasswordReset, resetPassword };
