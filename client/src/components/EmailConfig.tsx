import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const emailConfigSchema = z.object({
  notificationEmail: z.string().email("Invalid email address"),
  smtpServer: z.string().min(1, "SMTP server is required"),
  smtpPort: z.number().min(1, "Port must be a valid number"),
  smtpUsername: z.string().optional(),
  smtpPassword: z.string().optional(),
});

type EmailConfigForm = z.infer<typeof emailConfigSchema>;

export default function EmailConfig() {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const { data: emailConfig, isLoading } = useQuery({
    queryKey: ["/api/email-config"],
  });

  const form = useForm<EmailConfigForm>({
    resolver: zodResolver(emailConfigSchema),
    defaultValues: {
      notificationEmail: emailConfig?.notificationEmail || "",
      smtpServer: emailConfig?.smtpServer || "smtp.gmail.com",
      smtpPort: emailConfig?.smtpPort || 587,
      smtpUsername: emailConfig?.smtpUsername || "",
      smtpPassword: "",
    },
  });

  const saveConfigMutation = useMutation({
    mutationFn: (data: EmailConfigForm) => apiRequest("POST", "/api/email-config", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-config"] });
      setIsEditing(false);
      toast({
        title: "Email Configuration Saved",
        description: "Your email settings have been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Save Configuration",
        description: error.message || "Unable to save email configuration",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmailConfigForm) => {
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
        <h2 className="text-lg font-semibold text-gray-900">Email Settings</h2>
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
        
        {isEditing && (
          <div className="pt-2">
            <Button
              type="submit"
              className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              disabled={saveConfigMutation.isPending}
            >
              {saveConfigMutation.isPending ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
