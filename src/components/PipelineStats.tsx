import { TrendingUp, DollarSign, Users, Target } from 'lucide-react';

interface PipelineStatsProps {
  prospects: any[];
}

export default function PipelineStats({ prospects }: PipelineStatsProps) {
  const totalValue = prospects.reduce((sum, p) => sum + (p.quote_amount || 0), 0);
  const avgDealSize = prospects.length > 0 ? totalValue / prospects.length : 0;
  const conversionRate = prospects.length > 0 
    ? (prospects.filter(p => ['quote_accepted', 'engagement_sent', 'invoice_sent'].includes(p.pipeline_stage)).length / prospects.length) * 100 
    : 0;
  const activeLeads = prospects.filter(p => 
    !['quote_accepted', 'engagement_sent', 'invoice_sent'].includes(p.pipeline_stage)
  ).length;

  const stats = [
    { label: 'Total Pipeline Value', value: `$${totalValue.toLocaleString()}`, icon: DollarSign, color: 'bg-green-100 text-green-600' },
    { label: 'Active Leads', value: activeLeads, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Avg Deal Size', value: `$${Math.round(avgDealSize).toLocaleString()}`, icon: Target, color: 'bg-purple-100 text-purple-600' },
    { label: 'Conversion Rate', value: `${(Number(conversionRate) || 0).toFixed(1)}%`, icon: TrendingUp, color: 'bg-teal-100 text-teal-600' }

  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
