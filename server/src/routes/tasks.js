import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const priorities = ['High', 'Medium', 'Low'];
const categories = ['Assignment', 'Exam', 'Lab Record', 'Revision', 'Other'];
const statuses = ['Pending', 'In Progress', 'Completed'];

function validateTask(body) {
  const title = String(body.title || '').trim();
  const subject = String(body.subject || 'General').trim() || 'General';
  const category = categories.includes(body.category) ? body.category : 'Other';
  const priority = priorities.includes(body.priority) ? body.priority : 'Medium';
  const status = statuses.includes(body.status) ? body.status : 'Pending';
  const dueDate = String(body.due_date || '');
  const parsed = new Date(dueDate);

  if (!title || title.length > 200) return { error: 'Task title is required (maximum 200 characters).' };
  if (!dueDate || Number.isNaN(parsed.getTime())) return { error: 'Please provide a valid due date.' };
  return { value: { title, subject, category, priority, status, dueDate, notes: String(body.notes || '').trim() || null } };
}

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, title, subject, category, due_date, priority, status, notes, created_at
       FROM tasks WHERE user_id = ?
       ORDER BY CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
                CASE WHEN status = 'Completed' THEN 1 ELSE 0 END,
                due_date ASC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const checked = validateTask(req.body);
    if (checked.error) return res.status(400).json({ message: checked.error });
    const t = checked.value;
    const [result] = await pool.execute(
      `INSERT INTO tasks (user_id, title, subject, category, due_date, priority, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, t.title, t.subject, t.category, t.dueDate, t.priority, t.status, t.notes]
    );
    const [rows] = await pool.execute(
      `SELECT id, title, subject, category, due_date, priority, status, notes, created_at
       FROM tasks WHERE id = ? AND user_id = ?`,
      [result.insertId, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: 'Invalid task ID.' });
    const checked = validateTask(req.body);
    if (checked.error) return res.status(400).json({ message: checked.error });
    const t = checked.value;
    const [result] = await pool.execute(
      `UPDATE tasks SET title=?, subject=?, category=?, due_date=?, priority=?, status=?, notes=?
       WHERE id=? AND user_id=?`,
      [t.title, t.subject, t.category, t.dueDate, t.priority, t.status, t.notes, id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Task not found.' });
    const [rows] = await pool.execute(
      `SELECT id, title, subject, category, due_date, priority, status, notes, created_at
       FROM tasks WHERE id=? AND user_id=?`,
      [id, req.user.id]
    );
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const status = req.body.status;
    if (!statuses.includes(status)) return res.status(400).json({ message: 'Invalid task status.' });
    const [result] = await pool.execute(
      'UPDATE tasks SET status=? WHERE id=? AND user_id=?',
      [status, id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Task not found.' });
    res.json({ message: 'Task status updated.' });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM tasks WHERE id=? AND user_id=?',
      [Number(req.params.id), req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Task not found.' });
    res.json({ message: 'Task deleted.' });
  } catch (error) { next(error); }
});

export default router;
