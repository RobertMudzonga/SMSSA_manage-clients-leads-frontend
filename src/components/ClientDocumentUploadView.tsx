import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import DocumentUploadZone from './DocumentUploadZone';

interface ClientDocumentUploadViewProps {
  projectId: string;
  clientName: string;
}

export default function ClientDocumentUploadView({ 
  projectId, 
  clientName 
}: ClientDocumentUploadViewProps) {
  const [checklist, setChecklist] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    const { data: projectData } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    const { data: checklistData } = await supabase
      .from('document_checklists')
      .select('*')
      .eq('project_id', projectId)
      .order('document_category');
    
    setProject(projectData);
    setChecklist(checklistData || []);
    setLoading(false);
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const categories = [...new Set(checklist.map(item => item.document_category))];
  const receivedCount = checklist.filter(item => item.is_received).length;
  const progress = checklist.length > 0 ? Math.round((receivedCount / checklist.length) * 100) : 0;

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Document Upload Portal</h1>
          <p className="text-teal-100">Welcome, {clientName}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Your Progress</h2>
              <p className="text-sm text-gray-600">{project?.visa_type}</p>
            </div>
            <Badge className="text-lg px-4 py-2">{progress}%</Badge>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-gray-600 mt-2">
            {receivedCount} of {checklist.length} documents received
          </p>
        </Card>

        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              Upload your documents below. Accepted formats: PDF, JPG, PNG, DOC (max 10MB per file)
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          {categories.map(category => {
            const items = checklist.filter(item => item.document_category === category);
            const categoryReceived = items.filter(item => item.is_received).length;
            
            return (
              <Card key={category} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{category}</h3>
                  <Badge variant={categoryReceived === items.length ? "default" : "secondary"}>
                    {categoryReceived}/{items.length} Complete
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  {items.map(item => (
                    <div key={item.id}>
                      <div 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                        onClick={() => !item.is_received && toggleExpanded(item.id)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {item.is_received ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Upload className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <div className="font-medium">{item.document_name}</div>
                            {item.notes && (
                              <div className="text-xs text-blue-600 mt-1">{item.notes}</div>
                            )}
                          </div>
                        </div>
                        {item.is_received && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            Received
                          </Badge>
                        )}
                      </div>
                      
                      {expandedItems.has(item.id) && !item.is_received && (
                        <div className="mt-3">
                          <DocumentUploadZone
                            projectId={projectId}
                            checklistItemId={item.id}
                            documentName={item.document_name}
                            onUploadSuccess={loadData}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}