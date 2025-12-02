import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectStage {
  id: number;
  name: string;
  status: 'completed' | 'current' | 'upcoming';
  tasks?: Task[];
}

interface Task {
  id: string;
  name: string;
  completed: boolean;
}

interface DocumentChecklistItem {
  id: string;
  document_name: string;
  is_received: boolean;
}

interface SubmissionInfo {
  type_of_submission: 'mobile' | 'VFS' | null;
  submission_center: string;
  date_of_submission: string;
  visa_ref: string;
  vfs_receipt: string;
  receipt_number: string;
}

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<{
    id: string;
    project_name: string;
    client_name: string;
    case_type: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState(0);
  
  // Stage 1: New Client
  const [introductionComplete, setIntroductionComplete] = useState(false);
  
  // Stage 2: Document Preparation
  const [documentChecklist, setDocumentChecklist] = useState<DocumentChecklistItem[]>([]);
  
  // Stage 3: Submission Review
  const [reviewedBySupervisor, setReviewedBySupervisor] = useState(false);
  const [readyToSubmit, setReadyToSubmit] = useState(false);
  
  // Stage 4: Submission
  const [submissionStatus, setSubmissionStatus] = useState<'on_hold' | 'compiling' | 'submitted' | null>(null);
  
  // Stage 5: Tracking
  const [submissionInfo, setSubmissionInfo] = useState<SubmissionInfo>({
    type_of_submission: null,
    submission_center: '',
    date_of_submission: '',
    visa_ref: '',
    vfs_receipt: '',
    receipt_number: ''
  });

  useEffect(() => {
    if (id) {
      loadProjectData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadProjectData = async () => {
    setLoading(true);
    
    // Load project details
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (projectError) {
      toast.error('Failed to load project');
      return;
    }
    
    setProject(projectData);
    
    // Load document checklist
    const { data: checklistData } = await supabase
      .from('document_checklists')
      .select('*')
      .eq('project_id', id)
      .order('document_category');
    
    setDocumentChecklist(checklistData || []);
    
    // Load project stages data (if exists)
    const { data: stageData } = await supabase
      .from('project_stages')
      .select('*')
      .eq('project_id', id)
      .single();
    
    if (stageData) {
      setCurrentStage(stageData.current_stage || 0);
      setIntroductionComplete(stageData.introduction_complete || false);
      setReviewedBySupervisor(stageData.reviewed_by_supervisor || false);
      setReadyToSubmit(stageData.ready_to_submit || false);
      setSubmissionStatus(stageData.submission_status || null);
      
      if (stageData.submission_info) {
        setSubmissionInfo(stageData.submission_info);
      }
    }
    
    setLoading(false);
  };

  const saveStageData = async () => {
    const stageData = {
      project_id: id,
      current_stage: currentStage,
      introduction_complete: introductionComplete,
      reviewed_by_supervisor: reviewedBySupervisor,
      ready_to_submit: readyToSubmit,
      submission_status: submissionStatus,
      submission_info: submissionInfo
    };
    
    const { error } = await supabase
      .from('project_stages')
      .upsert(stageData, { onConflict: 'project_id' });
    
    if (error) {
      toast.error('Failed to save stage data');
    } else {
      toast.success('Progress saved');
    }
  };

  const handleIntroductionToggle = async () => {
    const newValue = !introductionComplete;
    setIntroductionComplete(newValue);
    
    if (newValue && currentStage === 0) {
      setCurrentStage(1);
    }
    
    await saveStageData();
  };

  const handleDocumentToggle = async (docId: string) => {
    const updatedChecklist = documentChecklist.map(doc =>
      doc.id === docId ? { ...doc, is_received: !doc.is_received } : doc
    );
    setDocumentChecklist(updatedChecklist);
    
    // Update in database
    const doc = updatedChecklist.find(d => d.id === docId);
    await supabase
      .from('document_checklists')
      .update({ 
        is_received: doc?.is_received,
        received_date: doc?.is_received ? new Date().toISOString() : null
      })
      .eq('id', docId);
    
    // Check if all documents are collected
    const allCollected = updatedChecklist.every(d => d.is_received);
    if (allCollected && currentStage === 1) {
      setCurrentStage(2);
      await saveStageData();
    }
  };

  const handleReviewComplete = async () => {
    setReviewedBySupervisor(true);
    await saveStageData();
  };

  const handleReadyToSubmit = async () => {
    setReadyToSubmit(true);
    if (currentStage === 2) {
      setCurrentStage(3);
    }
    await saveStageData();
  };

  const handleSubmissionStatusChange = async (status: 'on_hold' | 'compiling' | 'submitted') => {
    setSubmissionStatus(status);
    
    if (status === 'submitted' && currentStage === 3) {
      setCurrentStage(4);
    }
    
    await saveStageData();
  };

  const handleSubmissionInfoChange = (field: keyof SubmissionInfo, value: string) => {
    setSubmissionInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveTrackingInfo = async () => {
    // Validate all required fields
    if (!submissionInfo.type_of_submission || 
        !submissionInfo.submission_center || 
        !submissionInfo.date_of_submission || 
        !submissionInfo.visa_ref || 
        !submissionInfo.vfs_receipt || 
        !submissionInfo.receipt_number) {
      toast.error('Please fill in all tracking information');
      return;
    }
    
    if (currentStage === 4) {
      setCurrentStage(5);
    }
    
    await saveStageData();
    toast.success('Tracking information saved');
  };

  const stages: ProjectStage[] = [
    {
      id: 0,
      name: 'New Client',
      status: currentStage > 0 ? 'completed' : currentStage === 0 ? 'current' : 'upcoming'
    },
    {
      id: 1,
      name: 'Document Preparation',
      status: currentStage > 1 ? 'completed' : currentStage === 1 ? 'current' : 'upcoming'
    },
    {
      id: 2,
      name: 'Submission Review',
      status: currentStage > 2 ? 'completed' : currentStage === 2 ? 'current' : 'upcoming'
    },
    {
      id: 3,
      name: 'Submission',
      status: currentStage > 3 ? 'completed' : currentStage === 3 ? 'current' : 'upcoming'
    },
    {
      id: 4,
      name: 'Tracking',
      status: currentStage > 4 ? 'completed' : currentStage === 4 ? 'current' : 'upcoming'
    },
    {
      id: 5,
      name: 'Completion',
      status: currentStage === 5 ? 'completed' : 'upcoming'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Project not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard/projects')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">{project.project_name}</h1>
        <p className="text-gray-600 mt-2">Client: {project.client_name}</p>
        <p className="text-gray-600">Case Type: {project.case_type}</p>
      </div>

      {/* Stage Progress Indicator */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Project Progress</h2>
        <div className="flex items-center justify-between">
          {stages.map((stage, index) => (
            <div key={stage.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  stage.status === 'completed' ? 'bg-green-500 text-white' :
                  stage.status === 'current' ? 'bg-blue-500 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {stage.status === 'completed' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </div>
                <span className={`text-sm mt-2 text-center ${
                  stage.status === 'current' ? 'font-semibold' : ''
                }`}>
                  {stage.name}
                </span>
              </div>
              {index < stages.length - 1 && (
                <div className={`w-16 h-1 mx-2 ${
                  currentStage > index ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Stage Content */}
      <Tabs value={`stage-${currentStage}`} className="w-full">
        <TabsList className="grid grid-cols-6 w-full">
          {stages.map((stage) => (
            <TabsTrigger 
              key={stage.id} 
              value={`stage-${stage.id}`}
              disabled={stage.status === 'upcoming'}
              onClick={() => setCurrentStage(stage.id)}
            >
              {stage.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Stage 0: New Client */}
        <TabsContent value="stage-0">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">New Client - Introduction</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="introduction"
                  checked={introductionComplete}
                  onCheckedChange={handleIntroductionToggle}
                />
                <Label htmlFor="introduction" className="text-lg">
                  Introduction completed
                </Label>
              </div>
              {introductionComplete && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Introduction completed! Moving to Document Preparation.</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Stage 1: Document Preparation */}
        <TabsContent value="stage-1">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Document Preparation - Checklist</h3>
            <div className="space-y-3">
              {documentChecklist.length === 0 ? (
                <div className="text-gray-500 italic">
                  No documents in checklist. Documents will be generated based on case type.
                </div>
              ) : (
                documentChecklist.map((doc) => (
                  <div key={doc.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={doc.id}
                      checked={doc.is_received}
                      onCheckedChange={() => handleDocumentToggle(doc.id)}
                    />
                    <Label htmlFor={doc.id} className="flex-1 cursor-pointer">
                      {doc.document_name}
                    </Label>
                    {doc.is_received && (
                      <Badge variant="default" className="bg-green-500">Collected</Badge>
                    )}
                  </div>
                ))
              )}
              {documentChecklist.length > 0 && documentChecklist.every(d => d.is_received) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>All documents collected! Moving to Submission Review.</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Stage 2: Submission Review */}
        <TabsContent value="stage-2">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Submission Review</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="supervisor-review"
                  checked={reviewedBySupervisor}
                  onCheckedChange={handleReviewComplete}
                />
                <Label htmlFor="supervisor-review" className="text-lg">
                  Reviewed by Supervisor
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ready-submit"
                  checked={readyToSubmit}
                  onCheckedChange={handleReadyToSubmit}
                  disabled={!reviewedBySupervisor}
                />
                <Label htmlFor="ready-submit" className="text-lg">
                  Ready to Submit
                </Label>
              </div>

              {!reviewedBySupervisor && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="w-5 h-5" />
                    <span>Please complete supervisor review before submitting.</span>
                  </div>
                </div>
              )}

              {readyToSubmit && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Ready to submit! Moving to Submission stage.</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Stage 3: Submission */}
        <TabsContent value="stage-3">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Submission Status</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Submission Status</Label>
                <div className="space-y-2">
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer ${
                      submissionStatus === 'on_hold' ? 'bg-yellow-50 border-yellow-500' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSubmissionStatusChange('on_hold')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">On Hold</span>
                      {submissionStatus === 'on_hold' && <CheckCircle2 className="w-5 h-5 text-yellow-600" />}
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer ${
                      submissionStatus === 'compiling' ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSubmissionStatusChange('compiling')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Compiling</span>
                      {submissionStatus === 'compiling' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer ${
                      submissionStatus === 'submitted' ? 'bg-green-50 border-green-500' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSubmissionStatusChange('submitted')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Submitted to DTI</span>
                      {submissionStatus === 'submitted' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    </div>
                  </div>
                </div>
              </div>

              {submissionStatus === 'submitted' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Submitted! Please capture tracking information.</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Stage 4: Tracking */}
        <TabsContent value="stage-4">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Tracking Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="submission-type">Type of Submission *</Label>
                  <Select
                    value={submissionInfo.type_of_submission || ''}
                    onValueChange={(value) => handleSubmissionInfoChange('type_of_submission', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select submission type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="VFS">VFS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="submission-center">Submission Center *</Label>
                  <Input
                    id="submission-center"
                    value={submissionInfo.submission_center}
                    onChange={(e) => handleSubmissionInfoChange('submission_center', e.target.value)}
                    placeholder="Enter submission center"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="submission-date">Date of Submission *</Label>
                  <Input
                    id="submission-date"
                    type="date"
                    value={submissionInfo.date_of_submission}
                    onChange={(e) => handleSubmissionInfoChange('date_of_submission', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visa-ref">Visa Ref *</Label>
                  <Input
                    id="visa-ref"
                    value={submissionInfo.visa_ref}
                    onChange={(e) => handleSubmissionInfoChange('visa_ref', e.target.value)}
                    placeholder="Enter visa reference"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vfs-receipt">VFS Receipt *</Label>
                  <Input
                    id="vfs-receipt"
                    value={submissionInfo.vfs_receipt}
                    onChange={(e) => handleSubmissionInfoChange('vfs_receipt', e.target.value)}
                    placeholder="Enter VFS receipt"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receipt-number">Receipt Number *</Label>
                  <Input
                    id="receipt-number"
                    value={submissionInfo.receipt_number}
                    onChange={(e) => handleSubmissionInfoChange('receipt_number', e.target.value)}
                    placeholder="Enter receipt number"
                  />
                </div>
              </div>

              <Button onClick={handleSaveTrackingInfo} className="w-full">
                Save Tracking Information & Complete
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Stage 5: Completion */}
        <TabsContent value="stage-5">
          <Card className="p-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-green-800">Project Completed!</h3>
              <p className="text-gray-600">
                All stages have been completed successfully for {project.project_name}.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <div className="text-left space-y-2">
                  <p className="font-semibold">Submission Details:</p>
                  <p>Type: {submissionInfo.type_of_submission}</p>
                  <p>Center: {submissionInfo.submission_center}</p>
                  <p>Date: {submissionInfo.date_of_submission}</p>
                  <p>Visa Ref: {submissionInfo.visa_ref}</p>
                  <p>VFS Receipt: {submissionInfo.vfs_receipt}</p>
                  <p>Receipt Number: {submissionInfo.receipt_number}</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
