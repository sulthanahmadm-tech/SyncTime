"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailReminder = void 0;
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
const sendEmailReminder = async (to, subject, message) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'SyncTime <onboarding@resend.dev>', // Resend's default test email, assuming users haven't verified a domain yet
            to,
            subject,
            text: message,
        });
        if (error) {
            console.error('Error sending email:', error);
            return { success: false, error };
        }
        console.log('Email sent successfully:', data);
        return { success: true, data };
    }
    catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error };
    }
};
exports.sendEmailReminder = sendEmailReminder;
