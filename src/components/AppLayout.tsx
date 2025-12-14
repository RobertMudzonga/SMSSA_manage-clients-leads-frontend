import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Sidebar from './Sidebar';
import DashboardView from './DashboardView';
import ProspectsView from './ProspectsView';
import ProjectsView from './ProjectsView';
import DocumentsView from './DocumentsView';
import ClientPortalView from './ClientPortalView';
import { EmployeesView } from './EmployeesView';
import DocumentChecklistView from './DocumentChecklistView';
import TemplateLibraryView from './TemplateLibraryView';
import DatabaseHealthDashboard from './DatabaseHealthDashboard';
import { AnalyticsView } from './AnalyticsView';
import ProjectView from './ProjectView';
import LeadsView from './LeadsView';
import { API_BASE } from '../lib/api';

export default function AppLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [prospects, setProspects] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeesLoadError, setEmployeesLoadError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [selectedProjectForChecklist, setSelectedProjectForChecklist] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = async () => {
    // Fetch prospects from backend API
    try {
      const prospectsResponse = await fetch(`${API_BASE}/prospects`);
      const prospectsData = prospectsResponse.ok ? await prospectsResponse.json() : [];
      setProspects(prospectsData || []);
    } catch (error) {
      console.error('Error fetching prospects:', error);
      setProspects([]);
    }

    const { data: projectsData } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    const { data: documentsData } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    let employeesData = [];
    try {
      const resp = await fetch(`${API_BASE}/employees`);
      if (resp.ok) {
        employeesData = await resp.json();
        setEmployeesLoadError(null);
      } else {
        const text = await resp.text().catch(() => 'Failed to fetch employees');
        const msg = `Employees API returned ${resp.status}: ${text}`;
        console.error(msg);
        setEmployeesLoadError(msg);
        employeesData = [];
      }
    } catch (err) {
      console.error('Error fetching employees from backend:', err);
      setEmployeesLoadError(String(err));
      employeesData = [];
    }
    const { data: metricsData } = await supabase.from('performance_metrics').select('*');
    const { data: goalsData } = await supabase.from('employee_goals').select('*');
    const { data: reviewsData } = await supabase.from('performance_reviews').select('*');
    
    setProjects(projectsData || []);
    setDocuments(documentsData || []);
    setEmployees(employeesData || []);
    setMetrics(metricsData || []);
    setGoals(goalsData || []);
    setReviews(reviewsData || []);
  };

  const handleAddProspect = async (data: any) => {
    try {
      const response = await fetch(`${API_BASE}/prospects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        loadData();
      } else {
        const errorData = await response.json();
        console.error('Error adding prospect:', errorData);
        toast({ title: 'Failed to add prospect', description: errorData.error || 'Unknown error', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error adding prospect:', error);
      toast({ title: 'Failed to add prospect', description: 'Please check your connection.', variant: 'destructive' });
    }
  };

  const handleUpdateProspect = async (id: string, data: any) => {
    try {
      const response = await fetch(`${API_BASE}/prospects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const respJson = await response.json().catch(() => null);
      console.debug('Update prospect response:', response.status, respJson);
      if (response.ok) {
        await loadData();
        return true;
      } else {
        console.error('Failed to update prospect:', respJson);
        toast({ title: 'Failed to update prospect', description: (respJson?.error || respJson?.detail || 'Unknown'), variant: 'destructive' });
        return false;
      }
    } catch (err) {
      console.error('Error updating prospect:', err);
      toast({ title: 'Failed to update prospect', variant: 'destructive' });
      return false;
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!isAdmin) {
      toast({ title: 'Permission denied', description: 'Only admins may delete employees', variant: 'destructive' });
      console.warn('Only admins may delete employees');
      return { error: { message: 'Only admins may delete employees' } };
    }
    try {
      // Prefer soft-delete to avoid direct REST delete edge-cases
      const { data, error } = await supabase.from('employees').update({ is_active: false }).eq('id', id).select();
      if (!error) {
        loadData();
        toast({ title: 'Employee removed' });
        return { ok: true };
      }
      console.error('Failed to delete employee:', error);
      toast({ title: 'Failed to delete employee', description: error?.message || JSON.stringify(error), variant: 'destructive' });
      return { error };
    } catch (err) {
      console.error('Error deleting employee:', err);
      toast({ title: 'Failed to delete employee', description: String(err), variant: 'destructive' });
      return { error: err };
    }
  };

  const handleSetProspectTags = async (id: string, tagIds: number[]) => {
    try {
      const response = await fetch(`${API_BASE}/prospects/${id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_ids: tagIds })
      });
      if (response.ok) loadData();
      else {
        const err = await response.json();
        console.error('Failed to set tags:', err);
        toast({ title: 'Failed to set prospect tags', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Error setting prospect tags:', err);
      toast({ title: 'Failed to set prospect tags', variant: 'destructive' });
    }
  };

  const handleMarkProspectLost = async (id: string, reason = 'Marked lost by user') => {
    try {
      const response = await fetch(`${API_BASE}/prospects/${id}/lost`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (response.ok) {
        toast({ title: 'Prospect marked as lost' });
        await loadData();
        return { ok: true };
      }
      const err = await response.json().catch(() => null);
      console.error('Failed to mark prospect lost:', err);
      toast({ title: 'Failed to mark lost', description: err?.error || 'Unknown', variant: 'destructive' });
      return { error: err };
    } catch (err) {
      console.error('Error marking prospect lost:', err);
      toast({ title: 'Failed to mark lost', description: String(err), variant: 'destructive' });
      return { error: err };
    }
  };

  const handleDeleteProspect = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/prospects/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: 'Prospect deleted' });
        await loadData();
        return { ok: true };
      }
      const err = await response.json().catch(() => null);
      console.error('Failed to delete prospect:', err);
      toast({ title: 'Failed to delete prospect', description: err?.error || 'Unknown', variant: 'destructive' });
      return { error: err };
    } catch (err) {
      console.error('Error deleting prospect:', err);
      toast({ title: 'Failed to delete prospect', description: String(err), variant: 'destructive' });
      return { error: err };
    }
  };

  const handleMoveStage = async (prospectId: string, toStage: string) => {
    try {
      // Map stage strings to stage IDs
      const stageMapping = {
        'opportunity': 1,
        'quote_requested': 2,
        'quote_sent': 3,
        'first_follow_up': 4,
        'second_follow_up': 5,
        'mid_month_follow_up': 6,
        'month_end_follow_up': 7,
        'next_month_follow_up': 8,
        'discount_requested': 9,
        'quote_accepted': 10,
        'engagement_sent': 11,
        'invoice_sent': 12,
        'payment_date_confirmed': 13
      };
      // determine stage id (allow special tokens for won)
      let stage_id = stageMapping[toStage as keyof typeof stageMapping];
      if (!stage_id && (toStage === 'closed_won' || toStage === 'won')) stage_id = 6;
      if (!stage_id) {
        console.error('Invalid stage:', toStage);
        return null;
      }

      const response = await fetch(`${API_BASE}/prospects/${prospectId}/stage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stage_id }),
      });

      const respJson = await response.json().catch(() => null);
      if (response.ok) {
        loadData();
        return respJson;
      } else {
        console.error('Error moving stage:', respJson);
        toast({ title: 'Failed to move stage', description: respJson?.error || 'Unknown error', variant: 'destructive' });
        return respJson;
      }
    } catch (error) {
      console.error('Error moving stage:', error);
      toast({ title: 'Failed to move stage', description: 'Please check your connection.', variant: 'destructive' });
      return null;
    }
  };

  const handleScheduleFollowUp = async (prospectId: string, type: string, date: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.functions.invoke('schedule-follow-up', {
        body: { prospectId, followUpType: type, scheduledDate: date }
      });
      
      loadData();
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
    }
  };

  const handleCreateProject = async (data: any) => {
    const { data: projectData, error } = await supabase
      .from('projects')
      .insert([{ 
        project_name: data.project_name,
        client_name: data.client_name,
        client_email: data.client_email,
        case_type: data.case_type,
        priority: data.priority,
        start_date: data.start_date,
        payment_amount: data.payment_amount,
        client_id: data.client_id,
        status: 'active', 
        progress: 0 
      }])
      .select()
      .single();
    
    if (!error && projectData) {
      await supabase.functions.invoke('generate-document-checklist', {
        body: { 
          projectId: projectData.id, 
          visaType: projectData.case_type,
          clientEmail: projectData.client_email,
          clientName: projectData.client_name
        }
      });
      loadData();
    } else {
      console.error('Error creating project:', error);
      toast({ title: 'Failed to create project', description: (error?.message || 'Unknown error'), variant: 'destructive' });
    }
  };

  const handleUploadDocument = async (data: any) => {
    const { error } = await supabase.from('documents').insert([{ 
      ...data, 
      file_url: 'placeholder-url',
      status: 'pending',
      file_size: 0
    }]);
    if (!error) loadData();
  };

  const handleAddEmployee = async () => {
    // Quick add: prompt for name and email and insert a new employee record
    try {
      const fullName = window.prompt('Employee full name')?.trim();
      if (!fullName) {
        toast({ title: 'Cancelled', description: 'Employee creation cancelled' });
        return;
      }
      const workEmail = window.prompt('Employee work email (e.g. name@immigrationspecialists.co.za)')?.trim();
      if (!workEmail) {
        toast({ title: 'Cancelled', description: 'Employee creation cancelled' });
        return;
      }
      // Basic validation: require company domain
      const allowedDomain = '@immigrationspecialists.co.za';
      if (!workEmail.includes('@') || !workEmail.toLowerCase().endsWith(allowedDomain)) {
        toast({ title: 'Invalid email', description: `Work email must be a ${allowedDomain} address`, variant: 'destructive' });
        return;
      }

      try {
        const resp = await fetch(`${API_BASE}/employees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: fullName, work_email: workEmail, job_position: 'Staff', department: null, manager_id: null })
        });
        const respJson = await resp.json().catch(() => null);
        if (!resp.ok) {
          console.error('Failed to add employee (backend):', respJson);
          toast({ title: 'Failed to add employee', description: respJson?.error || respJson?.message || 'Unknown', variant: 'destructive' });
          return;
        }
        toast({ title: 'Employee added', description: respJson?.full_name || fullName });
        await loadData();
      } catch (err) {
        console.error('Error adding employee via backend:', err);
        toast({ title: 'Failed to add employee', description: String(err), variant: 'destructive' });
      }
    } catch (err) {
      console.error('Error adding employee:', err);
      toast({ title: 'Failed to add employee', description: String(err), variant: 'destructive' });
    }
  };

  const handleCalculateMetrics = async (employeeId: string) => {
    try {
      const today = new Date();
      const periodStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const periodEnd = today.toISOString().split('T')[0];

      await supabase.functions.invoke('calculate-employee-metrics', {
        body: { employeeId, periodStart, periodEnd }
      });
      
      loadData();
    } catch (error) {
      console.error('Error calculating metrics:', error);
    }
  };

  const stats = {
    totalProspects: prospects.length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    pendingDocuments: documents.filter(d => d.status === 'pending').length,
    revenue: projects.reduce((sum, p) => sum + (parseFloat(p.payment_amount) || 0), 0)
  };

  const clientData = {
    name: 'John Doe',
    email: 'john@example.com',
    project: projects[0],
    documents: documents.slice(0, 3),
    activities: [
      { description: 'Document uploaded', created_at: new Date().toISOString() },
      { description: 'Case status updated', created_at: new Date().toISOString() }
    ]
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="md:ml-64 flex-1 p-4 md:p-8">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between mb-4">
          <button onClick={() => setIsSidebarOpen(true)} className="px-3 py-2 bg-white rounded shadow">
            ☰
          </button>
          <h1 className="text-lg font-semibold">ImmigratePro</h1>
          <div />
        </div>

        {/* Desktop header actions */}
        <div className="hidden md:flex items-center justify-end gap-3 mb-4">
          {user ? (
            <>
              <div className="text-sm text-gray-700">{user.email}</div>
              <button onClick={async () => { await logout(); toast({ title: 'Logged out' }); navigate('/login'); }} className="px-3 py-1 bg-white border rounded">Sign out</button>
            </>
          ) : (
            <button onClick={() => navigate('/login')} className="px-3 py-1 bg-white border rounded">Sign in</button>
          )}
        </div>
        {employeesLoadError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded flex items-center justify-between">
            <div>
              <strong>Employees API error:</strong>&nbsp;{employeesLoadError}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEmployeesLoadError(null); loadData(); }} className="px-3 py-1 bg-white border rounded">Retry</button>
            </div>
          </div>
        )}
        {activeTab === 'dashboard' && <DashboardView stats={stats} />}
        {activeTab === 'prospects' && (
          <ProspectsView 
            prospects={prospects} 
            onAddProspect={handleAddProspect} 
            onUpdateProspect={handleUpdateProspect}
            onMoveStage={handleMoveStage}
            onOpenProject={(projectId: string) => { setActiveTab('projects'); setSelectedProjectForChecklist(projectId); }}
            onScheduleFollowUp={handleScheduleFollowUp}
            onDeleteProspect={handleDeleteProspect}
            onMarkProspectLost={handleMarkProspectLost}
            onSetProspectTags={handleSetProspectTags}
          />
        )}

        {activeTab === 'projects' && !selectedProjectForChecklist && (
          <ProjectsView 
            projects={projects} 
            onCreateProject={handleCreateProject} 
            onProjectClick={setSelectedProjectForChecklist}
            onRefresh={loadData}
          />
        )}
        {activeTab === 'projects' && selectedProjectForChecklist && (
          <ProjectView
            projectId={selectedProjectForChecklist}
            onClose={() => setSelectedProjectForChecklist(null)}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeesView 
            employees={employees}
            metrics={metrics}
            goals={goals}
            reviews={reviews}
            onAddEmployee={handleAddEmployee}
            onCalculateMetrics={handleCalculateMetrics}
            onDeleteEmployee={handleDeleteEmployee}
          />
        )}
        {activeTab === 'documents' && <DocumentsView documents={documents} onUploadDocument={handleUploadDocument} onDownload={() => {}} onSign={() => {}} />}
        {activeTab === 'templates' && <TemplateLibraryView />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'client-portal' && <ClientPortalView clientData={clientData} />}
        {activeTab === 'database-health' && <DatabaseHealthDashboard />}
        {activeTab === 'leads' && <LeadsView />}
      </div>
    </div>
  );
}
