import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const SystemAppsManager = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    label: '',
    sub: '',
    url: '',
    category: 'academics',
    color: '#002280',
    bg: '#eef1fb',
    badge: '',
    is_active: true,
  });

  const CATEGORIES = [
    { key: 'academics', label: 'Academics' },
    { key: 'admin', label: 'Admin' },
    { key: 'finance', label: 'Finance' },
    { key: 'health', label: 'Health' },
    { key: 'library', label: 'Library' },
    { key: 'schedule', label: 'Schedule' },
    { key: 'reports', label: 'Reports' },
    { key: 'more', label: 'More' },
  ];

  const COLOR_PRESETS = [
    { color: '#002280', bg: '#eef1fb', label: 'Blue' },
    { color: '#C8102E', bg: '#fdf0f2', label: 'Red' },
    { color: '#C8960C', bg: '#fdf8ec', label: 'Gold' },
    { color: '#10813f', bg: '#edf7f1', label: 'Green' },
    { color: '#7c3aed', bg: '#f5f0ff', label: 'Purple' },
    { color: '#0891b2', bg: '#ecf8fb', label: 'Cyan' },
    { color: '#e11d48', bg: '#fff0f3', label: 'Rose' },
    { color: '#374151', bg: '#f3f4f6', label: 'Gray' },
  ];

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApps(data || []);
    } catch (error) {
      console.error('Error fetching apps:', error);
      alert('Failed to load system applications. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (app = null) => {
    if (app) {
      setEditingApp(app);
      setFormData({
        id: app.id || '',
        label: app.label || '',
        sub: app.sub || '',
        url: app.url || '',
        category: app.category || 'academics',
        color: app.color || '#002280',
        bg: app.bg || '#eef1fb',
        badge: app.badge || '',
        is_active: app.is_active !== false,
      });
    } else {
      setEditingApp(null);
      setFormData({
        id: '',
        label: '',
        sub: '',
        url: '',
        category: 'academics',
        color: '#002280',
        bg: '#eef1fb',
        badge: '',
        is_active: true,
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingApp(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.id || !formData.label || !formData.url) {
      alert('Please fill in all required fields (ID, Label, URL)');
      return;
    }

    try {
      if (editingApp) {
        // Update existing app
        const { error } = await supabase
          .from('system_applications')
          .update({
            label: formData.label,
            sub: formData.sub,
            url: formData.url,
            category: formData.category,
            color: formData.color,
            bg: formData.bg,
            badge: formData.badge || null,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingApp.id);

        if (error) throw error;
        alert('System application updated successfully!');
      } else {
        // Create new app
        const { error } = await supabase
          .from('system_applications')
          .insert({
            id: formData.id,
            label: formData.label,
            sub: formData.sub,
            url: formData.url,
            category: formData.category,
            color: formData.color,
            bg: formData.bg,
            badge: formData.badge || null,
            is_active: formData.is_active,
          });

        if (error) {
          if (error.code === '23505') {
            alert('System ID already exists. Please use a unique ID.');
            return;
          }
          throw error;
        }
        alert('System application added successfully!');
      }

      closeModal();
      fetchApps();
    } catch (error) {
      console.error('Error saving app:', error);
      alert('Failed to save system application. Check console for details.');
    }
  };

  const handleDelete = async (app) => {
    if (!confirm(`Are you sure you want to delete "${app.label}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('system_applications')
        .delete()
        .eq('id', app.id);

      if (error) throw error;
      alert('System application deleted successfully!');
      fetchApps();
    } catch (error) {
      console.error('Error deleting app:', error);
      alert('Failed to delete system application. Check console for details.');
    }
  };

  const toggleActive = async (app) => {
    try {
      const { error } = await supabase
        .from('system_applications')
        .update({ is_active: !app.is_active })
        .eq('id', app.id);

      if (error) throw error;
      fetchApps();
    } catch (error) {
      console.error('Error toggling active status:', error);
      alert('Failed to update status. Check console for details.');
    }
  };

  const applyColorPreset = (preset) => {
    setFormData({ ...formData, color: preset.color, bg: preset.bg });
  };

  return (
    <div className="db-panel" style={{ marginTop: 24 }}>
      <div className="db-panel-header">
        <div className="db-panel-header-left">
          <div className="db-panel-icon" style={{ background: '#f5f0ff', color: '#7c3aed' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8M12 17v4M7 8h10M7 12h6"/>
            </svg>
          </div>
          <div>
            <h3 className="db-panel-title">System Applications Manager</h3>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 4 }}>
              Add, edit, and manage system applications displayed on the portal
            </p>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          style={{
            background: '#7c3aed',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}>
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Application
        </button>
      </div>

      {loading ? (
        <div className="db-empty-state">
          <p>Loading applications...</p>
        </div>
      ) : apps.length === 0 ? (
        <div className="db-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, color: '#9ca3af' }}>
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <path d="M8 21h8M12 17v4"/>
          </svg>
          <p>No system applications yet</p>
          <span>Click "Add Application" to create your first system app</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, padding: '16px 0' }}>
          {apps.map((app) => (
            <div
              key={app.id}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 16,
                position: 'relative',
                opacity: app.is_active ? 1 : 0.6,
              }}
            >
              {/* Status Badge */}
              <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
                {app.badge && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      background: '#FFD700',
                      color: '#002280',
                      padding: '2px 8px',
                      borderRadius: 4,
                      letterSpacing: '0.5px',
                    }}
                  >
                    {app.badge}
                  </span>
                )}
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    background: app.is_active ? '#edf7f1' : '#fef2f2',
                    color: app.is_active ? '#10813f' : '#991b1b',
                    padding: '2px 8px',
                    borderRadius: 4,
                    letterSpacing: '0.5px',
                  }}
                >
                  {app.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Icon */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: app.bg,
                  color: app.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 28, height: 28 }}>
                  <rect x="2" y="3" width="20" height="14" rx="2"/>
                  <path d="M8 21h8M12 17v4M7 8h10M7 12h6"/>
                </svg>
              </div>

              {/* Content */}
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F1422', marginBottom: 4 }}>
                {app.label}
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 8 }}>
                {app.sub || 'No description'}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: 12 }}>
                {app.url}
              </p>

              {/* Meta */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  ID: {app.id}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: app.bg,
                    color: app.color,
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  {CATEGORIES.find(c => c.key === app.category)?.label || app.category}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => toggleActive(app)}
                  style={{
                    flex: 1,
                    background: app.is_active ? '#fef2f2' : '#edf7f1',
                    color: app.is_active ? '#991b1b' : '#10813f',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {app.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => openModal(app)}
                  style={{
                    flex: 1,
                    background: '#eef1fb',
                    color: '#002280',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(app)}
                  style={{
                    background: '#fef2f2',
                    color: '#991b1b',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 20,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 600,
              maxHeight: '90vh',
              overflow: 'auto',
              padding: 32,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F1422', marginBottom: 8 }}>
              {editingApp ? 'Edit System Application' : 'Add New System Application'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 24 }}>
              Fill in the details below to {editingApp ? 'update' : 'create'} a system application
            </p>

            <form onSubmit={handleSubmit}>
              {/* System ID */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  System ID <span style={{ color: '#C8102E' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="e.g., csc, osas, admission"
                  disabled={!!editingApp}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    background: editingApp ? '#f9fafb' : '#fff',
                  }}
                />
                <small style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4, display: 'block' }}>
                  Unique identifier (lowercase, no spaces). Cannot be changed after creation.
                </small>
              </div>

              {/* Label */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  Application Label <span style={{ color: '#C8102E' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g., CSC Services"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  Description
                </label>
                <input
                  type="text"
                  value={formData.sub}
                  onChange={(e) => setFormData({ ...formData, sub: e.target.value })}
                  placeholder="e.g., Fines Management System"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              {/* URL */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  Application URL <span style={{ color: '#C8102E' }}>*</span>
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              {/* Category */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    background: '#fff',
                  }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color Scheme */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: 10 }}>
                  Color Scheme
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyColorPreset(preset)}
                      style={{
                        background: preset.bg,
                        border: formData.color === preset.color ? `2px solid ${preset.color}` : '2px solid transparent',
                        borderRadius: 8,
                        padding: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: preset.color,
                        }}
                      />
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: preset.color }}>
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>
                      Primary Color
                    </label>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      style={{ width: '100%', height: 40, border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>
                      Background Color
                    </label>
                    <input
                      type="color"
                      value={formData.bg}
                      onChange={(e) => setFormData({ ...formData, bg: e.target.value })}
                      style={{ width: '100%', height: 40, border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>

              {/* Badge */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  Badge (Optional)
                </label>
                <input
                  type="text"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  placeholder="e.g., New, Beta, Updated"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                  }}
                />
                <small style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4, display: 'block' }}>
                  Leave empty for no badge
                </small>
              </div>

              {/* Active Status */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#374151' }}>
                    Active (Show on portal)
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 24px',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#7c3aed',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 24px',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {editingApp ? 'Update Application' : 'Add Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemAppsManager;
