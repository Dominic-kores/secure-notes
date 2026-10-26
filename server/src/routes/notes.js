// server/src/routes/notes.js
const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createNoteSchema, updateNoteSchema } = require('../validators/notes');

const router = express.Router();

// Validate :id once for every route that uses it
router.param('id', (req, res, next, id) => {
  const noteId = Number(id);
  if (!Number.isInteger(noteId) || noteId <= 0) {
    return res.status(400).json({ error: 'Invalid note ID' });
  }
  req.noteId = noteId;
  next();
});

// GET /api/notes -- List user's notes with search and filter
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, category, sortBy = 'updatedAt', order = 'desc' } = req.query;

    const where = {
      userId: req.user.userId,
    };

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Search by title or content
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Validate sort field
    const allowedSortFields = ['createdAt', 'updatedAt', 'title'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'updatedAt';

    const notes = await prisma.note.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },  // Pinned notes always first
        { [sortField]: order === 'asc' ? 'asc' : 'desc' },
      ],
    });

    // Get unique categories for the filter dropdown
    const categories = await prisma.note.findMany({
      where: { userId: req.user.userId },
      select: { category: true },
      distinct: ['category'],
    });

    res.json({
      notes,
      total: notes.length,
      categories: categories.map(c => c.category),
    });
  } catch (error) {
    console.error('Fetch notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// POST /api/notes -- Create a note
router.post('/', authenticate, validate(createNoteSchema), async (req, res) => {
  try {
    const { title, content, category, isPinned } = req.body;

    const note = await prisma.note.create({
      data: {
        title,
        content,
        category,
        isPinned,
        userId: req.user.userId,
      },
    });

    res.status(201).json({ note });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// GET /api/notes/:id -- Get a specific note
router.get('/:id', authenticate, async (req, res) => {
  try {
    const note = await prisma.note.findUnique({
      where: { id: req.noteId },
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (note.userId !== req.user.userId) {
      return res.status(403).json({ error: 'You do not have permission to view this note' });
    }

    res.json({ note });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// PUT /api/notes/:id -- Update a note
router.put('/:id', authenticate, validate(updateNoteSchema), async (req, res) => {
  try {
    const note = await prisma.note.findUnique({
      where: { id: req.noteId },
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (note.userId !== req.user.userId) {
      return res.status(403).json({ error: 'You can only edit your own notes' });
    }

    const updatedNote = await prisma.note.update({
      where: { id: req.noteId },
      data: req.body,
    });

    res.json({ note: updatedNote });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// DELETE /api/notes/:id -- Delete a note
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const note = await prisma.note.findUnique({
      where: { id: req.noteId },
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (note.userId !== req.user.userId) {
      return res.status(403).json({ error: 'You can only delete your own notes' });
    }

    await prisma.note.delete({
      where: { id: req.noteId },
    });

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// PATCH /api/notes/:id/pin -- Toggle pin status
router.patch('/:id/pin', authenticate, async (req, res) => {
  try {
    const note = await prisma.note.findUnique({
      where: { id: req.noteId },
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (note.userId !== req.user.userId) {
      return res.status(403).json({ error: 'You can only pin your own notes' });
    }

    const updatedNote = await prisma.note.update({
      where: { id: req.noteId },
      data: { isPinned: !note.isPinned },
    });

    res.json({ note: updatedNote });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle pin' });
  }
});

module.exports = router;