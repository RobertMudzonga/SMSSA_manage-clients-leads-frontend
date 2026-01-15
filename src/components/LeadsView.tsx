import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PhoneCall, Mail, UserCheck, RefreshCw, AlertTriangle, Loader } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import LeadDetailModal from './LeadDetailModal';

import { API_BASE } from '../lib/api';

// --- STAGE DEFINITION FOR COLD LEADS ---
// NOTE: These IDs are temporary client-side IDs for this component, 
// they map to the stages defined below.
const COLD_LEAD_STAGES = [
    { id: 101, name: "First Contact", icon: PhoneCall, targetStageId: 1 },
    { id: 102, name: "Second Contact", icon: Mail, targetStageId: 1 },
    { id: 103, name: "Third Contact", icon: UserCheck, targetStageId: 1 },
    { id: 104, name: "Convert to Opportunity", icon: UserCheck, targetStageId: 1, isConversionStage: true }, 
    // The targetStageId (1) is the ID for "Opportunity" in the PROSPECT board.
];

// --- Helper Components for Toast (Reusing logic from LeadsKanbanApp) ---

const Toast = ({ message, type, onClose }) => {
    const baseClasses = "fixed bottom-5 right-5 p-4 rounded-lg shadow-xl text-white flex items-center space-x-3 z-50 transition-transform duration-300";
    let colorClasses = '';
    let Icon = UserCheck;

    switch (type) {
        case 'success':
            colorClasses = 'bg-green-600';
            Icon = UserCheck;
            break;
        case 'error':
            colorClasses = 'bg-red-600';
            Icon = AlertTriangle;
            break;
        default:
            colorClasses = 'bg-gray-600';
            Icon = Loader;
    }

    return (
        <div className={`${baseClasses} ${colorClasses}`} role="alert">
            <Icon className="w-5 h-5" />
            <p className="text-sm font-medium">{message}</p>
            <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-all">
                <Mail className="w-4 h-4" />
            </button>
        </div>
    );
};


/**
 * Cold Lead Card Component (Draggable)
 */
const ColdLeadCard = ({ lead, onDragStart, onAdvanceStage, onClick }) => {
    return (
        <Card 
            className="p-4 mb-4 cursor-pointer transition-shadow duration-200 hover:shadow-2xl border border-gray-200"
            onClick={onClick}
        >
            <h3 className="font-semibold text-gray-800 text-lg leading-tight">
                {lead.first_name} {lead.last_name}
            </h3>
            <p className="text-sm text-gray-500 mb-2 truncate">{lead.company}</p>
            <p className="text-xs text-teal-600">{lead.email}</p>
            <Progress value={((lead.current_stage_id - 101) / 3) * 100} className="my-2" />
            <Button 
                onClick={(e) => {
                    e.stopPropagation();
                    onAdvanceStage();
                }} 
                disabled={lead.current_stage_id === 104}
                className="w-full"
            >
                {lead.current_stage_id === 104 ? 'Converted' : 'Advance Stage'}
            </Button>
        </Card>
    );
};

/**
 * Main Cold Leads Kanban App Component
 */
