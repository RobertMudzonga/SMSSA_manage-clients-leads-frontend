import { useMemo } from 'react';
import PipelineProspectCard from './PipelineProspectCard';

interface PipelineColumnProps {
  stage: string;
  title: string;
  prospects: any[];
  onProspectClick: (prospect: any) => void;
  onMoveStage: (prospectId: string, toStage: string) => void;
}

export default function PipelineColumn({ 
  stage, 
  title, 
  prospects, 
  onProspectClick,
  onMoveStage 
}: PipelineColumnProps) {
  const stageProspects = useMemo(() => 
    prospects.filter(p => p.pipeline_stage === stage),
    [prospects, stage]
  );

  const totalValue = useMemo(() => 
    stageProspects.reduce((sum, p) => sum + (p.quote_amount || 0), 0),
    [stageProspects]
  );

  return (
    <div className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-sm font-medium">
            {stageProspects.length}
          </span>
          {totalValue > 0 && (
            <span className="text-sm text-gray-600">
              ${totalValue.toLocaleString()}
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
        {stageProspects.map(prospect => (
          <PipelineProspectCard
            key={prospect.id}
            prospect={prospect}
            onClick={() => onProspectClick(prospect)}
            onMoveStage={onMoveStage}
            currentStage={stage}
          />
        ))}
      </div>
    </div>
  );
}
