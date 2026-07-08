import { useState, useEffect } from 'react';
import keycloak from '../keycloak';

interface Upload {
  id: string;
  filename: string;
  rowCount: number;
  importedAt: string;
}

export default function UploadHistory() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Fetch upload history
  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/api/uploads/history', {
        headers: { Authorization: `Bearer ${keycloak.token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      setUploads(data.uploads);
    } catch (err) {
      setError('Could not load upload history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Handle delete
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`http://localhost:3001/api/uploads/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${keycloak.token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      // Remove from local state
      setUploads(prev => prev.filter(u => u.id !== id));
      setConfirmId(null);
    } catch (err) {
      setError('Failed to delete upload.');
    } finally {
      setDeletingId(null);
    }
  };

  // Format date nicely
  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-NZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
        Loading upload history...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#0A1628', marginBottom: '8px' }}>Upload History</h2>
      <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '24px' }}>
        All your imported CSV files
      </p>

      {error && (
        <div style={{
          backgroundColor: '#FEE2E2',
          border: '1px solid #EF4444',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          color: '#EF4444',
        }}>
          {error}
        </div>
      )}

      {/* Empty state */}
      {uploads.length === 0 && !loading && (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
          <h3 style={{ color: '#0A1628', marginBottom: '8px' }}>No uploads yet</h3>
          <p style={{ color: '#94A3B8' }}>
            Upload a CSV file to see your history here.
          </p>
        </div>
      )}

      {/* Upload list */}
      {uploads.map((upload, index) => (
        <div
          key={upload.id}
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderLeft: index === 0 ? '4px solid #0891B2' : '4px solid #E2E8F0',
          }}
        >
          {/* Upload info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '28px' }}>📄</div>
            <div>
              <div style={{
                fontWeight: '600',
                color: '#0A1628',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                {upload.filename}
                {index === 0 && (
                  <span style={{
                    fontSize: '10px',
                    backgroundColor: '#0891B2',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}>
                    Latest
                  </span>
                )}
              </div>
              <div style={{ fontSize: '13px', color: '#94A3B8' }}>
                {formatDate(upload.importedAt)} · {upload.rowCount} rows imported
              </div>
            </div>
          </div>

          {/* Delete button / confirmation */}
          <div>
            {confirmId === upload.id ? (
              // Confirmation state
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '6px',
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#EF4444',
                  fontWeight: '600',
                }}>
                  Delete {upload.rowCount} records?
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setConfirmId(null)}
                    style={{
                      padding: '4px 12px',
                      backgroundColor: '#F1F5F9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(upload.id)}
                    disabled={deletingId === upload.id}
                    style={{
                      padding: '4px 12px',
                      backgroundColor: '#EF4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    {deletingId === upload.id ? 'Deleting...' : 'Yes, delete'}
                  </button>
                </div>
              </div>
            ) : (
              // Normal delete button
              <button
                onClick={() => setConfirmId(upload.id)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  color: '#94A3B8',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#FEE2E2';
                  (e.target as HTMLButtonElement).style.color = '#EF4444';
                  (e.target as HTMLButtonElement).style.borderColor = '#EF4444';
                }}
                onMouseOut={e => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                  (e.target as HTMLButtonElement).style.color = '#94A3B8';
                  (e.target as HTMLButtonElement).style.borderColor = '#E2E8F0';
                }}
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}