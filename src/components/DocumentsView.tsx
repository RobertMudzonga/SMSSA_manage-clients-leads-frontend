import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import DocumentCard from './DocumentCard';
import UploadDocumentModal from './UploadDocumentModal';

interface DocumentsViewProps {
  documents: any[];
  onUploadDocument: (data: any) => void;
  onDownload: (doc: any) => void;
  onSign: (doc: any) => void;
}

export default function DocumentsView({ documents, onUploadDocument, onDownload, onSign }: DocumentsViewProps) {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [folderDocuments, setFolderDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const filteredDocuments = documents.filter(d => {
    const matchesSearch = d.document_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || d.document_type === filterType;
    return matchesSearch && matchesType;
  });

  const fetchFoldersForProject = async (projectId: string) => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/documents/folders/project/${projectId}`);
      if (res.ok) {
        const json = await res.json();
        setFolders(json || []);
        if (json.length > 0) setSelectedFolderId(json[0].folder_id);
      } else {
        setFolders([]);
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
      setFolders([]);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const json = await res.json();
        setProjects(json || []);
        if (json.length > 0) setSelectedProjectId(String(json[0].project_id));
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setProjects([]);
    }
  };

  // load projects on mount
  React.useEffect(() => {
    fetchProjects();
  }, []);

  const fetchDocsForFolder = async (folderId: number | null) => {
    if (!folderId) {
      setFolderDocuments([]);
      return;
    }
    try {
      const res = await fetch(`/api/documents/folders/${folderId}/documents`);
      if (res.ok) {
        const json = await res.json();
        setFolderDocuments(json || []);
      } else {
        setFolderDocuments([]);
      }
    } catch (err) {
      console.error('Error fetching folder documents:', err);
      setFolderDocuments([]);
    }
  };

  const handleFolderFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (selectedFolderId) fd.append('folder_id', String(selectedFolderId));
      const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
      if (res.ok) {
        toast({ title: 'Upload successful' });
        await fetchDocsForFolder(selectedFolderId);
      } else {
        const err = await res.json().catch(() => null);
        toast({ title: 'Upload failed', description: (err?.error || res.statusText), variant: 'destructive' });
      }
    } catch (err) {
      console.error('Upload failed:', err);
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

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

      <div className="mt-4 border rounded-lg p-4 bg-white">
        <h3 className="font-semibold mb-3">Project Folders</h3>
        <div className="flex gap-2 items-center mb-3">
          <select className="px-3 py-2 border rounded flex-1" value={selectedProjectId} onChange={(e) => { setSelectedProjectId(e.target.value); fetchFoldersForProject(e.target.value); }}>
            <option value="">(Select project)</option>
            {projects.map(p => (
              <option key={p.project_id} value={p.project_id}>{p.name} ({p.project_id})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-2">Folders</label>
          {folders.length === 0 && <div className="text-sm text-gray-500">No folders loaded.</div>}
          {folders.length > 0 && (
            <select value={String(selectedFolderId || '')} onChange={(e) => { setSelectedFolderId(e.target.value ? parseInt(e.target.value, 10) : null); fetchDocsForFolder(e.target.value ? parseInt(e.target.value, 10) : null); }} className="w-full px-3 py-2 border rounded">
              <option value="">(Select folder)</option>
              {folders.map(f => <option key={f.folder_id} value={f.folder_id}>{f.name}</option>)}
            </select>
          )}
        </div>
        <div className="mt-3">
          <label className="block text-sm text-gray-600 mb-2">Upload File to Folder</label>
          <input type="file" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFolderFileUpload(file); }} />
          {uploading && <div className="text-sm text-gray-500 mt-2">Uploading...</div>}
        </div>
        <div className="mt-4">
          <h4 className="font-medium">Files in folder</h4>
          <ul className="mt-2 space-y-2">
            {folderDocuments.length === 0 && <li className="text-sm text-gray-500">No files</li>}
            {folderDocuments.map(d => (
              <li key={d.document_id} className="flex items-center justify-between">
                <div className="text-sm">{d.name} <span className="text-xs text-gray-400">({d.size} bytes)</span></div>
                <a className="text-sky-600 text-sm" href={`/api/documents/${d.document_id}/download`}>Download</a>
              </li>
            ))}
          </ul>
        </div>
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
