import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Loader2 } from 'lucide-react';

interface UploadDocumentFormProps {
  projectId?: number;
  folderId?: number;
  onUpload: (document: any) => void;
  onClose: () => void;
  isUploading?: boolean;
}

export default function UploadDocumentForm({
  projectId,
  folderId,
  onUpload,
  onClose,
  isUploading = false
}: UploadDocumentFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload',
        variant: 'destructive'
      });
      return;
    }

    if (!projectId) {
      toast({
        title: 'No project selected',
        description: 'Please select a project first',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_id', String(projectId));
      if (folderId) {
        formData.append('folder_id', String(folderId));
      }
      if (fileName) {
        formData.append('document_name', fileName);
      }
      if (description) {
        formData.append('description', description);
      }

      const headers: Record<string, string> = {};
      if (user?.email) {
        headers['x-user-email'] = user.email;
      }

      const response = await fetch(`${API_BASE}/api/documents/upload`, {
        method: 'POST',
        body: formData,
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      toast({
        title: 'Document uploaded successfully',
        description: `${fileName} has been uploaded`
      });

      onUpload(data.document || data);
      setFile(null);
      setFileName('');
      setDescription('');
      onClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload document',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Document
        </label>
        <Input
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          accept="*/*"
          className="cursor-pointer"
        />
        {file && (
          <p className="text-xs text-gray-500 mt-1">
            Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      {/* Document Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Name (optional)
        </label>
        <Input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          placeholder="Enter document name"
          disabled={uploading}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (optional)
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter document description"
          disabled={uploading}
          rows={3}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={uploading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={uploading || !file}
          className="gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload Document'
          )}
        </Button>
      </div>
    </form>
  );
}
