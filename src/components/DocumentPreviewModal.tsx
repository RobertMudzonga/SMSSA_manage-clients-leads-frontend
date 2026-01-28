import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { API_BASE } from '@/lib/api';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  documentId: number;
  documentName: string;
  mimeType?: string;
  onClose: () => void;
}

export default function DocumentPreviewModal({
  isOpen,
  documentId,
  documentName,
  mimeType,
  onClose
}: DocumentPreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildUrl = (id: number) => {
    const base = /^https?:\/\//i.test(API_BASE) ? API_BASE.replace(/\/$/, '') : '';
    return `${base}/api/documents/${id}/download`;
  };

  const canPreview = () => {
    if (!mimeType) return false;
    return (
      mimeType.startsWith('image/') ||
      mimeType === 'application/pdf'
    );
  };

  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const previewUrl = buildUrl(documentId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{documentName}</h3>
            <p className="text-xs text-gray-500">{mimeType || 'Unknown type'}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={previewUrl}
              download
              className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <Download className="h-4 w-4" />
              Download
            </a>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {!canPreview() ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                Preview not available for this file type ({mimeType || 'unknown'})
              </p>
              <a
                href={previewUrl}
                download
                className="inline-block px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Download File
              </a>
            </div>
          ) : mimeType?.startsWith('image/') ? (
            <div className="text-center">
              <img
                src={previewUrl}
                alt={documentName}
                className="max-w-full h-auto mx-auto"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError('Failed to load image');
                }}
              />
              {error && <p className="text-red-600 mt-4">{error}</p>}
            </div>
          ) : mimeType === 'application/pdf' ? (
            <div className="bg-gray-100">
              <iframe
                src={`${previewUrl}#toolbar=1`}
                className="w-full h-[600px] border-0"
                onLoad={() => setLoading(false)}
              />
              {error && <p className="text-red-600 p-4">{error}</p>}
            </div>
          ) : null}

          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin">
                <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full" />
              </div>
              <p className="text-gray-600 mt-4">Loading preview...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
