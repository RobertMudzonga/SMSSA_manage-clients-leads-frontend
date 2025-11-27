import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { MEDICAL_WARNING } from '@/utils/documentChecklists';

interface DocumentChecklistViewProps {
  projectId: string;
  onClose: () => void;
}

export default function DocumentChecklistView({ projectId, onClose }: DocumentChecklistViewProps) {
  const [checklist, setChecklist] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChecklist();
  }, [projectId]);

  const loadChecklist = async () => {
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

  const toggleReceived = async (id: string, currentStatus: boolean) => {
    await supabase
      .from('document_checklists')
      .update({ 
        is_received: !currentStatus,
        received_date: !currentStatus ? new Date().toISOString() : null
      })
      .eq('id', id);
    
    loadChecklist();
  };

  const sendReminder = async () => {
    const missingDocs = checklist.filter(item => !item.is_received && item.is_required);
    
    await supabase
      .from('document_checklists')
      .update({ reminder_sent_date: new Date().toISOString() })
      .in('id', missingDocs.map(d => d.id));
    
    alert(`Reminder sent for ${missingDocs.length} missing documents`);
    loadChecklist();
  };

  const categories = [...new Set(checklist.map(item => item.document_category))];
  const receivedCount = checklist.filter(item => item.is_received).length;
  const progress = checklist.length > 0 ? Math.round((receivedCount / checklist.length) * 100) : 0;

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document Checklist</h2>
          <p className="text-gray-600">{project?.client_name} - {project?.visa_type}</p>
        </div>
        <Button onClick={onClose} variant="outline">Close</Button>
      </div>

      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">{MEDICAL_WARNING}</div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium">Progress: {progress}%</div>
          <div className="text-sm text-gray-600">{receivedCount} of {checklist.length} received</div>
        </div>
        <Button onClick={sendReminder} className="gap-2">
          <Send className="h-4 w-4" />
          Send Reminder
        </Button>
      </div>

      <div className="space-y-6">
        {categories.map(category => {
          const items = checklist.filter(item => item.document_category === category);
          const categoryReceived = items.filter(item => item.is_received).length;
          
          return (
            <Card key={category} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{category}</h3>
                <Badge variant={categoryReceived === items.length ? "default" : "secondary"}>
                  {categoryReceived}/{items.length}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox 
                        checked={item.is_received}
                        onCheckedChange={() => toggleReceived(item.id, item.is_received)}
                      />
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {item.document_name}
                          {!item.is_required && <Badge variant="outline" className="text-xs">Optional</Badge>}
                        </div>
                        {item.notes && (
                          <div className="text-xs text-blue-600 mt-1">
                            Note: {item.notes}
                          </div>
                        )}
                        {item.received_date && (
                          <div className="text-xs text-gray-500 mt-1">
                            Received: {new Date(item.received_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    {item.is_received ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                    )}
                  </div>
                ))}
              </div>

            </Card>
          );
        })}
      </div>
    </div>
  );
}
