"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const connection_1 = require("../db/connection");
const router = (0, express_1.Router)();
// Get user profile
router.get('/profile', async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { data, error } = await connection_1.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error)
            throw error;
        res.json(data);
    }
    catch (err) {
        next(err);
    }
});
// Update user profile
router.put('/profile', async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { semester_start, semester_end, onboarding_completed } = req.body;
        const updateData = {};
        if (semester_start !== undefined)
            updateData.semester_start = semester_start;
        if (semester_end !== undefined)
            updateData.semester_end = semester_end;
        if (onboarding_completed !== undefined)
            updateData.onboarding_completed = onboarding_completed;
        const { data, error } = await connection_1.supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userId)
            .select()
            .single();
        if (error)
            throw error;
        res.json(data);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
