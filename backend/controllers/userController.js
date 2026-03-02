const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const generateToken = require('../utils/generateToken');

// @desc    Invite a new user
// @route   POST /api/users/invite
// @access  Private/SuperAdmin
const inviteUser = asyncHandler(async (req, res) => {
    const { name, email, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Generate invite token
    const invitationToken = crypto.randomBytes(20).toString('hex');
    const invitationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const user = await User.create({
        name,
        email,
        role: role || 'Employee',
        invitationToken,
        invitationExpires,
    });

    if (user) {
        // Send email
        const inviteUrl = `${process.env.FRONTEND_URL}/setup-password/${invitationToken}`;
        const message = `
            <h1>You have been invited to join QuoteMaster Pro</h1>
            <p>Please click the link below to set up your password and access the account:</p>
            <a href="${inviteUrl}">${inviteUrl}</a>
            <p>This link expires in 24 hours.</p>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'QuoteMaster Pro Invitation',
                message,
            });

            res.status(201).json({
                message: `Invitation sent to ${user.email}`,
            });
        } catch (error) {
            user.invitationToken = undefined;
            user.invitationExpires = undefined;
            await user.save();
            res.status(500);
            throw new Error('Email could not be sent');
        }
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/SuperAdmin
const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({});
    res.json(users);
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/SuperAdmin
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        if (user.role === 'SuperAdmin') {
            res.status(400);
            throw new Error('Cannot delete a Super Admin');
        }
        await user.deleteOne();
        res.json({ message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        if (req.body.password) {
            user.password = req.body.password;
        }
        // Handle profile image upload separately or as part of body if using cloud url
        // For local storage, req.file would be used
        if (req.body.profileImage) {
            user.profileImage = req.body.profileImage;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            profileImage: updatedUser.profileImage,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = { inviteUser, getUsers, deleteUser, updateUserProfile };
