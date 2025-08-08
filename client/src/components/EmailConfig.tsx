import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Phone, Mail } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const notificationConfigSchema = z.object({
  notificationEmail: z.string().email("Invalid email address"),
  smtpServer: z.string().min(1, "SMTP server is required"),
  smtpPort: z.number().min(1, "Port must be a valid number"),
  smtpUsername: z.string().optional(),
  smtpPassword: z.string().optional(),
  // SMS Configuration
  smsEnabled: z.boolean().optional(),
  phoneNumber: z.string().optional(),
  twilioAccountSid: z.string().optional(),
  twilioAuthToken: z.string().optional(),
  twilioPhoneNumber: z.string().optional(),
});

type NotificationConfigForm = z.infer<typeof notificationConfigSchema>;

export default function NotificationConfig() {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const { data: emailConfig, isLoading } = useQuery({
    queryKey: ["/api/email-config"],
  });

  const form = useForm<NotificationConfigForm>({
    resolver: zodResolver(notificationConfigSchema),
    defaultValues: {
      notificationEmail: emailConfig?.notificationEmail || "",
      smtpServer: emailConfig?.smtpServer || "smtp.gmail.com",
      smtpPort: emailConfig?.smtpPort || 587,
      smtpUsername: emailConfig?.smtpUsername || "",
      smtpPassword: "",
      smsEnabled: emailConfig?.smsEnabled || false,
      phoneNumber: emailConfig?.phoneNumber || "",
      twilioAccountSid: emailConfig?.twilioAccountSid || "",
      twilioAuthToken: "",
      twilioPhoneNumber: emailConfig?.twilioPhoneNumber || "",
    },
  });

  const saveConfigMutation = useMutation({
    mutationFn: (data: NotificationConfigForm) => apiRequest("POST", "/api/email-config", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-config"] });
      setIsEditing(false);
      toast({
        title: "Notification Settings Saved",
        description: "Your email and SMS settings have been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Save Configuration",
        description: error.message || "Unable to save notification configuration",
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
        description: error.message || "Unable to send test email",
        variant: "destructive",
      });
    },
  });

  const testSmsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/sms-config/test"),
    onSuccess: () => {
      toast({
        title: "Test SMS Sent",
        description: "Check your phone for the test message",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test SMS Failed",
        description: error.message || "Unable to send test SMS",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NotificationConfigForm) => {
    saveConfigMutation.mutate(data);
  };

  // Update form when data loads
  if (emailConfig && !form.getValues().notificationEmail) {
    form.reset({
      notificationEmail: emailConfig.notificationEmail,
      smtpServer: emailConfig.smtpServer,
      smtpPort: emailConfig.smtpPort,
      smtpUsername: emailConfig.smtpUsername || "",
      smtpPassword: "",
      smsEnabled: emailConfig.smsEnabled || false,
      phoneNumber: emailConfig.phoneNumber || "",
      twilioAccountSid: emailConfig.twilioAccountSid || "",
      twilioAuthToken: "",
      twilioPhoneNumber: emailConfig.twilioPhoneNumber || "",
    });
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
        <button
          className="text-primary-600 hover:text-primary-700 transition-colors"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Edit size={16} />
        </button>
      </div>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="notificationEmail" className="block text-sm font-medium text-gray-700 mb-2">
            Notification Email
          </Label>
          <Input
            id="notificationEmail"
            type="email"
            {...form.register("notificationEmail")}
            placeholder="your-email@example.com"
            disabled={!isEditing}
            className={!isEditing ? "bg-gray-50" : ""}
          />
          {form.formState.errors.notificationEmail && (
            <p className="text-sm text-error-500 mt-1">
              {form.formState.errors.notificationEmail.message}
            </p>
          )}
        </div>
        
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            SMTP Configuration
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              {...form.register("smtpServer")}
              placeholder="smtp.gmail.com"
              disabled={!isEditing}
              className={!isEditing ? "bg-gray-50" : ""}
            />
            <Input
              type="number"
              {...form.register("smtpPort", { valueAsNumber: true })}
              placeholder="587"
              disabled={!isEditing}
              className={!isEditing ? "bg-gray-50" : ""}
            />
          </div>
          {(form.formState.errors.smtpServer || form.formState.errors.smtpPort) && (
            <p className="text-sm text-error-500 mt-1">
              {form.formState.errors.smtpServer?.message || form.formState.errors.smtpPort?.message}
            </p>
          )}
        </div>

        {isEditing && (
          <>
            <div>
              <Label htmlFor="smtpUsername" className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Username (Optional)
              </Label>
              <Input
                id="smtpUsername"
                {...form.register("smtpUsername")}
                placeholder="your-email@gmail.com"
              />
            </div>

            <div>
              <Label htmlFor="smtpPassword" className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Password (Optional)
              </Label>
              <Input
                id="smtpPassword"
                type="password"
                {...form.register("smtpPassword")}
                placeholder="App password or email password"
              />
            </div>
          </>
        )}

        {/* SMS Configuration Section */}
        <div className="border-t pt-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Phone size={16} className="text-primary-600" />
              <Label htmlFor="smsEnabled" className="text-sm font-medium text-gray-700">
                SMS Notifications
              </Label>
            </div>
            {isEditing && (
              <Switch
                id="smsEnabled"
                checked={form.watch("smsEnabled")}
                onCheckedChange={(checked) => form.setValue("smsEnabled", checked)}
              />
            )}
            {!isEditing && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                form.watch("smsEnabled") 
                  ? 'bg-success-100 text-success-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {form.watch("smsEnabled") ? 'Enabled' : 'Disabled'}
              </span>
            )}
          </div>

          {form.watch("smsEnabled") && (
            <>
              <div>
                <Label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  {...form.register("phoneNumber")}
                  placeholder="+1234567890"
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                />
              </div>

              {isEditing && (
                <>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      Twilio Configuration
                    </Label>
                    <div className="space-y-3">
                      <Input
                        {...form.register("twilioAccountSid")}
                        placeholder="Twilio Account SID"
                      />
                      <Input
                        type="password"
                        {...form.register("twilioAuthToken")}
                        placeholder="Twilio Auth Token"
                      />
                      <Input
                        {...form.register("twilioPhoneNumber")}
                        placeholder="Twilio Phone Number (+1234567890)"
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
        
        {isEditing && (
          <div className="pt-4 space-y-3">
            <Button
              type="submit"
              className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              disabled={saveConfigMutation.isPending}
            >
              {saveConfigMutation.isPending ? "Saving..." : "Save Configuration"}
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => testEmailMutation.mutate()}
                disabled={testEmailMutation.isPending || !emailConfig?.notificationEmail}
                className="flex items-center space-x-2"
              >
                <Mail size={14} />
                <span>{testEmailMutation.isPending ? "Sending..." : "Test Email"}</span>
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => testSmsMutation.mutate()}
                disabled={testSmsMutation.isPending || !form.watch("smsEnabled") || !emailConfig?.phoneNumber}
                className="flex items-center space-x-2"
              >
                <Phone size={14} />
                <span>{testSmsMutation.isPending ? "Sending..." : "Test SMS"}</span>
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
