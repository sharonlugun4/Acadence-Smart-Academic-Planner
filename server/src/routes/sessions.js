import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// Get the user's saved study sessions.
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, task_id, duration_minutes, completed_at
       FROM study_sessions
       WHERE user_id = ?
       ORDER BY completed_at DESC
       LIMIT 100`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// Save a completed or stopped study session.
router.post('/', async (req, res, next) => {
  try {
    const minutes = Number(req.body.duration_minutes);
    const taskId = req.body.task_id ? Number(req.body.task_id) : null;

    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) {
      return res.status(400).json({
        message: 'Session duration must be between 1 and 240 minutes.'
      });
    }

    if (taskId !== null) {
      if (!Number.isInteger(taskId) || taskId < 1) {
        return res.status(400).json({
          message: 'Invalid task ID.'
        });
      }

      const [tasks] = await pool.execute(
        'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
        [taskId, req.user.id]
      );

      if (!tasks.length) {
        return res.status(400).json({
          message: 'Selected task was not found.'
        });
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO study_sessions
         (user_id, task_id, duration_minutes)
       VALUES (?, ?, ?)`,
      [req.user.id, taskId, minutes]
    );

    const [savedRows] = await pool.execute(
      `SELECT id, task_id, duration_minutes, completed_at
       FROM study_sessions
       WHERE id = ? AND user_id = ?`,
      [result.insertId, req.user.id]
    );

    res.status(201).json(savedRows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;