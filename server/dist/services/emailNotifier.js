"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailNotification = void 0;
const resend_1 = require("resend");
let resend = null;
let initialized = false;
function getResend() {
    if (!initialized) {
        const apiKey = process.env.RESEND_API_KEY;
        if (apiKey && apiKey !== 'your_resend_api_key') {
            resend = new resend_1.Resend(apiKey);
        }
        initialized = true;
    }
    return resend;
}
const sendEmailNotification = async (to, subject, htmlBody) => {
    const client = getResend();
    const emailFrom = process.env.EMAIL_FROM || 'SyncTime <onboarding@resend.dev>';
    if (!client) {
        console.log(`[Email Mock] To: ${to} | Subject: ${subject}`);
        console.log(`[Email Mock] Body: ${htmlBody}`);
        return;
    }
    try {
        await client.emails.send({
            from: emailFrom,
            to,
            subject,
            html: htmlBody,
        });
        console.log(`[Email] Sent to ${to}: ${subject}`);
    }
    catch (error) {
        console.error(`[Email Error] Failed to send to ${to}:`, error);
    }
};
exports.sendEmailNotification = sendEmailNotification;
