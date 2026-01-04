import React, { useState } from 'react';
import { formatForDateInput } from '@/utils/formatDate';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { X, Calendar, Tag } from 'lucide-react';

interface ProspectDetailModalProps {
  prospect: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: any) => Promise<boolean>;
  onScheduleFollowUp: (prospectId: string, type: string, date: string) => void;
  onDelete?: (id: string) => void;
  onMarkLost?: (id: string, reason?: string) => void;
  onSetTags?: (id: string, tagIds: number[]) => void;
}

export default function ProspectDetailModal({ 
  prospect, 
  isOpen, 
  onClose, 
  onUpdate,
  onScheduleFollowUp,
  onDelete,
  onMarkLost,
  onSetTags
}: ProspectDetailModalProps) {
  const [quoteAmount, setQuoteAmount] = useState(prospect?.quote_amount || '');
  const [discountAmount, setDiscountAmount] = useState(prospect?.discount_amount || '');
  const [followUpType, setFollowUpType] = useState('first_follow_up');
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');
  const [contactName, setContactName] = useState(prospect?.name || '');
  const [dealName, setDealName] = useState(prospect?.deal_name || '');
  const [email, setEmail] = useState(prospect?.email || '');
  const [phone, setPhone] = useState(prospect?.phone || '');
  const [source, setSource] = useState(prospect?.lead_source || prospect?.source || '');
  const [salesperson, setSalesperson] = useState(prospect?.assigned_to || '');
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  const [quoteDate, setQuoteDate] = useState(formatForDateInput(prospect?.quote_sent_date || ''));
  const [dealValue, setDealValue] = useState(prospect?.quote_amount || '');
  const [professionalFees, setProfessionalFees] = useState(prospect?.professional_fees || '');
  const [depositAmount, setDepositAmount] = useState(prospect?.deposit_amount || '');
  const [expectedClosingDate, setExpectedClosingDate] = useState(formatForDateInput(prospect?.expected_closing_date || ''));
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const { toast } = useToast();
  

  // initialize fields when prospect changes
  React.useEffect(() => {
    if (!prospect) return;
    setContactName(prospect?.name || `${prospect?.first_name || ''} ${prospect?.last_name || ''}`.trim());
    setDealName(prospect?.deal_name || '');
    setEmail(prospect?.email || '');
    setPhone(prospect?.phone || '');
    setSource(prospect?.lead_source || prospect?.source || '');
    setSalesperson(prospect?.assigned_to || '');
    setQuoteDate(formatForDateInput(prospect?.quote_sent_date || ''));
    setDealValue(prospect?.quote_amount || '');
    setProfessionalFees(prospect?.professional_fees || '');
    setDepositAmount(prospect?.deposit_amount || '');
    setExpectedClosingDate(formatForDateInput(prospect?.expected_closing_date || ''));
    setNotes(prospect?.notes || '');
    // fetch available tags and selected tags
    (async () => {
      try {
        const tagsResp = await fetch('/api/prospects/tags');
        if (tagsResp.ok) {
          const tagsJson = await tagsResp.json();
          setAvailableTags(tagsJson || []);
        }
        const currentTagsResp = await fetch(`/api/prospects/${prospect.id}/tags`);
        if (currentTagsResp.ok) {
          const cur = await currentTagsResp.json();
          setSelectedTagIds(cur.map((t: any) => t.tag_id));
        }

        // fetch employees for salesperson dropdown
        try {
          const empResp = await fetch('/api/employees');
          if (empResp.ok) {
            const emps = await empResp.json();
            setEmployeesList(emps || []);
            setEmployeesError(null);
          } else {
            const text = await empResp.text().catch(() => 'Failed to fetch employees');
            const msg = `Employees API returned ${empResp.status}: ${text}`;
            console.error(msg);
            setEmployeesError(msg);
            setEmployeesList([]);
          }
        } catch (err) {
          console.error('Error fetching employees for salesperson list:', err);
          setEmployeesError(String(err));
          setEmployeesList([]);
        }

            // No folder/document tasks here; documents are managed in DocumentsView
      } catch (err) {
        console.error('Error fetching tags:', err);
      }
    })();
  }, [prospect]);

  const handleSaveQuote = () => {
    (async () => {
      try {
        const success = await onUpdate(prospect.id, { 
          quote_amount: parseFloat(quoteAmount) || null,
          discount_amount: parseFloat(discountAmount) || 0,
          quote_sent_date: quoteDate || null
        });
        if (success) {
          toast({ title: 'Quote saved' });
        }
      } catch (err) {
        console.error('Error saving quote:', err);
        toast({ title: 'Failed to save quote', variant: 'destructive' });
      }
    })();
  };

  const handleSaveDetails = () => {
    (async () => {
      const [first_name, ...rest] = (contactName || '').trim().split(' ');
      const last_name = rest.join(' ');
      try {
        const success = await onUpdate(prospect.id, {
          deal_name: dealName,
          first_name,
          last_name,
          email,
          phone,
          source,
          assigned_to: salesperson,
          professional_fees: professionalFees || null,
          deposit_amount: depositAmount || null,
          expected_closing_date: expectedClosingDate || null,
          notes
        });
        if (success) {
          toast({ title: 'Details saved' });
        }
      } catch (err) {
        console.error('Error saving details:', err);
        toast({ title: 'Failed to save details', variant: 'destructive' });
      }
    })();
  };

  const handleSetTags = () => {
    if (onSetTags) onSetTags(prospect.id, selectedTagIds);
  };

  const handleMarkLost = () => {
    if (onMarkLost) onMarkLost(prospect.id, 'Marked lost from UI');
  };

  const handleDelete = () => {
    if (onDelete) setConfirmOpen(true);
  };

  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleScheduleFollowUp = () => {
    if (followUpDate) {
      onScheduleFollowUp(prospect.id, followUpType, followUpDate);
      setFollowUpDate('');
      setNotes('');
    }
  };

  // Documents are handled in DocumentsView; remove folder/file UI from prospect modal

  if (!isOpen || !prospect) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-none md:rounded-lg w-full h-full md:w-auto md:max-w-2xl md:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{prospect.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Details */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deal Name</label>
                  <input value={dealName} onChange={e => setDealName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                  <input value={contactName} onChange={e => setContactName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <input value={source} onChange={e => setSource(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salesperson</label>
                  {employeesError && (
                    <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-800 rounded flex items-center justify-between">
                      <div className="text-sm">Unable to load employees: {employeesError}</div>
                      <button onClick={async () => {
                        setEmployeesError(null);
                        try {
                          const r = await fetch('/api/employees');
                          if (r.ok) {
                            setEmployeesList(await r.json());
                            setEmployeesError(null);
                          } else {
                            const t = await r.text().catch(() => 'Failed');
                            setEmployeesError(`Status ${r.status}: ${t}`);
                          }
                        } catch (err) {
                          setEmployeesError(String(err));
                        }
                      }} className="ml-4 px-2 py-1 bg-white border rounded text-sm">Retry</button>
                    </div>
                  )}
                  <select value={String(salesperson || '')} onChange={e => setSalesperson(e.target.value ? Number(e.target.value) : '')} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Unassigned</option>
                  {employeesList.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name} {emp.work_email ? `• ${emp.work_email}` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quote Sent Date</label>
                <input type="date" value={quoteDate} onChange={e => setQuoteDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deal Value</label>
                <input type="number" value={dealValue} onChange={e => setDealValue(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Professional Fees</label>
                <input type="number" value={professionalFees} onChange={e => setProfessionalFees(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Amount</label>
                <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Closing Date</label>
                <input type="date" value={expectedClosingDate} onChange={e => setExpectedClosingDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
              {/* Documents moved to DocumentsView */}
            <div className="mt-4 flex gap-2">
              <button onClick={handleSaveDetails} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Save Details</button>
              <button onClick={handleSetTags} className="px-4 py-2 bg-sky-600 text-white rounded-lg">Save Tags</button>
              <button onClick={handleMarkLost} className="px-4 py-2 bg-yellow-600 text-white rounded-lg">Mark Lost</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>

          {/* Tags */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Tags
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Tags</label>
              <select multiple value={selectedTagIds.map(String)} onChange={(e) => {
                const opts = Array.from(e.target.selectedOptions).map(o => parseInt(o.value, 10));
                setSelectedTagIds(opts);
              }} className="w-full h-36 px-3 py-2 border border-gray-300 rounded-lg">
                {availableTags.map(t => (
                  <option key={t.tag_id} value={t.tag_id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Quote Management */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-sm font-medium">ZAR</span>
              Quote Management
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quote Amount (ZAR)
                </label>
                <input
                  type="number"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Amount (ZAR)
                </label>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                />
              </div>
            </div>
            <button
              onClick={handleSaveQuote}
              className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Save Quote
            </button>
          </div>

          {/* Follow-up Scheduling */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Schedule Follow-up
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Follow-up Type
                </label>
                <select
                  value={followUpType}
                  onChange={(e) => setFollowUpType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="first_follow_up">First Follow-up</option>
                  <option value="second_follow_up">Second Follow-up</option>
                  <option value="mid_month_follow_up">Mid-Month Follow-up</option>
                  <option value="month_end_follow_up">Month-End Follow-up</option>
                  <option value="next_month_follow_up">Next Month Follow-up</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <button
                onClick={handleScheduleFollowUp}
                className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Schedule Follow-up
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Delete confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm delete</DialogTitle>
            <DialogDescription>Are you sure you want to delete this prospect? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1 rounded bg-gray-100" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={async () => {
                try {
                  const res = await onDelete?.(prospect.id as string);
                  if (res && res.error) {
                    console.error('Failed to delete prospect', res.error);
                    toast({ title: 'Delete failed', description: res.error.message || JSON.stringify(res.error), variant: 'destructive' });
                    return;
                  }
                  toast({ title: 'Prospect deleted' });
                  setConfirmOpen(false);
                  onClose();
                } catch (err) {
                  console.error('Failed to delete prospect', err);
                  toast({ title: 'Delete failed', description: String(err), variant: 'destructive' });
                }
              }}>Delete</button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
