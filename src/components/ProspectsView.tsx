import { useState } from 'react';
import PipelineColumn from './PipelineColumn';
import PipelineStats from './PipelineStats';
import AddProspectModal from './AddProspectModal';
import ProspectDetailModal from './ProspectDetailModal';
import { LayoutGrid, List } from 'lucide-react';

interface ProspectsViewProps {
  prospects: any[];
  onAddProspect: (data: any) => void;
  onUpdateProspect: (id: string, data: any) => void;
  onMoveStage: (prospectId: string, toStage: string) => void;
  onScheduleFollowUp: (prospectId: string, type: string, date: string) => void;
}

const PIPELINE_STAGES = [
  { key: 'opportunity', label: 'Opportunity' },
  { key: 'quote_requested', label: 'Quote Requested' },
  { key: 'quote_sent', label: 'Quote Sent' },
  { key: 'first_follow_up', label: 'First Follow-up' },
  { key: 'second_follow_up', label: 'Second Follow-up' },
  { key: 'mid_month_follow_up', label: 'Mid-Month' },
  { key: 'month_end_follow_up', label: 'Month-End' },
  { key: 'next_month_follow_up', label: 'Next Month' },
  { key: 'discount_requested', label: 'Discount Requested' },
  { key: 'quote_accepted', label: 'Quote Accepted' },
  { key: 'engagement_sent', label: 'Engagement Sent' },
  { key: 'invoice_sent', label: 'Invoice Sent' }
];

export default function ProspectsView({ 
  prospects, 
  onAddProspect, 
  onUpdateProspect,
  onMoveStage,
  onScheduleFollowUp 
}: ProspectsViewProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Sales Pipeline</h2>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-3 py-1 rounded ${viewMode === 'pipeline' ? 'bg-white shadow' : ''}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Add Prospect
          </button>
        </div>
      </div>

      <PipelineStats prospects={prospects} />

      {viewMode === 'pipeline' ? (

        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {PIPELINE_STAGES.map(stage => (
              <PipelineColumn
                key={stage.key}
                stage={stage.key}
                title={stage.label}
                prospects={prospects}
                onProspectClick={setSelectedProspect}
                onMoveStage={onMoveStage}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quote</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prospects.map(p => (
                <tr key={p.id} onClick={() => setSelectedProspect(p)} className="cursor-pointer hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {PIPELINE_STAGES.find(s => s.key === p.pipeline_stage)?.label}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {p.quote_amount ? `$${p.quote_amount.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.lead_source || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddProspectModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={(data) => {
          onAddProspect(data);
          setIsAddModalOpen(false);
        }}
      />

      <ProspectDetailModal
        prospect={selectedProspect}
        isOpen={!!selectedProspect}
        onClose={() => setSelectedProspect(null)}
        onUpdate={onUpdateProspect}
        onScheduleFollowUp={onScheduleFollowUp}
      />
    </div>
  );
}
