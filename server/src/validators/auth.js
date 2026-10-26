// server/src/validators/auth.js
const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email('Invalid email format').max(255).transform(e => e.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format').transform(e => e.toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };