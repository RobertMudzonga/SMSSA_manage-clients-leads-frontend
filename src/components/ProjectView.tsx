import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import DocumentChecklistView from './DocumentChecklistView';
import { useToast } from '@/hooks/use-toast';

interface ProjectViewProps {
  projectId: string;
  onClose: () => void;
}

export default function ProjectView({ projectId, onClose }: ProjectViewProps) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<number>(1);

  // Submission stage state
  const [supervisorReviewed, setSupervisorReviewed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<string>('on-hold');

  // Submission details (used in tracking stage)
  const [submissionDetails, setSubmissionDetails] = useState<any>({
    submission_type: 'mobile',
    submission_center: '',
    submission_date: '',
    visa_ref: '',
    vfs_receipt: '',
    receipt_number: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadProject = async () => {
    setLoading(true);
    const { data } = await supabase.from('projects').select('*').eq('id', projectId).single();
    if (data) {
      setProject(data);
      setStage(data.stage || 1);
      setSubmissionStatus(data.submission_status || 'on-hold');
      setSubmissionDetails({
        submission_type: data.submission_type || 'mobile',
        submission_center: data.submission_center || '',
        submission_date: data.submission_date || '',
        visa_ref: data.visa_ref || '',
        vfs_receipt: data.vfs_receipt || '',
        receipt_number: data.receipt_number || ''
      });
    }
    setLoading(false);
  };

  const updateProjectStage = async (nextStage: number) => {
    await supabase.from('projects').update({ stage: nextStage }).eq('id', projectId);
    setStage(nextStage);
    loadProject();
  };

  // Document checklist completion check
  const isChecklistComplete = async () => {
    const { data: checklist } = await supabase
      .from('document_checklists')
      .select('*')
      .eq('project_id', projectId);

    if (!checklist) return false;
    const required = checklist.filter((c: any) => c.is_required !== false);
    return required.length === 0 || required.every((c: any) => c.is_received === true);
  };

  const tryAdvanceFromDocumentStage = async () => {
    const ok = await isChecklistComplete();
    if (ok) {
      await updateProjectStage(3);
    } else {
      toast({ title: 'Required documents missing', description: 'All required documents must be collected to advance this stage.', variant: 'destructive' });
    }
  };

  const tryAdvanceFromSubmissionTasks = async () => {
    if (supervisorReviewed && submitted) {
      await updateProjectStage(4);
    } else {
      toast({ title: 'Tasks incomplete', description: 'Both tasks (Reviewed by Supervisor and Submit) must be completed.', variant: 'destructive' });
    }
  };

  const saveSubmissionStatus = async () => {
    await supabase.from('projects').update({ submission_status: submissionStatus }).eq('id', projectId);
    if (submissionStatus === 'submitted') {
      // go to tracking stage to capture details
      await updateProjectStage(5);
    } else {
      // remain in this stage
      loadProject();
    }
  };

  const saveSubmissionDetails = async () => {
    await supabase.from('projects').update({
      submission_type: submissionDetails.submission_type,
      submission_center: submissionDetails.submission_center,
      submission_date: submissionDetails.submission_date,
      visa_ref: submissionDetails.visa_ref,
      vfs_receipt: submissionDetails.vfs_receipt,
      receipt_number: submissionDetails.receipt_number
    }).eq('id', projectId);

    // advance to final stage
    await updateProjectStage(6);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project: {project?.project_name}</h2>
          <p className="text-sm text-gray-600">Client: {project?.client_name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Stages</h3>
          <div className="space-y-2">
            <div className={`p-3 rounded ${stage === 1 ? 'bg-teal-50 border-l-4 border-teal-600' : 'bg-white border'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">1. New Client</div>
                  <div className="text-sm text-gray-600">Task: Introduction</div>
                </div>
                <div>
                  {stage > 1 ? <Badge>Done</Badge> : (
                    <Button size="sm" onClick={async () => { await updateProjectStage(2); }}>Mark Done</Button>
                  )}
                </div>
              </div>
            </div>

            <div className={`p-3 rounded ${stage === 2 ? 'bg-teal-50 border-l-4 border-teal-600' : 'bg-white border'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">2. Document Preparation</div>
                  <div className="text-sm text-gray-600">Collect all documents in checklist</div>
                </div>
                <div>
                  {stage > 2 ? <Badge>Done</Badge> : (
                    <Button size="sm" onClick={tryAdvanceFromDocumentStage}>Verify & Advance</Button>
                  )}
                </div>
              </div>
            </div>

            <div className={`p-3 rounded ${stage === 3 ? 'bg-teal-50 border-l-4 border-teal-600' : 'bg-white border'}`}>
              <div className="mb-2">
                <div className="font-medium">3. Submission</div>
                <div className="text-sm text-gray-600">Tasks: Reviewed by Supervisor, Submit</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={supervisorReviewed} onCheckedChange={() => setSupervisorReviewed(!supervisorReviewed)} />
                    <div>Reviewed by Supervisor</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={submitted} onCheckedChange={() => setSubmitted(!submitted)} />
                    <div>Submit</div>
                  </div>
                </div>
                <div>
                  <Button onClick={tryAdvanceFromSubmissionTasks}>Verify & Advance</Button>
                </div>
              </div>
            </div>

            <div className={`p-3 rounded ${stage === 4 ? 'bg-teal-50 border-l-4 border-teal-600' : 'bg-white border'}`}>
              <div className="mb-2">
                <div className="font-medium">4. Submission Status</div>
                <div className="text-sm text-gray-600">Set processing status</div>
              </div>
              <div className="space-y-2">
                <select className="w-full p-2 border rounded" value={submissionStatus} onChange={(e) => setSubmissionStatus(e.target.value)}>
                  <option value="on-hold">On Hold</option>
                  <option value="compiling">Compiling</option>
                  <option value="submitted-to-dti">Submitted to DTI</option>
                  <option value="submitted">Submitted</option>
                </select>
                <div className="flex gap-2">
                  <Button onClick={saveSubmissionStatus}>Save Status</Button>
                  <Button variant="outline" onClick={() => updateProjectStage(3)}>Back</Button>
                </div>
              </div>
            </div>

            <div className={`p-3 rounded ${stage === 5 ? 'bg-teal-50 border-l-4 border-teal-600' : 'bg-white border'}`}>
              <div className="mb-2">
                <div className="font-medium">5. Tracking</div>
                <div className="text-sm text-gray-600">Capture submission information</div>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-sm">Type of Submission</label>
                  <select className="w-full p-2 border rounded" value={submissionDetails.submission_type} onChange={(e) => setSubmissionDetails({ ...submissionDetails, submission_type: e.target.value })}>
                    <option value="mobile">Mobile</option>
                    <option value="vfs">VFS</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm">Submission Center</label>
                  <input className="w-full p-2 border rounded" value={submissionDetails.submission_center} onChange={(e) => setSubmissionDetails({ ...submissionDetails, submission_center: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm">Date of Submission</label>
                  <input type="date" className="w-full p-2 border rounded" value={submissionDetails.submission_date} onChange={(e) => setSubmissionDetails({ ...submissionDetails, submission_date: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm">Visa Reference</label>
                  <input className="w-full p-2 border rounded" value={submissionDetails.visa_ref} onChange={(e) => setSubmissionDetails({ ...submissionDetails, visa_ref: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm">VFS Receipt</label>
                  <input className="w-full p-2 border rounded" value={submissionDetails.vfs_receipt} onChange={(e) => setSubmissionDetails({ ...submissionDetails, vfs_receipt: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm">Receipt Number</label>
                  <input className="w-full p-2 border rounded" value={submissionDetails.receipt_number} onChange={(e) => setSubmissionDetails({ ...submissionDetails, receipt_number: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveSubmissionDetails}>Save & Advance</Button>
                  <Button variant="outline" onClick={() => updateProjectStage(4)}>Back</Button>
                </div>
              </div>
            </div>

            <div className={`p-3 rounded ${stage === 6 ? 'bg-teal-50 border-l-4 border-teal-600' : 'bg-white border'}`}>
              <div>
                <div className="font-medium">6. Completed</div>
                <div className="text-sm text-gray-600">Project has completed the pipeline stages.</div>
              </div>
            </div>
          </div>
        </Card>

        <div className="md:col-span-2 space-y-4">
          {stage === 2 && (
            <DocumentChecklistView projectId={projectId} onClose={() => { /* noop - handled by parent */ }} />
          )}

          {stage === 3 && (
            <Card className="p-4">
              <h3 className="font-semibold">Submission Tasks</h3>
              <p className="text-sm text-gray-600">Complete the review and submit the case.</p>
            </Card>
          )}

          {stage === 4 && (
            <Card className="p-4">
              <h3 className="font-semibold">Submission Status</h3>
              <p className="text-sm text-gray-600">Current: {submissionStatus}</p>
            </Card>
          )}

          {stage === 5 && (
            <Card className="p-4">
              <h3 className="font-semibold">Capture Submission Details</h3>
              <p className="text-sm text-gray-600">These details will be used for tracking.</p>
            </Card>
          )}

          {stage === 6 && (
            <Card className="p-4">
              <h3 className="font-semibold">Summary</h3>
              <pre className="text-xs mt-2 bg-gray-50 p-2 rounded">{JSON.stringify(project, null, 2)}</pre>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
