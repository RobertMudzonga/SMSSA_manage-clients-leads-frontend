import { useState } from 'react';
import { X, Calendar, DollarSign, Tag, MessageSquare } from 'lucide-react';

interface ProspectDetailModalProps {
  prospect: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: any) => void;
  onScheduleFollowUp: (prospectId: string, type: string, date: string) => void;
}

export default function ProspectDetailModal({ 
  prospect, 
  isOpen, 
  onClose, 
  onUpdate,
  onScheduleFollowUp 
}: ProspectDetailModalProps) {
  const [quoteAmount, setQuoteAmount] = useState(prospect?.quote_amount || '');
  const [discountAmount, setDiscountAmount] = useState(prospect?.discount_amount || '');
  const [followUpType, setFollowUpType] = useState('first_follow_up');
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen || !prospect) return null;

  const handleSaveQuote = () => {
    onUpdate(prospect.id, { 
      quote_amount: parseFloat(quoteAmount),
      discount_amount: parseFloat(discountAmount) || 0
    });
  };

  const handleScheduleFollowUp = () => {
    if (followUpDate) {
      onScheduleFollowUp(prospect.id, followUpType, followUpDate);
      setFollowUpDate('');
      setNotes('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{prospect.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quote Management */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Quote Management
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quote Amount
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
                  Discount Amount
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
    </div>
  );
}
