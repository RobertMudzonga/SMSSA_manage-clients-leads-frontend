import StatusBadge from './StatusBadge';
import { visaTimelines } from '@/utils/visaTimelines';
import { calculateExpectedDates, isProjectBehindSchedule } from '@/utils/progressCalculations';
import { Calendar, AlertCircle, FileCheck, Link2, Copy } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';


interface ProjectCardProps {
  project: any;
  onClick: () => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const [generatingAccess, setGeneratingAccess] = useState(false);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);

  const priorityColor = {
    high: 'text-red-600',
    medium: 'text-yellow-600',
    low: 'text-green-600'
  }[project.priority] || 'text-gray-600';

  const timeline = visaTimelines[project.case_type || project.project_type];
  const isBehind = isProjectBehindSchedule(project);
  const expectedDates = project.start_date ? calculateExpectedDates(project.case_type || project.project_type, new Date(project.start_date)) : null;
  
  const handleGenerateAccess = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setGeneratingAccess(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-client-access', {
        body: {
          projectId: project.id,
          clientEmail: project.client_email,
          expiryDays: 90
        }
      });
      
      if (error) throw error;
      setPortalUrl(data.portalUrl);
      
      // Copy to clipboard
      navigator.clipboard.writeText(data.portalUrl);
      alert('Client portal link copied to clipboard!');
    } catch (error) {
      console.error('Error generating access:', error);
      alert('Failed to generate client portal access');
    } finally {
      setGeneratingAccess(false);
    }
  };

  
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer ${isBehind ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
    >
      {isBehind && (
        <div className="flex items-center gap-1 text-red-600 text-xs font-medium mb-2">
          <AlertCircle className="w-3 h-3" />
          <span>Behind Schedule</span>
        </div>
      )}
      
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{project.project_name}</h3>
          <p className="text-sm text-gray-600">{project.case_type || project.project_type}</p>
        </div>
        <StatusBadge status={project.status} type="project" />
      </div>

      {expectedDates && (
        <div className="flex items-center gap-1 text-xs text-gray-600 mb-3">
          <Calendar className="w-3 h-3" />
          <span>Expected: {expectedDates.expectedCompletion.toLocaleDateString()}</span>
        </div>
      )}
      
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-teal-500 h-2 rounded-full transition-all"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {timeline && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Compilation:</span>
            <span className="text-gray-700 font-medium">{timeline.compilation}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Processing:</span>
            <span className="text-gray-700 font-medium">{timeline.processing}</span>
          </div>
        </div>
      )}
      
      <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <p className={`text-xs font-medium ${priorityColor}`}>
            {project.priority.toUpperCase()} PRIORITY
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-1 text-xs h-7 flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <FileCheck className="w-3 h-3" />
            Checklist
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-1 text-xs h-7 flex-1"
            onClick={handleGenerateAccess}
            disabled={generatingAccess}
          >
            <Link2 className="w-3 h-3" />
            {generatingAccess ? 'Generating...' : 'Client Portal'}
          </Button>
        </div>
      </div>

    </div>
  );
}
