import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export default function StatusDashboard() {
  const [nextCheckCountdown, setNextCheckCountdown] = useState("");

  const { data: stats } = useQuery({
    queryKey: ["/api/monitoring-stats"],
    refetchInterval: 5000,
  });

  const { data: status } = useQuery({
    queryKey: ["/api/monitoring/status"],
    refetchInterval: 5000,
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/monitoring-settings"],
  });

  const formatUptime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatLastCheckTime = (lastCheckTime: string | null) => {
    if (!lastCheckTime) return "Never";
    const time = new Date(lastCheckTime);
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Calculate next check countdown
  useEffect(() => {
    const updateCountdown = () => {
      if (!stats?.lastCheckTime || !settings?.checkInterval || !status?.isRunning) {
        setNextCheckCountdown("");
        return;
      }

      const lastCheck = new Date(stats.lastCheckTime);
      const intervalMs = settings.checkInterval * 1000;
      const nextCheck = new Date(lastCheck.getTime() + intervalMs);
      const now = new Date();
      const timeUntilNext = Math.max(0, nextCheck.getTime() - now.getTime());

      if (timeUntilNext === 0) {
        setNextCheckCountdown("Checking now...");
        return;
      }

      const minutes = Math.floor(timeUntilNext / 60000);
      const seconds = Math.floor((timeUntilNext % 60000) / 1000);
      setNextCheckCountdown(`${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [stats?.lastCheckTime, settings?.checkInterval, status?.isRunning]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">System Status</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-success-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-success-600">
            {stats?.totalChecks || 0}
          </div>
          <div className="text-sm text-success-600">Total Checks</div>
        </div>
        <div className="bg-primary-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary-600">
            {stats?.appointmentsFound || 0}
          </div>
          <div className="text-sm text-primary-600">Appointments Found</div>
        </div>
        <div className="bg-warning-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-warning-600">
            {stats?.emailsSent || 0}
          </div>
          <div className="text-sm text-warning-600">Emails Sent</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">
            {formatUptime(status?.uptime || stats?.uptime || 0)}
          </div>
          <div className="text-sm text-gray-600">Uptime</div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            status?.isRunning ? 'bg-success-500 animate-pulse' : 'bg-gray-400'
          }`}></div>
          <span className="text-sm text-gray-600">
            {status?.isRunning && nextCheckCountdown
              ? `Next check in ${nextCheckCountdown}`
              : "Monitoring inactive"
            }
          </span>
        </div>
        <div className="text-sm text-gray-500">
          Last check: {formatLastCheckTime(stats?.lastCheckTime)}
        </div>
      </div>
    </div>
  );
}
