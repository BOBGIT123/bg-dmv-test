import Header from "@/components/Header";
import QuickActions from "@/components/QuickActions";
import EmailConfig from "@/components/EmailConfig";
import MonitoringSettings from "@/components/MonitoringSettings";
import StatusDashboard from "@/components/StatusDashboard";
import DMVLocations from "@/components/DMVLocations";
import RecentActivity from "@/components/RecentActivity";

export default function Dashboard() {
  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <QuickActions />
            <EmailConfig />
            <MonitoringSettings />
          </div>

          {/* Right Column: Status and Results */}
          <div className="lg:col-span-2 space-y-6">
            <StatusDashboard />
            <DMVLocations />
            <RecentActivity />
          </div>
        </div>
      </main>
    </div>
  );
}
