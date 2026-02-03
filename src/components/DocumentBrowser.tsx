import React, { useState } from 'react';
import { FileText, Folder, MoreVertical, Eye, Download, Share2, Lock, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

interface Document {
  document_id: number;
  name: string;
  size: number;
  created_at: string;
  status: string;
  unique_doc_id: string;
  document_type?: string;
}

interface DocumentBrowserProps {
  documents: Document[];
  onSelect?: (doc: Document) => void;
  onDownload?: (doc: Document) => void;
  onDelete?: (docId: number) => void;
  onShare?: (doc: Document) => void;
  selectedDocumentId?: number;
}

export default function DocumentBrowser({
  documents,
  onSelect,
  onDownload,
  onDelete,
  onShare,
  selectedDocumentId,
}: DocumentBrowserProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <FileText className="w-8 h-8" />;
    if (mimeType.includes('folder')) return <Folder className="w-8 h-8" />;
    if (mimeType.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (mimeType.includes('image')) return <FileText className="w-8 h-8 text-blue-500" />;
    if (mimeType.includes('word')) return <FileText className="w-8 h-8 text-blue-600" />;
    if (mimeType.includes('sheet')) return <FileText className="w-8 h-8 text-green-600" />;
    return <FileText className="w-8 h-8" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-600';
      case 'checked_out':
        return 'text-yellow-600';
      case 'archived':
        return 'text-gray-600';
      case 'expired':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  if (viewMode === 'grid') {
    return (
      <div className="space-y-4">
        <div className="flex justify-end gap-2 mb-4">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.document_id}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedDocumentId === doc.document_id
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelect?.(doc)}
            >
              <div className="flex items-center justify-between mb-3">
                {getFileIcon(doc.document_type)}
                <DocumentActions
                  document={doc}
                  onDownload={onDownload}
                  onDelete={onDelete}
                  onShare={onShare}
                />
              </div>

              <h3 className="font-medium text-sm text-gray-900 truncate mb-1">
                {doc.name}
              </h3>
              <p className="text-xs text-gray-500 mb-2">{doc.unique_doc_id}</p>

              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium capitalize ${getStatusColor(doc.status)}`}>
                  {doc.status.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-gray-500">{formatFileSize(doc.size)}</span>
              </div>

              <p className="text-xs text-gray-500">{formatDate(doc.created_at)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end gap-2 mb-4">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('grid')}
        >
          Grid
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('list')}
        >
          List
        </Button>
      </div>

      {documents.map((doc) => (
        <div
          key={doc.document_id}
          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
            selectedDocumentId === doc.document_id
              ? 'ring-2 ring-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onSelect?.(doc)}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {getFileIcon(doc.document_type)}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-gray-900 truncate">
                {doc.name}
              </h3>
              <p className="text-xs text-gray-500">{doc.unique_doc_id}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-4">
            <span className={`text-xs font-medium capitalize ${getStatusColor(doc.status)}`}>
              {doc.status.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {formatFileSize(doc.size)}
            </span>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {formatDate(doc.created_at)}
            </span>
            <DocumentActions
              document={doc}
              onDownload={onDownload}
              onDelete={onDelete}
              onShare={onShare}
              compact
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DocumentActions({
  document,
  onDownload,
  onDelete,
  onShare,
  compact = false,
}: {
  document: Document;
  onDownload?: (doc: Document) => void;
  onDelete?: (docId: number) => void;
  onShare?: (doc: Document) => void;
  compact?: boolean;
}) {
  const [showMenu, setShowMenu] = React.useState(false);

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {onDownload && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(document);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            )}
            {onShare && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(document);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this document?')) {
                    onDelete(document.document_id);
                  }
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {onDownload && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload(document);
          }}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
        >
          <Download className="w-4 h-4 text-gray-500" />
        </button>
      )}
      {onShare && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare(document);
          }}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
        >
          <Share2 className="w-4 h-4 text-gray-500" />
        </button>
      )}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Delete this document?')) {
              onDelete(document.document_id);
            }
          }}
          className="p-2 hover:bg-red-100 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      )}
    </div>
  );
}
