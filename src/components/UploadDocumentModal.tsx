import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CLIENT_UPLOADS_ENABLED } from '@/utils/documentSettings';
import { useAuth } from '@/contexts/AuthContext';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  projectId?: string;
}

export default function UploadDocumentModal({ isOpen, onClose, onSubmit, projectId }: UploadDocumentModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    document_name: '',
    document_type: 'Passport',
    signature_required: false
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  if (!isOpen) return null;

  if (!CLIENT_UPLOADS_ENABLED) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Upload Disabled</h2>
          <p className="text-sm text-gray-700 mb-4">Document uploads are currently disabled for clients. Project managers will manually mark received documents on the checklist.</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg">Close</button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: 'No file selected', description: 'Please select a file to upload', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file as File);
      fd.append('project_id', String(projectId || ''));
      fd.append('document_name', formData.document_name);
      fd.append('document_type', formData.document_type);
      fd.append('signature_required', String(formData.signature_required));

      const headers: Record<string,string> = {};
      if (user && user.email) headers['x-user-email'] = user.email;

      const res = await fetch('/api/documents/upload', { method: 'POST', body: fd, headers });
      const ct = res.headers.get('content-type') || '';
      let json: any = null;
      if (ct.includes('application/json')) json = await res.json(); else { const t = await res.text(); try { json = JSON.parse(t); } catch { json = { error: t }; } }

      if (!res.ok) {
        console.error('Upload failed', json);
        toast({ title: 'Upload failed', description: json?.error || 'Server error', variant: 'destructive' });
      } else {
        // backend returns created document
        onSubmit(json.document || json);
        setFormData({ document_name: '', document_type: 'Passport', signature_required: false });
        setFile(null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', description: 'Failed to upload file', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Upload Document</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Document Name"
            value={formData.document_name}
            onChange={(e) => setFormData({...formData, document_name: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          <select
            value={formData.document_type}
            onChange={(e) => setFormData({...formData, document_type: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option>Passport</option>
            <option>Birth Certificate</option>
            <option>Police Clearance</option>
            <option>Medical Report</option>
            <option>Employment Letter</option>
            <option>Bank Statement</option>
          </select>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full"
              required
            />
            {file && <p className="text-sm text-gray-600 mt-2">Selected: {file.name}</p>}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800 font-medium">⚠️ Important Note:</p>
            <p className="text-xs text-amber-700 mt-1">
              Please keep your ORIGINAL medical reports and documents for submission. 
              Do not discard them after uploading.
            </p>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.signature_required}
              onChange={(e) => setFormData({...formData, signature_required: e.target.checked})}
            />
            <span className="text-sm">Signature Required</span>
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg" disabled={uploading}>
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-50" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
