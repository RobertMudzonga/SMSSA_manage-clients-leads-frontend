import { useEffect, useState } from 'react';
import { formatForDateInput } from '@/utils/formatDate';
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
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) {
        console.error('Failed to load project', res.status, await res.text());
        setLoading(false);
        return;
      }
      const json = await res.json();
      const proj = json && json.project ? json.project : json;
      setProject(proj);
      setStage(proj.stage || proj.current_stage || 1);
      setSubmissionStatus(proj.submission_status || 'on-hold');
      setSubmissionDetails({
        submission_type: proj.submission_type || proj.tracking_submission_type || 'mobile',
        submission_center: proj.submission_center || proj.tracking_submission_center || '',
        submission_date: formatForDateInput(proj.submission_date || proj.tracking_date || ''),
        visa_ref: proj.visa_ref || proj.tracking_visa_ref || '',
        vfs_receipt: proj.vfs_receipt || proj.tracking_vfs_receipt || '',
        receipt_number: proj.receipt_number || proj.tracking_receipt_number || ''
      });
    } catch (err) {
      console.error('Failed to load project', err);
    }
    setLoading(false);
  };

  const updateProjectStage = async (nextStage: number) => {
    try {
      const storedEmail = window.localStorage.getItem('userEmail');
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (storedEmail) headers['x-user-email'] = storedEmail;
      const res = await fetch(`/api/projects/${projectId}/stage`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ current_stage: nextStage })
      });
      if (!res.ok) {
        const txt = await res.text();
        console.error('Stage update failed', res.status, txt);
        toast({ title: 'Unable to update stage', description: 'Server error when updating project stage', variant: 'destructive' });
        return;
      }
      const json = await res.json();
      const updated = json || {};
      setStage(nextStage);
      loadProject();
      try {
        window.dispatchEvent(new CustomEvent('project:stage-updated', { detail: { projectId, stage: nextStage } }));
      } catch (e) {}

      // Compute progress based on the project's 6 tasks.
      try {
        const completedTasks = (nextStage === 6) ? 6 : Math.max(0, nextStage - 1);
        const progressPercent = Math.round((completedTasks / 6) * 100);
        // Send a quick update to set progress column
        const storedEmail = window.localStorage.getItem('userEmail');
        const headers: Record<string,string> = { 'Content-Type': 'application/json' };
        if (storedEmail) headers['x-user-email'] = storedEmail;
        await fetch(`/api/projects/${projectId}/stage`, { method: 'PATCH', headers, body: JSON.stringify({ progress: progressPercent }) });
      } catch (err) {
        // non-fatal; progress update best-effort
        console.warn('Failed to update progress:', err);
      }

      return updated;
    } catch (err) {
      console.error('Failed to update stage', err);
      toast({ title: 'Unable to update stage', description: String(err), variant: 'destructive' });
    }
  };

  // Document checklist completion check
  const isChecklistComplete = async () => {
    try {
      const res = await fetch(`/api/checklists/${projectId}`);
      if (!res.ok) {
        console.error('Checklist API returned', res.status, await res.text());
        return false;
      }
      const json = await res.json();
      const checklist = json && json.ok ? json.checklist : [];
      console.debug('Loaded checklist for project (API)', projectId, checklist);
      const required = checklist.filter((c: any) => c.is_required !== false);
      if (required.length === 0) return true;
      const allReceived = required.every((c: any) => {
        if (c.is_received === true) return true;
        if (c.is_received === 1) return true;
        if (c.is_received === '1') return true;
        if (typeof c.is_received === 'string' && c.is_received.toLowerCase() === 'true') return true;
        if (c.is_received === 't') return true;
        return false;
      });
      return allReceived;
    } catch (err) {
      console.error('Checklist check failed:', err);
      return false;
    }
  };

  const tryAdvanceFromDocumentStage = async () => {
    try {
      const ok = await isChecklistComplete();
      if (ok) {
        await updateProjectStage(3);
      } else {
        toast({ title: 'Required documents missing', description: 'All required documents must be collected to advance this stage.', variant: 'destructive' });
      }
    } catch (err: any) {
      console.error('Error advancing from document stage:', err);
      toast({ title: 'Unable to verify checklist', description: err?.message || 'Please try again or check server logs', variant: 'destructive' });
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
    try {
      const storedEmail = window.localStorage.getItem('userEmail');
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (storedEmail) headers['x-user-email'] = storedEmail;
      const res = await fetch(`/api/projects/${projectId}/stage`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ submission_status: submissionStatus })
      });
      if (!res.ok) {
        console.error('Failed to save submission status', await res.text());
        toast({ title: 'Save failed', description: 'Unable to update submission status', variant: 'destructive' });
        return;
      }
      if (submissionStatus === 'submitted') {
        await updateProjectStage(5);
      } else {
        loadProject();
      }
    } catch (err) {
      console.error('Error saving submission status', err);
      toast({ title: 'Save failed', description: String(err), variant: 'destructive' });
    }
  };

  const saveSubmissionDetails = async () => {
    try {
      const storedEmail = window.localStorage.getItem('userEmail');
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (storedEmail) headers['x-user-email'] = storedEmail;
      const body = {
        submission_type: submissionDetails.submission_type,
        submission_center: submissionDetails.submission_center,
        submission_date: submissionDetails.submission_date,
        visa_ref: submissionDetails.visa_ref,
        vfs_receipt: submissionDetails.vfs_receipt,
        receipt_number: submissionDetails.receipt_number
      };
      const res = await fetch(`/api/projects/${projectId}/stage`, { method: 'PATCH', headers, body: JSON.stringify(body) });
      if (!res.ok) {
        console.error('Failed to save submission details', await res.text());
        toast({ title: 'Save failed', description: 'Unable to save submission details', variant: 'destructive' });
        return;
      }
      // advance to final stage
      await updateProjectStage(6);
    } catch (err) {
      console.error('Error saving submission details', err);
      toast({ title: 'Save failed', description: String(err), variant: 'destructive' });
    }
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
          <Button variant="destructive" onClick={async () => {
            if (!confirm('Delete this project? This action cannot be undone.')) return;
            try {
              const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
              const ct = res.headers.get('content-type') || '';
              let body: any = null;
              if (ct.includes('application/json')) body = await res.json().catch(() => null);
              else body = await res.text().catch(() => null);
              if (!res.ok) {
                const msg = (body && (body.error || body.message)) ? (body.error || body.message) : (typeof body === 'string' ? body : 'Server error when deleting project');
                console.error('Delete failed', res.status, msg);
                toast({ title: 'Delete failed', description: msg, variant: 'destructive' });
                return;
              }
              try { window.dispatchEvent(new CustomEvent('project:deleted', { detail: { projectId } })); } catch (e) {}
              toast({ title: 'Project deleted', description: 'Project was removed successfully.' });
              onClose();
            } catch (err) {
              console.error('Delete request failed', err);
              toast({ title: 'Delete failed', description: String(err), variant: 'destructive' });
            }
          }}>Delete</Button>
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
                  <input type="date" className="w-full p-2 border rounded" value={formatForDateInput(submissionDetails.submission_date)} onChange={(e) => setSubmissionDetails({ ...submissionDetails, submission_date: e.target.value ? formatForDateInput(e.target.value) : '' })} />
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
