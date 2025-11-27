import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import ClientDocumentUploadView from '@/components/ClientDocumentUploadView';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function ClientPortal() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<any>(null);

  useEffect(() => {
    validateAndLoadProject();
  }, []);

  const validateAndLoadProject = async () => {
    const token = searchParams.get('token');
    
    if (!token) {
      setError('Invalid access link. Please contact your immigration consultant.');
      setLoading(false);
      return;
    }

    try {
      // Validate token
      const { data: accessData, error: accessError } = await supabase
        .from('client_portal_access')
        .select('*')
        .eq('access_token', token)
        .eq('is_active', true)
        .single();

      if (accessError || !accessData) {
        setError('Invalid or expired access link.');
        setLoading(false);
        return;
      }

      // Check expiry
      if (new Date(accessData.expires_at) < new Date()) {
        setError('This access link has expired. Please contact your consultant for a new link.');
        setLoading(false);
        return;
      }

      // Update last accessed
      await supabase
        .from('client_portal_access')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('id', accessData.id);

      // Load project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', accessData.project_id)
        .single();

      if (projectError || !project) {
        setError('Unable to load your case information.');
        setLoading(false);
        return;
      }

      setProjectData(project);
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
      projectId={projectData.id}
      clientName={projectData.client_name}
    />
  );
}