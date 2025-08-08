import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const locationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Must be a valid URL"),
  type: z.string().min(1, "Type is required"),
  enabled: z.boolean().default(true),
});

type LocationForm = z.infer<typeof locationSchema>;

export default function DMVLocations() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: locations, isLoading } = useQuery({
    queryKey: ["/api/dmv-locations"],
  });

  const form = useForm<LocationForm>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: "",
      url: "",
      type: "All Services",
      enabled: true,
    },
  });

  const addLocationMutation = useMutation({
    mutationFn: (data: LocationForm) => apiRequest("POST", "/api/dmv-locations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dmv-locations"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Location Added",
        description: "DMV location has been added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Location",
        description: error.message || "Unable to add DMV location",
        variant: "destructive",
      });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<any> }) =>
      apiRequest("PATCH", `/api/dmv-locations/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dmv-locations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Location",
        description: error.message || "Unable to update location",
        variant: "destructive",
      });
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/dmv-locations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dmv-locations"] });
      toast({
        title: "Location Deleted",
        description: "DMV location has been removed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Location",
        description: error.message || "Unable to delete location",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LocationForm) => {
    addLocationMutation.mutate(data);
  };

  const toggleLocationEnabled = (id: string, enabled: boolean) => {
    updateLocationMutation.mutate({ id, updates: { enabled } });
  };

  const deleteLocation = (id: string) => {
    if (confirm("Are you sure you want to delete this location?")) {
      deleteLocationMutation.mutate(id);
    }
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
        <h2 className="text-lg font-semibold text-gray-900">DMV Locations</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <button className="text-primary-600 hover:text-primary-700 transition-colors">
              <Plus size={20} />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add DMV Location</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Location Name</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="e.g., Henderson DMV (All Services)"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-error-500 mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="url">Booking URL</Label>
                <Input
                  id="url"
                  {...form.register("url")}
                  placeholder="https://example.waitwell.us/book/123"
                />
                {form.formState.errors.url && (
                  <p className="text-sm text-error-500 mt-1">
                    {form.formState.errors.url.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="type">Service Type</Label>
                <Select
                  value={form.watch("type")}
                  onValueChange={(value) => form.setValue("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Services">All Services</SelectItem>
                    <SelectItem value="Driver's License Only">Driver's License Only</SelectItem>
                    <SelectItem value="Vehicle Registration">Vehicle Registration</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enabled"
                  checked={form.watch("enabled")}
                  onCheckedChange={(checked) => form.setValue("enabled", !!checked)}
                />
                <Label htmlFor="enabled">Enable monitoring for this location</Label>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 primary-button"
                  disabled={addLocationMutation.isPending}
                >
                  {addLocationMutation.isPending ? "Adding..." : "Add Location"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="space-y-4">
        {locations?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No DMV locations configured. Add your first location to start monitoring.
          </div>
        ) : (
          locations?.map((location: any) => (
            <div
              key={location.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={location.enabled}
                      onCheckedChange={(checked) => toggleLocationEnabled(location.id, !!checked)}
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">{location.name}</h3>
                      <p className="text-sm text-gray-500">{location.type}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${
                      location.enabled ? 'bg-success-500' : 'bg-gray-400'
                    }`}></div>
                    <span className={`text-xs ${
                      location.enabled ? 'text-success-600' : 'text-gray-600'
                    }`}>
                      {location.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <button
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => deleteLocation(location.id)}
                    disabled={deleteLocationMutation.isPending}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
