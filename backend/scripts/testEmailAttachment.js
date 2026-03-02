require('dotenv').config();
const sendEmail = require('../utils/sendEmail');

const testEmail = async () => {
    console.log('Attempting to send test email WITH ATTACHMENT...');
    const pdfUrl = 'https://res.cloudinary.com/dv2sgw13u/image/upload/v1737402660/quotemaster-pro/QT-2025-502.pdf.pdf'; // Valid test URL from previous logs if available, or use a generic one. 
    // Actually, I'll use a known public image URL for testing attachment fetching if PDF is risky.
    const testUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

    try {
        await sendEmail({
            email: process.env.EMAIL_USER,
            subject: 'Test Email WITH ATTACHMENT',
            message: '<h1>Attachment Test</h1><p>Checking if URL attachment works.</p>',
            attachments: [
                {
                    filename: 'test-attachment.pdf',
                    path: testUrl
                }
            ]
        });
        console.log('✅ Email with attachment sent successfully!');
    } catch (error) {
        console.error('❌ Failed to send email:', error);
    }
};

testEmail();
