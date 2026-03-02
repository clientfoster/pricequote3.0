const asyncHandler = require('express-async-handler');
const generateToken = require('../utils/generateToken');
const User = require('../models/User');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
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

    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
    });
});

// @desc    Setup initial Super Admin
// @route   POST /api/auth/setup
// @access  Public
const setupSuperAdmin = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Check if any SuperAdmin exists
    const adminExists = await User.findOne({ role: 'SuperAdmin' });

    if (adminExists) {
        res.status(400);
        throw new Error('Super Admin already exists. Please login.');
    }

    const user = await User.create({
        name,
        email,
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
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

module.exports = { authUser, acceptInvite, setupSuperAdmin };
