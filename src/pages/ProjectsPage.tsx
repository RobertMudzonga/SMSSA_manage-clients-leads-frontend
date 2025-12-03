import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ProjectsView from '@/components/ProjectsView';
import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  project_name: string;
  client_name: string;
  client_email: string;
  case_type: string;
  priority: string;
  start_date: string;
  payment_amount: number;
  client_id: string;
  status: string;
  progress: number;
  created_at?: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    setProjects(data || []);
  };

  const handleCreateProject = async (data: Partial<Project>) => {
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
      loadProjects();
    }
  };

  const handleProjectClick = (project: Project) => {
    navigate(`/dashboard/projects/${project.id}`);
  };

  return (
    <ProjectsView 
      projects={projects} 
      onCreateProject={handleCreateProject} 
      onProjectClick={handleProjectClick} 
    />
  );
}
