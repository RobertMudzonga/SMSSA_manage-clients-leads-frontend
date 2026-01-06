import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import PipelineColumn from './PipelineColumn';
import PipelineStats from './PipelineStats';
import AddProspectModal from './AddProspectModal';
import ProspectDetailModal from './ProspectDetailModal';
import { LayoutGrid, List } from 'lucide-react';

interface ProspectsViewProps {
  prospects: any[];
  onAddProspect: (data: any) => void;
  onUpdateProspect: (id: string, data: any) => Promise<boolean>;
  onMoveStage: (prospectId: string, toStage: string) => Promise<any>;
  onScheduleFollowUp: (prospectId: string, type: string, date: string) => void;
  onDeleteProspect?: (id: string) => void;
  onMarkProspectLost?: (id: string, reason?: string) => void;
  onSetProspectTags?: (id: string, tagIds: number[]) => void;
  onOpenProject?: (projectId: string) => void;
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
  { key: 'invoice_sent', label: 'Invoice Sent' },
  { key: 'payment_date_confirmed', label: 'Payment Date Confirmed' },
  { key: 'won', label: 'Won' }
];

export default function ProspectsView({ 
  prospects, 
  onAddProspect, 
  onUpdateProspect,
  onMoveStage,
  onOpenProject,
  onScheduleFollowUp,
  onDeleteProspect,
  onMarkProspectLost,
  onSetProspectTags
}: ProspectsViewProps) {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline');
  const [autoMode, setAutoMode] = useState(true); // if true, auto-switch based on viewport width
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importPreviewRows, setImportPreviewRows] = useState<any[]>([]);
  const [importingFile, setImportingFile] = useState<File | null>(null);

  function exportToCsv(filename: string, rows: any[]) {
    if (!rows || rows.length === 0) {
      toast({ title: 'No data to export' });
      return;
    }
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(',')].concat(rows.map(r => keys.map(k => `"${(r[k] ?? '').toString().replace(/"/g,'""')}"`).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  useEffect(() => {
    // decide initial mode based on viewport width
    const applyMode = () => {
      if (!autoMode) return;
      const w = window.innerWidth;
      // treat widths < 768px as mobile -> list view
      setViewMode(w < 768 ? 'list' : 'pipeline');
    };
    applyMode();
    const onResize = () => applyMode();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [autoMode]);

  // Wrapper to handle confirmation + toast when marking won
  const [confirmWonOpen, setConfirmWonOpen] = useState(false);
  const [confirmingProspectId, setConfirmingProspectId] = useState<string | null>(null);

  const openConfirmWon = (prospectId: string) => {
    setConfirmingProspectId(prospectId);
    setConfirmWonOpen(true);
  };

  const performMarkWon = async () => {
    const prospectId = confirmingProspectId;
    setConfirmWonOpen(false);
    setConfirmingProspectId(null);
    if (!prospectId) return;
    try {
      const result = await onMoveStage(prospectId, 'closed_won');
      if (result && result.autoCreatedProject) {
        const ap = result.autoCreatedProject;
        if (typeof onOpenProject === 'function' && ap.projectId) {
          toast({
            title: 'Project created',
            description: `Project ID: ${ap.projectId} • ${ap.folderName || 'Folder created'}`,
            action: (
              <button
                onClick={() => onOpenProject(String(ap.projectId))}
                className="px-3 py-1 bg-white text-sm rounded"
              >
                Open project
              </button>
            ),
          });
          return;
        }
        toast({ title: 'Project created', description: `Project ID: ${ap.projectId} • ${ap.folderName || 'Folder created'}` });
      } else {
        toast({ title: 'Prospect marked as won.' });
      }
    } catch (err) {
      console.error('Error marking won:', err);
      toast({ title: 'Failed to mark prospect as won', variant: 'destructive' });
    }
  };

  const wrappedMoveStage = async (prospectId: string, toStage: string) => {
    if (toStage === 'closed_won' || toStage === 'won') {
      await performMarkWon(prospectId);
    } else {
      await onMoveStage(prospectId, toStage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Sales Pipeline</h2>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setViewMode('pipeline'); setAutoMode(false); }}
              className={`px-3 py-1 rounded ${viewMode === 'pipeline' ? 'bg-white shadow' : ''}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setViewMode('list'); setAutoMode(false); }}
              className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportToCsv('prospects.csv', prospects)}
              className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Export
            </button>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setImportingFile(f);
                // First perform a dry-run to preview mapping
                const fd = new FormData();
                fd.append('file', f);
                fd.append('target', 'prospects');
                fd.append('dryRun', 'true');
                try {
                  const res = await fetch('/api/import', { method: 'POST', body: fd });
                  let json;
                  const ct = res.headers.get('content-type') || '';
                  if (ct.includes('application/json')) {
                    json = await res.json();
                  } else {
                    const txt = await res.text();
                    try { json = JSON.parse(txt); } catch { json = { error: txt }; }
                  }
                  if (res.ok && json && json.result && json.result.mappedRows) {
                    // pick the first sheet key
                    const sheetKeys = Object.keys(json.result.mappedRows);
                    if (sheetKeys.length > 0) {
                      const mapped = json.result.mappedRows[sheetKeys[0]].prospects || [];
                      setImportPreviewRows(mapped || []);
                      setImportPreviewOpen(true);
                    } else {
                      toast({ title: 'No mapped rows returned', variant: 'destructive' });
                    }
                  } else {
                    toast({ title: 'Dry-run failed', description: json.error || 'Server error', variant: 'destructive' });
                  }
                } catch (err) {
                  console.error(err);
                  toast({ title: 'Dry-run failed', variant: 'destructive' });
                }
                (e.target as HTMLInputElement).value = '';
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Import
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Add Prospect
            </button>
          </div>
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
                onMoveStage={wrappedMoveStage}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prospects.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" onClick={() => setSelectedProspect(p)}>{p.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" onClick={() => setSelectedProspect(p)}>
                      {PIPELINE_STAGES.find(s => s.key === p.pipeline_stage)?.label}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" onClick={() => setSelectedProspect(p)}>
                      {p.quote_amount ? `R${Number(p.quote_amount).toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        <button onClick={() => openConfirmWon(p.id)} className="px-3 py-1 bg-green-600 text-white rounded text-xs">Mark Won</button>
                        <button onClick={() => setSelectedProspect(p)} className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs">Details</button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <AddProspectModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={onAddProspect}
      />

      <ProspectDetailModal
        prospect={selectedProspect}
        isOpen={!!selectedProspect}
        onClose={() => setSelectedProspect(null)}
        onUpdate={onUpdateProspect}
        onScheduleFollowUp={onScheduleFollowUp}
        onDelete={onDeleteProspect}
        onMarkLost={onMarkProspectLost}
        onSetTags={onSetProspectTags}
      />

      <Dialog open={confirmWonOpen} onOpenChange={setConfirmWonOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm</DialogTitle>
            <DialogDescription>Mark this prospect as WON and convert to a project?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1 rounded bg-gray-100" onClick={() => setConfirmWonOpen(false)}>Cancel</button>
              <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={performMarkWon}>Mark Won</button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={importPreviewOpen} onOpenChange={setImportPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import Preview</DialogTitle>
            <DialogDescription>Preview of mapped rows (first 50). Confirm to run actual import.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-80 overflow-auto">
            {importPreviewRows.length === 0 ? (
              <div className="text-sm text-gray-600">No rows to preview.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    {Object.keys(importPreviewRows[0]).map(k => (
                      <th key={k} className="px-2 py-1 text-left font-medium text-gray-600">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importPreviewRows.slice(0,50).map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {Object.keys(importPreviewRows[0]).map(k => (
                        <td key={k} className="px-2 py-1">{String(r[k] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <DialogFooter>
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1 rounded bg-gray-100" onClick={() => { setImportPreviewOpen(false); setImportPreviewRows([]); setImportingFile(null); }}>Cancel</button>
              <button className="px-3 py-1 rounded bg-teal-600 text-white" onClick={async () => {
                if (!importingFile) return;
                const fd = new FormData();
                fd.append('file', importingFile);
                fd.append('target', 'prospects');
                try {
                  const res = await fetch('/api/import', { method: 'POST', body: fd });
                  let json;
                  const ct = res.headers.get('content-type') || '';
                  if (ct.includes('application/json')) {
                    json = await res.json();
                  } else {
                    const txt = await res.text();
                    try { json = JSON.parse(txt); } catch { json = { error: txt }; }
                  }
                  if (res.ok) {
                    toast({ title: 'Import complete', description: JSON.stringify(json.result) });
                    setImportPreviewOpen(false);
                    setImportPreviewRows([]);
                    setImportingFile(null);
                  } else {
                    toast({ title: 'Import failed', description: json.error || 'Server error', variant: 'destructive' });
                  }
                } catch (err) {
                  console.error(err);
                  toast({ title: 'Import failed', variant: 'destructive' });
                }
              }}>Confirm Import</button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