export default function ColdLeadsKanbanApp() {
    const [leads, setLeads] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [draggedLead, setDraggedLead] = useState(null);
    const [selectedLead, setSelectedLead] = useState(null);
    const [filterEmployeeId, setFilterEmployeeId] = useState('');

    // --- Helper to show toasts ---
    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    }, []);

    // --- Data Fetching ---
    const fetchLeads = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const url = new URL(`${API_BASE}/leads`);
            if (filterEmployeeId) {
                url.searchParams.append('assigned_employee_id', filterEmployeeId);
            }
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error('Failed to fetch leads');
            }
            const data = await response.json();
            setLeads(data);
        } catch (err) {
            setError(err.message);
            setLeads([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchEmployees = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/employees`);
            if (response.ok) {
                const data = await response.json();
                setEmployees(data);
            }
        } catch (err) {
            console.error('Error fetching employees:', err);
        }
    }, []);

    useEffect(() => {
        fetchLeads();
        fetchEmployees();
    }, [fetchLeads, fetchEmployees, filterEmployeeId]);

    // --- Data Grouping ---
    const leadsByStage = useMemo(() => {
        return COLD_LEAD_STAGES.reduce((acc, stage) => {
            acc[stage.id] = leads.filter(lead => lead.current_stage_id === stage.id);
            return acc;
        }, {});
    }, [leads]);

    // --- D&D Handlers ---
    const handleDragStart = (e, lead) => {
        setDraggedLead(lead);
        e.dataTransfer.setData("leadId", lead.lead_id);
    };

    const handleDragOver = (e) => {
        e.preventDefault(); 
    };

    const handleDrop = async (e, newStageId) => {
        e.preventDefault();
        const leadId = parseInt(e.dataTransfer.getData("leadId"));
        const lead = leads.find(l => l.lead_id === leadId);

        if (!lead || lead.current_stage_id === newStageId) {
            setDraggedLead(null);
            return;
        }
        
        const newStage = COLD_LEAD_STAGES.find(s => s.id === newStageId);

        // 1. Conversion Logic: Move to Stage 4 (Convert to Opportunity)
        if (newStage.isConversionStage) {
            await convertLeadToOpportunity(leadId);
        } else {
            // 2. Standard Cold Lead Stage Update (101-103)
            // This is a local UI update only, as we don't track these transient stages in the DB.
            setLeads(prevLeads =>
                prevLeads.map(l => (l.lead_id === leadId ? { ...l, current_stage_id: newStageId } : l))
            );
            showToast(`Lead moved to ${newStage.name}`, 'success');
        }
        
        setDraggedLead(null);
    };
    
    // --- API & State Update Logic ---

    const convertLeadToOpportunity = useCallback(async (leadId) => {
        const targetOpportunityStageId = 1; // Stage ID for "Opportunity" in the Prospect pipeline
        
        // Optimistic UI Update: Remove from Cold Leads board immediately
        const originalLeads = leads;
        setLeads(prevLeads => prevLeads.filter(l => l.lead_id !== leadId));

        try {
            // Call the same PATCH endpoint used in the Prospect board, but with targetStageId = 1
            const response = await fetch(`${API_BASE}/leads/${leadId}/stage`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stage_id: targetOpportunityStageId }),
            });

            if (!response.ok) {
                // If API fails, revert the UI state and display error
                setLeads(originalLeads); 
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to convert lead: ${response.status}`);
            }

            showToast(`Lead ID ${leadId} converted to Opportunity and moved to Prospect pipeline!`, 'success');

        } catch (err) {
            console.error("Conversion Error:", err);
            setError(`Could not convert lead: ${err.message}. Lead returned to Cold Leads board.`);
            // Revert state on failure
            setLeads(originalLeads); 
            showToast('Conversion failed. Lead returned.', 'error');
        }
    }, [leads, showToast]);

    const advanceStage = async (leadId) => {
        const lead = leads.find((l) => l.lead_id === leadId);
        if (!lead) return;

        const currentStageIndex = COLD_LEAD_STAGES.findIndex(s => s.id === lead.current_stage_id);
        if (currentStageIndex < COLD_LEAD_STAGES.length - 1) {
            const newStage = COLD_LEAD_STAGES[currentStageIndex + 1];

            try {
                const response = await fetch(`${API_BASE}/leads/${leadId}/stage`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stage_id: newStage.id }),
                });

                if (!response.ok) {
                    throw new Error('Failed to update lead stage');
                }

                setLeads((prevLeads) =>
                    prevLeads.map((l) => (l.lead_id === leadId ? { ...l, current_stage_id: newStage.id } : l))
                );
            } catch (err) {
                setError(err.message);
            }
        } else {
            await convertLeadToOpportunity(leadId);
        }
    };

    // --- Lead Detail Modal Handlers ---
    const handleAddComment = async (leadId, comment) => {
        try {
            const lead = leads.find(l => l.lead_id === leadId);
            const newNote = `${lead.notes || ''}\n[${new Date().toLocaleString()}] ${comment}`;
            
            const response = await fetch(`${API_BASE}/leads/${leadId}/comment`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment }),
            });

            if (!response.ok) {
                throw new Error('Failed to add comment');
            }

            setLeads(prevLeads =>
                prevLeads.map(l => l.lead_id === leadId ? { ...l, notes: newNote } : l)
            );
            showToast('Comment added successfully', 'success');
        } catch (err) {
            console.error('Error adding comment:', err);
            showToast('Failed to add comment', 'error');
        }
    };

    const handleMarkLost = async (leadId, reason) => {
        try {
            const response = await fetch(`${API_BASE}/leads/${leadId}/lost`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason }),
            });

            if (!response.ok) {
                throw new Error('Failed to mark lead as lost');
            }

            setLeads(prevLeads => prevLeads.filter(l => l.lead_id !== leadId));
            showToast('Lead marked as lost and archived', 'success');
        } catch (err) {
            console.error('Error marking lead as lost:', err);
            showToast('Failed to mark lead as lost', 'error');
        }
    };

    const handleDeleteLead = async (leadId) => {
        try {
            const response = await fetch(`${API_BASE}/leads/${leadId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete lead');
            }

            setLeads(prevLeads => prevLeads.filter(l => l.lead_id !== leadId));
            showToast('Lead deleted successfully', 'success');
        } catch (err) {
            console.error('Error deleting lead:', err);
            showToast('Failed to delete lead', 'error');
        }
    };

    const handleAssignEmployee = async (leadId, employeeId) => {
        try {
            const response = await fetch(`${API_BASE}/leads/${leadId}/assign`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employee_id: employeeId }),
            });

            if (!response.ok) {
                throw new Error('Failed to assign lead');
            }

            const result = await response.json();
            
            // Update the lead in state with new assignment info
            setLeads(prevLeads =>
                prevLeads.map(l => 
                    l.lead_id === leadId 
                        ? { ...l, assigned_employee_id: employeeId, assigned_to_name: result.assigned_to } 
                        : l
                )
            );
            
            // Also update selected lead if it's the one we just assigned
            if (selectedLead && selectedLead.lead_id === leadId) {
                setSelectedLead({ ...selectedLead, assigned_employee_id: employeeId, assigned_to_name: result.assigned_to });
            }
            
            showToast(`Lead assigned to ${result.assigned_to}`, 'success');
        } catch (err) {
            console.error('Error assigning lead:', err);
            showToast('Failed to assign lead', 'error');
        }
    };

    // --- Loading and Error States ---
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <Loader className="w-8 h-8 animate-spin text-teal-600 mr-3" />
                <p className="text-xl text-gray-700">Loading Cold Leads...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-red-50 border-l-4 border-red-500 text-red-700 max-w-lg mx-auto mt-20 rounded-lg shadow-lg">
                <h3 className="font-bold text-lg">Connection Error</h3>
                <p>{error}</p>
                <button onClick={fetchLeads} className="mt-4 flex items-center text-sm font-medium text-teal-600 hover:text-teal-800">
                    <RefreshCw className="w-4 h-4 mr-1" /> Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            {/* Header */}
            <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-3xl font-extrabold text-gray-900">Cold Lead Management (Contact Funnel)</h1>
                <div className="flex items-center gap-3">
                    <select
                        value={filterEmployeeId}
                        onChange={(e) => setFilterEmployeeId(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    >
                        <option value="">All Assignees</option>
                        <option value="unassigned">Unassigned</option>
                        {employees.filter(emp => emp.is_active).map((employee) => (
                            <option key={employee.id} value={employee.id}>
                                {employee.full_name}
                            </option>
                        ))}
                    </select>
                    <button 
                        onClick={fetchLeads} 
                        className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg shadow-md hover:bg-teal-700 transition"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span className="text-sm">Refresh</span>
                    </button>
                </div>
            </div>
            
            {/* Kanban Board Container (Horizontal Scroll) */}
            <div className="flex space-x-4 pb-4 overflow-x-auto min-h-[80vh]">
                {COLD_LEAD_STAGES.map(stage => (
                    <div
                        key={stage.id}
                        className="flex-shrink-0 w-80 bg-gray-200 rounded-xl p-3 shadow-inner"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, stage.id)}
                    >
                        {/* Column Header */}
                        <div className={`p-3 rounded-lg text-white mb-4 shadow-md flex items-center space-x-2 ${stage.isConversionStage ? 'bg-indigo-600' : 'bg-teal-600'}`}>
                            <stage.icon className="w-5 h-5"/>
                            <div>
                                <h2 className="font-bold text-lg leading-tight">{stage.name}</h2>
                                <span className="text-sm opacity-90">
                                    {leadsByStage[stage.id]?.length} {leadsByStage[stage.id]?.length === 1 ? 'Lead' : 'Leads'}
                                </span>
                            </div>
                        </div>
                        
                        {/* Lead Cards Container */}
                        <div className="min-h-[100px] space-y-4">
                            {leadsByStage[stage.id]?.map(lead => (
                                <ColdLeadCard 
                                    key={lead.lead_id} 
                                    lead={lead} 
                                    onDragStart={handleDragStart} 
                                    onAdvanceStage={() => advanceStage(lead.lead_id)}
                                    onClick={() => setSelectedLead(lead)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Toast Notification */}
            {toast && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => setToast(null)} 
                />
            )}

            {/* Lead Detail Modal */}
            <LeadDetailModal
                lead={selectedLead}
                isOpen={!!selectedLead}
                onClose={() => setSelectedLead(null)}
                onAddComment={handleAddComment}
                onMarkLost={handleMarkLost}
                onDelete={handleDeleteLead}
                onAssignEmployee={handleAssignEmployee}
                employees={employees}
            />

        </div>
    );
}