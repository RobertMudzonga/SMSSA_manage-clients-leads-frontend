import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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





export default function AppLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [prospects, setProspects] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [selectedProjectForChecklist, setSelectedProjectForChecklist] = useState<string | null>(null);



  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: prospectsData } = await supabase.from('prospects').select('*').order('created_at', { ascending: false });
    const { data: projectsData } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    const { data: documentsData } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    const { data: employeesData } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
    const { data: metricsData } = await supabase.from('performance_metrics').select('*');
    const { data: goalsData } = await supabase.from('employee_goals').select('*');
    const { data: reviewsData } = await supabase.from('performance_reviews').select('*');
    
    setProspects(prospectsData || []);
    setProjects(projectsData || []);
    setDocuments(documentsData || []);
    setEmployees(employeesData || []);
    setMetrics(metricsData || []);
    setGoals(goalsData || []);
    setReviews(reviewsData || []);
  };


  const handleAddProspect = async (data: any) => {
    const { error } = await supabase.from('prospects').insert([{ 
      ...data, 
      status: 'prospect',
      pipeline_stage: 'opportunity'
    }]);
    if (!error) loadData();
  };

  const handleUpdateProspect = async (id: string, data: any) => {
    const { error } = await supabase.from('prospects').update(data).eq('id', id);
    if (!error) loadData();
  };

  const handleMoveStage = async (prospectId: string, toStage: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.functions.invoke('move-prospect-stage', {
        body: { prospectId, toStage, notes: `Moved to ${toStage}` }
      });
      
      loadData();
    } catch (error) {
      console.error('Error moving stage:', error);
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
      alert('Failed to create project: ' + (error?.message || 'Unknown error'));
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
    // Placeholder for adding employee
    console.log('Add employee clicked');
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
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="ml-64 flex-1 p-8">
        {activeTab === 'dashboard' && <DashboardView stats={stats} />}
        {activeTab === 'prospects' && (
          <ProspectsView 
            prospects={prospects} 
            onAddProspect={handleAddProspect} 
            onUpdateProspect={handleUpdateProspect}
            onMoveStage={handleMoveStage}
            onScheduleFollowUp={handleScheduleFollowUp}
          />
        )}

        {activeTab === 'projects' && !selectedProjectForChecklist && (
          <ProjectsView 
            projects={projects} 
            onCreateProject={handleCreateProject} 
            onProjectClick={setSelectedProjectForChecklist} 
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
          />
        )}
        {activeTab === 'documents' && <DocumentsView documents={documents} onUploadDocument={handleUploadDocument} onDownload={() => {}} onSign={() => {}} />}
        {activeTab === 'templates' && <TemplateLibraryView />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'client-portal' && <ClientPortalView clientData={clientData} />}
        {activeTab === 'database-health' && <DatabaseHealthDashboard />}



      </div>
    </div>
  );
}
