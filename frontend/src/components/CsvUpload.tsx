import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import keycloak from '../keycloak';

interface PreviewData {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  previewRows: any[];
  invalidRows: { rowNumber: number; error: string }[];
  validRows: any[];
  filename: string;
}

export default function CsvUpload() {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setPreview(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('http://localhost:3001/api/uploads', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${keycloak.token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      setPreview(data);
    } catch (err) {
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  // ── Handle import
  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);

    try {
      const res = await fetch('http://localhost:3001/api/uploads/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${keycloak.token}`,
        },
        body: JSON.stringify({
          validRows: preview.validRows,
          filename: preview.filename,
        }),
      });

      if (!res.ok) throw new Error('Import failed');
      const result = await res.json();
      setImportResult(result);
      setPreview(null);
    } catch (err) {
      setError('Failed to import data. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  // ── Handle template download
  const handleDownloadTemplate = async () => {
    const res = await fetch('http://localhost:3001/api/template', {
      headers: { Authorization: `Bearer ${keycloak.token}` },
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pulseboard_template.csv';
    a.click();
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <h2>Upload Health Data</h2>

      {/* Download Template Button */}
      <button
        onClick={handleDownloadTemplate}
        style={{
          marginBottom: '16px',
          padding: '8px 16px',
          backgroundColor: '#0891B2',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        Download CSV Template
      </button>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        style={{
          border: '2px dashed #0891B2',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? '#E0F7FA' : '#F0F9FF',
          marginBottom: '24px',
        }}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <p>Uploading and parsing...</p>
        ) : isDragActive ? (
          <p>Drop the CSV file here...</p>
        ) : (
          <p>Drag and drop a CSV file here, or click to select</p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>
      )}

      {/* Import Result */}
      {importResult && (
        <div style={{
          backgroundColor: '#D1FAE5',
          border: '1px solid #10B981',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <h3>Import Complete</h3>
          <p>✅ {importResult.imported} rows imported</p>
          <p>⏭️ {importResult.skipped} rows skipped (duplicates)</p>
        </div>
      )}

      {/* Preview Table */}
      {preview && (
        <div>
          <h3>Preview</h3>
          <p>Total rows: {preview.totalRows} | Valid: {preview.validCount} | Invalid: {preview.invalidCount}</p>

          {/* Invalid rows */}
          {preview.invalidRows.length > 0 && (
            <div style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #EF4444',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
            }}>
              <strong>Validation errors:</strong>
              {preview.invalidRows.map((row, i) => (
                <p key={i} style={{ margin: '4px 0', fontSize: '13px' }}>
                  Row {row.rowNumber}: {row.error}
                </p>
              ))}
            </div>
          )}

          {/* Preview table */}
          <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0891B2', color: 'white' }}>
                  {Object.keys(preview.previewRows[0] || {}).map(col => (
                    <th key={col} style={{ padding: '8px', textAlign: 'left' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.previewRows.map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#F0F9FF' : 'white' }}>
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} style={{ padding: '8px', borderBottom: '1px solid #E2E8F0' }}>
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleImport}
              disabled={importing || preview.validCount === 0}
              style={{
                padding: '10px 24px',
                backgroundColor: preview.validCount === 0 ? '#94A3B8' : '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: preview.validCount === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {importing ? 'Importing...' : `Import ${preview.validCount} valid rows`}
            </button>

            <button
              onClick={() => setPreview(null)}
              style={{
                padding: '10px 24px',
                backgroundColor: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}