import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CalendarCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const { toast } = useToast();

  const { data: settings } = useQuery({
    queryKey: ["/api/monitoring-settings"],
  });

  const { data: status } = useQuery({
    queryKey: ["/api/monitoring/status"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/monitoring-stats"],
    refetchInterval: 5000,
  });

  const startMonitoringMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/monitoring/start"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monitoring/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
      toast({
        title: "Monitoring Started",
        description: "DMV appointment monitoring is now active",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Start Monitoring",
        description: error.message || "Unable to start monitoring",
        variant: "destructive",
      });
    },
  });

  const stopMonitoringMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/monitoring/stop"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monitoring/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
      toast({
        title: "Monitoring Stopped",
        description: "DMV appointment monitoring has been stopped",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Stop Monitoring",
        description: error.message || "Unable to stop monitoring",
        variant: "destructive",
      });
    },
  });

  const toggleMonitoring = async (enabled: boolean) => {
    if (enabled) {
      // Update settings to enable monitoring first
      await apiRequest("POST", "/api/monitoring-settings", {
        ...settings,
        isEnabled: true,
      });
      startMonitoringMutation.mutate();
    } else {
      stopMonitoringMutation.mutate();
      // Update settings to disable monitoring
      await apiRequest("POST", "/api/monitoring-settings", {
        ...settings,
        isEnabled: false,
      });
    }
  };

  const formatLastCheckTime = (lastCheckTime: string | null) => {
    if (!lastCheckTime) return "Never";
    const time = new Date(lastCheckTime);
    const now = new Date();
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return time.toLocaleDateString();
  };

  const isMonitoring = status?.isRunning || false;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <CalendarCheck className="text-white text-sm" size={16} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Nevada DMV Monitor</h1>
              <p className="text-sm text-gray-500">Automated appointment checking</p>
            </div>
          </div>
          
          {/* Main Toggle Switch */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">Monitoring</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isMonitoring}
                  onChange={(e) => toggleMonitoring(e.target.checked)}
                  disabled={startMonitoringMutation.isPending || stopMonitoringMutation.isPending}
                />
                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
              <div className="flex flex-col items-center">
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    isMonitoring ? 'bg-success-500 animate-pulse' : 'bg-gray-400'
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    isMonitoring ? 'text-success-600' : 'text-gray-600'
                  }`}>
                    {isMonitoring ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatLastCheckTime(stats?.lastCheckTime)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
