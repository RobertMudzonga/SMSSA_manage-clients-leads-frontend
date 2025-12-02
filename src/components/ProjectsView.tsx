import { useState } from 'react';
import ProjectCard from './ProjectCard';
import CreateProjectModal from './CreateProjectModal';
import GanttChart from './GanttChart';
import ProjectAlerts from './ProjectAlerts';
import { LayoutGrid, BarChart3 } from 'lucide-react';

interface ProjectsViewProps {
  projects: any[];
  onCreateProject: (data: any) => void;
  onProjectClick: (projectId: string) => void;
}

export default function ProjectsView({ projects, onCreateProject, onProjectClick }: ProjectsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'gantt'>('grid');


  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.project_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded flex items-center gap-2 ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-sm">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-2 rounded flex items-center gap-2 ${viewMode === 'gantt' ? 'bg-white shadow' : ''}`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">Timeline</span>
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Create Project
          </button>
        </div>
      </div>

      <ProjectAlerts projects={projects} />

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map(project => (
            <ProjectCard 
              key={project.id} 
              project={project}
              onClick={() => onProjectClick(project.id)}
            />
          ))}
        </div>
      ) : (
        <GanttChart projects={filteredProjects} />
      )}


      <CreateProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => {
          onCreateProject(data);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
