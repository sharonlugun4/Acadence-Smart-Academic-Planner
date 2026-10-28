import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const [taskRows] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         COALESCE(SUM(status = 'Completed'), 0) AS completed,
         COALESCE(SUM(status = 'Pending'), 0) AS pending,
         COALESCE(SUM(status = 'In Progress'), 0) AS in_progress,
         COALESCE(
           SUM(status <> 'Completed' AND due_date < NOW()), 0
         ) AS overdue,
         COALESCE(
           SUM(
             status <> 'Completed'
             AND due_date >= NOW()
             AND due_date < DATE_ADD(NOW(), INTERVAL 7 DAY)
           ), 0
         ) AS due_soon
       FROM tasks
       WHERE user_id = ?`,
      [req.user.id]
    );

    // Study time since the beginning of the current week (Monday).
    const [weekRows] = await pool.execute(
      `SELECT COALESCE(SUM(duration_minutes), 0) AS minutes
       FROM study_sessions
       WHERE user_id = ?
         AND completed_at >=
           DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)`,
      [req.user.id]
    );

    // Actual study time for each date in the last seven days.
    const [dailyRows] = await pool.execute(
      `SELECT
         DATE(completed_at) AS day,
         COALESCE(SUM(duration_minutes), 0) AS minutes
       FROM study_sessions
       WHERE user_id = ?
         AND completed_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
         AND completed_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
       GROUP BY DATE(completed_at)
       ORDER BY day`,
      [req.user.id]
    );

    const stats = taskRows[0];
    const total = Number(stats.total || 0);
    const completed = Number(stats.completed || 0);

    res.json({
      total,
      completed,
      pending: Number(stats.pending || 0),
      inProgress: Number(stats.in_progress || 0),
      overdue: Number(stats.overdue || 0),
      dueSoon: Number(stats.due_soon || 0),

      completionRate: total
        ? Math.round((completed / total) * 100)
        : 0,

      weeklyMinutes: Number(weekRows[0].minutes || 0),

      dailyStudy: dailyRows.map(row => ({
        day: row.day,
        minutes: Number(row.minutes || 0)
      }))
    });
  } catch (error) {
    next(error);
  }
});

export default router;