import { useState } from 'react';
import DocumentCard from './DocumentCard';
import UploadDocumentModal from './UploadDocumentModal';

interface DocumentsViewProps {
  documents: any[];
  onUploadDocument: (data: any) => void;
  onDownload: (doc: any) => void;
  onSign: (doc: any) => void;
}

export default function DocumentsView({ documents, onUploadDocument, onDownload, onSign }: DocumentsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredDocuments = documents.filter(d => {
    const matchesSearch = d.document_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || d.document_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          Upload Document
        </button>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Types</option>
          <option value="Passport">Passport</option>
          <option value="Birth Certificate">Birth Certificate</option>
          <option value="Police Clearance">Police Clearance</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.map(doc => (
          <DocumentCard 
            key={doc.id} 
            document={doc}
            onDownload={() => onDownload(doc)}
            onSign={() => onSign(doc)}
          />
        ))}
      </div>

      <UploadDocumentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => {
          onUploadDocument(data);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
