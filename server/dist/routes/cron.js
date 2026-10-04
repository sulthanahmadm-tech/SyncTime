"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cronJobs_1 = require("../services/cronJobs");
const router = (0, express_1.Router)();
router.get('/trigger', async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        return res.status(500).json({ error: 'CRON_SECRET is not configured on the server' });
    }
    // Expecting "Bearer <CRON_SECRET>"
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized cron trigger' });
    }
    try {
        await (0, cronJobs_1.checkAndSendReminders)();
        res.status(200).json({ success: true, message: 'Cron job executed successfully' });
    }
    catch (err) {
        console.error('Failed to execute manual cron:', err);
        res.status(500).json({ error: 'Internal server error during cron execution' });
    }
});
exports.default = router;
