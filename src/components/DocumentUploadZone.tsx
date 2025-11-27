import { useState, useCallback } from 'react';
import { Upload, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface DocumentUploadZoneProps {
  projectId: string;
  checklistItemId: string;
  documentName: string;
  onUploadSuccess: () => void;
}

export default function DocumentUploadZone({ 
  projectId, 
  checklistItemId, 
  documentName,
  onUploadSuccess 
}: DocumentUploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadResult(null);

    try {
      const filePath = `${projectId}/${checklistItemId}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase.functions.invoke('upload-client-document', {
        body: {
          projectId,
          checklistItemId,
          fileName: file.name,
          filePath,
          fileSize: file.size,
          fileType: file.type
        }
      });

      if (error) throw error;

      setUploadResult(data);
      if (data.uploadStatus === 'approved') {
        setTimeout(() => onUploadSuccess(), 1500);
      }
    } catch (error: any) {
      setUploadResult({ 
        uploadStatus: 'rejected', 
        validationNotes: error.message 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  }, [projectId, checklistItemId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  return (
    <Card className="p-4">
      <div className="mb-3">
        <h4 className="font-medium text-sm">{documentName}</h4>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? 'border-teal-500 bg-teal-50' : 'border-gray-300'
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : uploadResult ? (
          <div className="flex flex-col items-center gap-2">
            {uploadResult.uploadStatus === 'approved' ? (
              <>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <p className="text-sm font-medium text-green-600">Upload Successful!</p>
              </>
            ) : (
              <>
                <XCircle className="h-8 w-8 text-red-600" />
                <p className="text-sm font-medium text-red-600">Upload Failed</p>
                <p className="text-xs text-gray-600">{uploadResult.validationNotes}</p>
              </>
            )}
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 mb-2">Drag & drop or click to upload</p>
            <p className="text-xs text-gray-500">PDF, JPG, PNG, DOC (max 10MB)</p>
            <input
              type="file"
              onChange={handleChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="hidden"
              id={`file-${checklistItemId}`}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => document.getElementById(`file-${checklistItemId}`)?.click()}
            >
              Select File
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}