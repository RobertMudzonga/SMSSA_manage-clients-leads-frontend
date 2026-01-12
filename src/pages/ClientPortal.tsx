import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE } from '@/lib/api';
import ClientDocumentUploadView from '@/components/ClientDocumentUploadView';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function ClientPortal() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    validateAndLoadProject();
  }, []);

  const validateAndLoadProject = async () => {
    const tokenParam = searchParams.get('token');
    
    if (!tokenParam) {
      setError('Invalid access link. Please contact your immigration consultant.');
      setLoading(false);
      return;
    }

    setToken(tokenParam);

    try {
      const resp = await fetch(`${API_BASE}/client-portal/validate?token=${encodeURIComponent(tokenParam)}`);
      const json = await resp.json().catch(() => null);
      if (!resp.ok) {
        setError(json?.error === 'expired' ? 'This access link has expired. Please contact your consultant for a new link.' : 'Invalid or expired access link.');
        setLoading(false);
        return;
      }
      setProjectData(json.project || null);
      setLoading(false);
    } catch (err) {
      setError('An error occurred. Please try again later.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ClientDocumentUploadView 
      projectId={projectData?.project_id}
      projectName={projectData?.project_name}
      clientName={projectData?.client_name}
      clientPortalToken={token}
    />
  );
}