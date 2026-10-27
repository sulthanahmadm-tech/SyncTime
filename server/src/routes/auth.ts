import { Router } from 'express';
import { supabase } from '../db/connection';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// Get user profile
router.get('/profile', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;

    // Auto-heal: If profile was not created by auth trigger, create it now
    if (!data) {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({ id: userId, email: req.user!.email })
        .select()
        .maybeSingle();
      if (insertError) throw insertError;
      data = newProfile;
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Update user profile
router.put('/profile', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { semester_start, semester_end, onboarding_completed } = req.body;
    
    const updateData: any = {};
    if (semester_start !== undefined) updateData.semester_start = semester_start;
    if (semester_end !== undefined) updateData.semester_end = semester_end;
    if (onboarding_completed !== undefined) updateData.onboarding_completed = onboarding_completed;

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
