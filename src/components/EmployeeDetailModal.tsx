import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, DollarSign, Award, Calendar } from 'lucide-react';

interface EmployeeDetailModalProps {
  employee: any;
  metrics: any;
  goals: any[];
  reviews: any[];
  open: boolean;
  onClose: () => void;
}

export function EmployeeDetailModal({ employee, metrics, goals, reviews, open, onClose }: EmployeeDetailModalProps) {
  if (!employee) return null;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{employee.full_name} - Performance Review</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-500">Projects</span>
                </div>
                <p className="text-2xl font-bold">{metrics?.projects_completed || 0}</p>
                <p className="text-xs text-gray-500">{metrics?.projects_in_progress || 0} in progress</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-500">Conversions</span>
                </div>
                <p className="text-2xl font-bold">{metrics?.prospects_converted || 0}</p>
                <p className="text-xs text-gray-500">of {metrics?.prospects_created || 0} leads</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-500">Revenue</span>
                </div>
                <p className="text-2xl font-bold">${metrics?.revenue_generated?.toLocaleString() || 0}</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-gray-500">Rating</span>
                </div>
                <p className="text-2xl font-bold">{metrics?.performance_rating ? Number(metrics.performance_rating).toFixed(1) : 'N/A'}</p>

              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="goals" className="space-y-4">
            {goals.map((goal) => (
              <Card key={goal.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{goal.title}</h4>
                  <Badge>{goal.status}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                <Progress value={(goal.current_value / goal.target_value) * 100} className="mb-2" />
                <div className="flex justify-between text-sm">
                  <span>{goal.current_value} / {goal.target_value}</span>
                  <span className="text-gray-500">Due: {new Date(goal.due_date).toLocaleDateString()}</span>
                </div>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="reviews" className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="font-semibold">{new Date(review.review_date).toLocaleDateString()}</span>
                  </div>
                  <Badge>Rating: {review.overall_rating}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium text-green-600">Strengths:</p>
                    <p className="text-gray-600">{review.strengths}</p>
                  </div>
                  <div>
                    <p className="font-medium text-orange-600">Areas for Improvement:</p>
                    <p className="text-gray-600">{review.areas_for_improvement}</p>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="activity">
            <p className="text-gray-500">Activity timeline coming soon...</p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
