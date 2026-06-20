import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Heart, Lock, Mail } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { setAuth } = useAuth();
  const { toast } = useToast();
  const login = useLogin();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: FormData) => {
    login.mutate(
      { data },
      {
        onSuccess: (res) => {
          setAuth(res.token, res.user as any);
          setLocation("/home");
        },
        onError: () => {
          toast({ title: "Invalid credentials", description: "Please check your email and password.", variant: "destructive" });
        },
      }
    );
  };

  const fillDemo = () => {
    form.setValue("email", "demo@mannmitra.com");
    form.setValue("password", "Demo@123");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">MannMitra</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white mb-4">Feel Better.<br />Perform Better.</h2>
          <p className="text-white/70 text-lg">Your AI companion understands the pressure you're under — and helps you rise above it.</p>
        </div>
        <p className="text-white/50 text-sm">Trusted by aspirants across India</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">MannMitra</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
            <p className="text-muted-foreground text-sm">Sign in to continue your wellness journey</p>
          </div>

          {/* Demo credentials */}
          <div className="bg-primary/8 border border-primary/20 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wide">Try Demo Account</p>
            <div className="text-sm text-foreground font-mono space-y-1">
              <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted-foreground" /> demo@mannmitra.com</div>
              <div className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-muted-foreground" /> Demo@123</div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 text-xs h-7"
              onClick={fillDemo}
              data-testid="button-fill-demo"
            >
              Use demo credentials
            </Button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" data-testid="input-email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" data-testid="input-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={login.isPending} data-testid="button-submit">
                {login.isPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline" data-testid="link-register">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
