// client/src/components/NotesDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { notesAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';

export default function NotesDashboard() {
  const { user, logout } = useAuth();
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', category: 'General' });
  const [error, setError] = useState('');
  const [darkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Bump refreshKey to re-fetch notes after a change
  const fetchNotes = () => setRefreshKey((k) => k + 1);

  // Fetch notes
  useEffect(() => {
    let ignore = false;
    const params = {};
    if (selectedCategory) params.category = selectedCategory;
    if (searchQuery) params.search = searchQuery;

    notesAPI.getAll(params)
      .then((res) => {
        if (ignore) return;
        setNotes(res.data.notes);
        setCategories(res.data.categories);
      })
      .catch(() => {
        if (!ignore) setError('Failed to load notes');
      });

    // Drop responses from stale searches
    return () => { ignore = true; };
  }, [selectedCategory, searchQuery, refreshKey]);

  // Create or update note
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingNote) {
        await notesAPI.update(editingNote.id, formData);
      } else {
        await notesAPI.create(formData);
      }
      setFormData({ title: '', content: '', category: 'General' });
      setShowForm(false);
      setEditingNote(null);
      fetchNotes();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save note');
    }
  };

  // Delete note
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await notesAPI.delete(id);
      fetchNotes();
    } catch {
      setError('Failed to delete note');
    }
  };

  // Toggle pin
  const handleTogglePin = async (id) => {
    try {
      await notesAPI.togglePin(id);
      fetchNotes();
    } catch {
      setError('Failed to toggle pin');
    }
  };

  // Edit note
  const handleEdit = (note) => {
    setFormData({ title: note.title, content: note.content, category: note.category });
    setEditingNote(note);
    setShowForm(true);
  };

  // Cancel editing
  const handleCancel = () => {
    setFormData({ title: '', content: '', category: 'General' });
    setEditingNote(null);
    setShowForm(false);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>My Notes</h1>
        <div className="user-info">
          <span>Welcome, {user.name}</span>
          <button onClick={logout} className="logout-button">Log Out</button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      {/* Search and Filter Bar */}
      <div className="toolbar">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-select"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button onClick={() => setShowForm(true)} className="new-note-button">
          + New Note
        </button>
      </div>

      {/* Note Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="note-form">
          <h2>{editingNote ? 'Edit Note' : 'New Note'}</h2>
          <input
            type="text"
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Write your note here..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={6}
            required
          />
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <option value="General">General</option>
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
            <option value="Ideas">Ideas</option>
            <option value="School">School</option>
          </select>
          <div className="form-actions">
            <button type="submit">{editingNote ? 'Update' : 'Create'}</button>
            <button type="button" onClick={handleCancel} className="cancel-button">Cancel</button>
          </div>
        </form>
      )}

      {/* Notes List */}
      <div className="notes-grid">
        {notes.length === 0 ? (
          <p className="empty-state">
            {searchQuery || selectedCategory
              ? 'No notes match your search.'
              : 'No notes yet. Create your first note!'}
          </p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className={`note-card ${note.isPinned ? 'pinned' : ''}`}>
              <div className="note-header">
                <h3>{note.title}</h3>
                <button
                  onClick={() => handleTogglePin(note.id)}
                  className={`pin-button ${note.isPinned ? 'active' : ''}`}
                  title={note.isPinned ? 'Unpin' : 'Pin'}
                >
                  {note.isPinned ? '[Pinned]' : '[Pin]'}
                </button>
              </div>
              <p className="note-content">{note.content}</p>
              <div className="note-footer">
                <span className="note-category">{note.category}</span>
                <span className="note-date">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="note-actions">
                <button onClick={() => handleEdit(note)}>Edit</button>
                <button onClick={() => handleDelete(note.id)} className="delete-button">
                  Delete
                </button>
              </div>
              <div className="note-content">
                <ReactMarkdown>{note.content}</ReactMarkdown>
              </div>
            </div>
          ))
        )}   
      </div>
    </div>
  );
}