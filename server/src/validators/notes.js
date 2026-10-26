// server/src/validators/notes.js
const { z } = require('zod');

const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).trim(),
  content: z.string().min(1, 'Content is required').max(10000),
  category: z.string().max(50).optional().default('General'),
  isPinned: z.boolean().optional().default(false),
});

const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  content: z.string().min(1).max(10000).optional(),
  category: z.string().max(50).optional(),
  isPinned: z.boolean().optional(),
});

module.exports = { createNoteSchema, updateNoteSchema };