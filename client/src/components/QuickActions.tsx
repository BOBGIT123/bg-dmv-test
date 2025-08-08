import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Search, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function QuickActions() {
  const { toast } = useToast();

  const checkNowMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/monitoring/check-now"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monitoring-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
      toast({
        title: "Check Completed",
        description: "Manual appointment check has been completed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Check Failed",
        description: error.message || "Failed to perform appointment check",
        variant: "destructive",
      });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/email-config/test"),
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: "Check your inbox for the test email",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Email Failed",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="space-y-3">
        <Button
          className="w-full primary-button flex items-center justify-center space-x-2"
          onClick={() => checkNowMutation.mutate()}
          disabled={checkNowMutation.isPending}
        >
          <Search size={16} />
          <span>{checkNowMutation.isPending ? "Checking..." : "Check Now"}</span>
        </Button>
        <Button
          variant="outline"
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          onClick={() => testEmailMutation.mutate()}
          disabled={testEmailMutation.isPending}
        >
          <Mail size={16} />
          <span>{testEmailMutation.isPending ? "Sending..." : "Test Email"}</span>
        </Button>
      </div>
    </div>
  );
}
