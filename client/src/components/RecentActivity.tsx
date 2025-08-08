import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Fan } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RecentActivity() {
  const { toast } = useToast();

  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/activity-logs"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const clearActivityMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/activity-logs"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
      toast({
        title: "Activity Cleared",
        description: "All activity logs have been cleared",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Clear Activity",
        description: error.message || "Unable to clear activity logs",
        variant: "destructive",
      });
    },
  });

  const getActivityStyle = (type: string) => {
    switch (type) {
      case 'appointment_found':
        return {
          bgColor: 'bg-success-50',
          dotColor: 'bg-success-500',
          titleColor: 'text-success-800',
          descColor: 'text-success-700',
          actionColor: 'text-success-600',
        };
      case 'monitoring_started':
      case 'monitoring_stopped':
        return {
          bgColor: 'bg-warning-50',
          dotColor: 'bg-warning-500',
          titleColor: 'text-warning-800',
          descColor: 'text-warning-700',
          actionColor: 'text-warning-600',
        };
      case 'email_sent':
        return {
          bgColor: 'bg-primary-50',
          dotColor: 'bg-primary-500',
          titleColor: 'text-primary-800',
          descColor: 'text-primary-700',
          actionColor: 'text-primary-600',
        };
      case 'error':
        return {
          bgColor: 'bg-error-50',
          dotColor: 'bg-error-500',
          titleColor: 'text-error-800',
          descColor: 'text-error-700',
          actionColor: 'text-error-600',
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          dotColor: 'bg-gray-400',
          titleColor: 'text-gray-800',
          descColor: 'text-gray-700',
          actionColor: 'text-gray-600',
        };
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700 transition-colors"
          onClick={() => clearActivityMutation.mutate()}
          disabled={clearActivityMutation.isPending}
        >
          <Fan size={16} />
        </Button>
      </div>
      
      <ScrollArea className="h-96">
        <div className="space-y-4">
          {activities?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No recent activity to display
            </div>
          ) : (
            activities?.map((activity: any) => {
              const style = getActivityStyle(activity.type);
              return (
                <div
                  key={activity.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg ${style.bgColor}`}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 ${style.dotColor}`}></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium ${style.titleColor}`}>
                        {activity.title}
                      </h4>
                      <span className={`text-xs ${style.actionColor}`}>
                        {formatTime(activity.createdAt)}
                      </span>
                    </div>
                    {activity.description && (
                      <p className={`text-sm mt-1 ${style.descColor}`}>
                        {activity.description}
                      </p>
                    )}
                    {activity.action && (
                      <p className={`text-xs mt-1 ${style.actionColor}`}>
                        {activity.action}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
