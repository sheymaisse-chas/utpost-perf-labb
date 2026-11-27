import { Router } from 'express';
import { pool } from '../db/client.js';
import { requireUser, requireRole } from '../lib/auth.js';
import { wrap } from '../lib/wrap.js';

export const usersRouter = Router();

// Användarlistan till redaktionens admin-sida.
// M8 (A01, hålsjakten H5): "admin-sidan kommer i nästa sprint" – men routen fanns redan, öppen för
// alla: varje användares e-post och roll till vem som helst som frågade. Att sidan inte finns i
// klienten gör inte routen hemlig. Nu: inloggad (401) och rollen editor (403).
usersRouter.get(
  '/',
  requireUser,
  requireRole('editor'),
  wrap(async (req, res) => {
    const result = await pool.query('select id, email, display_name, role from users order by id');
    res.json(result.rows);
  }),
);
