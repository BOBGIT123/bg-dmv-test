import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const monitoringSettingsSchema = z.object({
  checkInterval: z.number().min(60, "Minimum interval is 60 seconds"),
  daysAhead: z.number().min(1, "Must look at least 1 day ahead").max(30, "Maximum is 30 days"),
  businessDaysOnly: z.boolean(),
  isEnabled: z.boolean(),
});

type MonitoringSettingsForm = z.infer<typeof monitoringSettingsSchema>;

export default function MonitoringSettings() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/monitoring-settings"],
  });

  const form = useForm<MonitoringSettingsForm>({
    resolver: zodResolver(monitoringSettingsSchema),
    defaultValues: {
      checkInterval: 300,
      daysAhead: 5,
      businessDaysOnly: true,
      isEnabled: false,
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (data: MonitoringSettingsForm) => apiRequest("POST", "/api/monitoring-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monitoring-settings"] });
      toast({
        title: "Settings Saved",
        description: "Your monitoring settings have been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Save Settings",
        description: error.message || "Unable to save monitoring settings",
        variant: "destructive",
      });
    },
  });

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      form.reset({
        checkInterval: settings.checkInterval,
        daysAhead: settings.daysAhead,
        businessDaysOnly: settings.businessDaysOnly,
        isEnabled: settings.isEnabled,
      });
    }
  }, [settings, form]);

  const onSubmit = (data: MonitoringSettingsForm) => {
    saveSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Monitoring Settings</h2>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="checkInterval" className="block text-sm font-medium text-gray-700 mb-2">
            Check Interval
          </Label>
          <Select
            value={form.watch("checkInterval").toString()}
            onValueChange={(value) => form.setValue("checkInterval", parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="300">5 minutes</SelectItem>
              <SelectItem value="600">10 minutes</SelectItem>
              <SelectItem value="900">15 minutes</SelectItem>
              <SelectItem value="1800">30 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="daysAhead" className="block text-sm font-medium text-gray-700 mb-2">
            Days to Look Ahead
          </Label>
          <Input
            id="daysAhead"
            type="number"
            min="1"
            max="30"
            {...form.register("daysAhead", { valueAsNumber: true })}
          />
          {form.formState.errors.daysAhead && (
            <p className="text-sm text-error-500 mt-1">
              {form.formState.errors.daysAhead.message}
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="businessDaysOnly" className="text-sm font-medium text-gray-700">
            Only Business Days
          </Label>
          <Switch
            id="businessDaysOnly"
            checked={form.watch("businessDaysOnly")}
            onCheckedChange={(checked) => form.setValue("businessDaysOnly", checked)}
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            disabled={saveSettingsMutation.isPending}
          >
            {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
