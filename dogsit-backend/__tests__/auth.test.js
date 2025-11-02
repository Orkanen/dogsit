// __tests__/auth.test.js
const { authenticateToken } = require('../middleware/auth');
const express = require('express');

test('authenticateToken returns 401 when no token', () => {
  const app = express();
  app.use(authenticateToken);
  app.get('/', (req, res) => res.json({ ok: true }));

  const req = { headers: {} };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const next = jest.fn();

  authenticateToken(req, res, next);

  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({ error: 'Access token required' });
});