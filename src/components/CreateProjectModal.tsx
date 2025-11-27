import { useState } from 'react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  clientId?: string;
}

export default function CreateProjectModal({ isOpen, onClose, onSubmit, clientId }: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    project_name: '',
    client_name: '',
    client_email: '',
    case_type: 'Work Visa',
    priority: 'medium',
    start_date: '',
    payment_amount: ''
  });


  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, client_id: clientId });
    setFormData({ project_name: '', client_name: '', client_email: '', case_type: 'Work Visa', priority: 'medium', start_date: '', payment_amount: '' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Create New Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Project Name"
            value={formData.project_name}
            onChange={(e) => setFormData({...formData, project_name: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          <input
            type="text"
            placeholder="Client Name"
            value={formData.client_name}
            onChange={(e) => setFormData({...formData, client_name: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          <input
            type="email"
            placeholder="Client Email"
            value={formData.client_email}
            onChange={(e) => setFormData({...formData, client_email: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          <input
            type="date"
            placeholder="Start Date"
            value={formData.start_date}
            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            type="number"
            placeholder="Payment Amount"
            value={formData.payment_amount}
            onChange={(e) => setFormData({...formData, payment_amount: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          />

          <select
            value={formData.case_type}
            onChange={(e) => setFormData({...formData, case_type: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option>Visitors Visa 11(1)</option>
            <option>Visitors Visa Extension</option>
            <option>Critical Skills Work Visa</option>
            <option>Critical Skills Visa - Zim Submission</option>
            <option>Accompanying Dependent (Spouse)</option>
            <option>Spouse Visa</option>
            <option>General Work Visa</option>
            <option>Waiver Application</option>
            <option>Visitor's Visa Section 11(1)</option>
            <option>Visitor's Visa Section 11(1)(b)(ii)</option>
            <option>Visitor's Visa Section 11(1)(b)(iii)</option>
            <option>Visitor's Visa Section 11(1)(b)(iv)</option>
            <option>Visitor's Visa Section 11(2)</option>
            <option>Relatives Visa</option>
            <option>Study Visa</option>
            <option>Retired Person Visa</option>
            <option>Business Visa</option>
            <option>Appeal i.t.o. section 8(4) & 8(6)</option>
            <option>Permanent Residence Permit</option>
            <option>Overstay Appeal</option>
            <option>Legalisation (Good Cause)</option>
            <option>Prohibition Upliftment</option>

          </select>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({...formData, priority: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}
