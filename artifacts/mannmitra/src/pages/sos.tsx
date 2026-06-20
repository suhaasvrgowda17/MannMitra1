import { useEffect } from "react";
import { useGetSosSettings, useUpdateSosSettings, useTriggerSos, getGetSosSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertTriangle, Phone, Shield, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  contactName: z.string().min(1, "Contact name is required"),
  contactPhone: z.string().min(10, "Enter a valid phone number"),
  contactEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  message: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

export default function SosPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: settings, isLoading } = useGetSosSettings({ query: { queryKey: getGetSosSettingsQueryKey() } });
  const updateSettings = useUpdateSosSettings();
  const triggerSos = useTriggerSos();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      message: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        contactName: settings.contactName,
        contactPhone: settings.contactPhone,
        contactEmail: settings.contactEmail ?? "",
        message: settings.message ?? "",
        isActive: settings.isActive,
      });
    }
  }, [settings]);

  const onSubmit = (data: FormData) => {
    updateSettings.mutate(
      {
        data: {
          contactName: data.contactName,
          contactPhone: data.contactPhone,
          contactEmail: data.contactEmail || null,
          message: data.message || null,
          isActive: data.isActive,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSosSettingsQueryKey() });
          toast({ title: "SOS settings saved", description: "Your emergency contact has been updated." });
        },
        onError: () => toast({ title: "Error", description: "Could not save settings.", variant: "destructive" }),
      }
    );
  };

  const handleTrigger = () => {
    triggerSos.mutate(
      { data: {} },
      {
        onSuccess: (res) => {
          toast({
            title: res.success ? "SOS Alert Sent" : "SOS Not Configured",
            description: res.message,
            variant: res.success ? "default" : "destructive",
          });
        },
      }
    );
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">SOS Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Set up emergency contact for moments of crisis</p>
        </div>

        {/* SOS trigger button */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-red-900 mb-1">Silent SOS</h2>
              <p className="text-sm text-red-700/80 mb-4">
                In a moment of crisis, press this button to notify your emergency contact. You are not alone.
              </p>
              <Button
                variant="destructive"
                onClick={handleTrigger}
                disabled={triggerSos.isPending}
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-trigger-sos"
              >
                <Phone className="w-4 h-4 mr-2" />
                {triggerSos.isPending ? "Sending..." : "Send SOS Alert"}
              </Button>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Heart className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground leading-relaxed">
            If you're feeling overwhelmed, remember: it's okay to ask for help. Set up your emergency contact below so someone who cares is just one tap away.
          </p>
        </div>

        {/* Settings form */}
        <div className="bg-card border border-card-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Emergency Contact</h2>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact name</FormLabel>
                      <FormControl>
                        <Input placeholder="Maa, Dad, Rohit..." data-testid="input-contact-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone number</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 98765 43210" data-testid="input-contact-phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@example.com" data-testid="input-contact-email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom SOS message (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="I need support right now. Please call me."
                          className="resize-none"
                          rows={3}
                          data-testid="textarea-sos-message"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <Label className="text-sm font-medium">Enable SOS</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Allow MannMitra to send alerts to this contact</p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-sos-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={updateSettings.isPending} data-testid="button-save-sos">
                  {updateSettings.isPending ? "Saving..." : "Save emergency contact"}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
