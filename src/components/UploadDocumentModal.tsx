import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  projectId?: string;
}

export default function UploadDocumentModal({ isOpen, onClose, onSubmit, projectId }: UploadDocumentModalProps) {
  const [formData, setFormData] = useState({
    document_name: '',
    document_type: 'Passport',
    signature_required: false
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      onSubmit({ 
        ...formData, 
        project_id: projectId,
        file_path: fileName,
        file_size: file.size,
        file_type: file.type
      });
      setFormData({ document_name: '', document_type: 'Passport', signature_required: false });
      setFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
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
