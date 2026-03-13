const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const hasHostConfig = Boolean(process.env.EMAIL_HOST);
    const transporter = nodemailer.createTransport(
        hasHostConfig
            ? {
                host: process.env.EMAIL_HOST,
                port: Number(process.env.EMAIL_PORT || 587),
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            }
            : {
                service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            }
    );

    const mailOptions = {
        from: `"${process.env.EMAIL_USER}" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.message,
        replyTo: options.replyTo,
        attachments: options.attachments // Support attachments
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
