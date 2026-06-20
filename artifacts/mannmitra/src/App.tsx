import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import HomePage from "@/pages/home";
import JournalPage from "@/pages/journal";
import DashboardPage from "@/pages/dashboard";
import ChatPage from "@/pages/chat";
import SosPage from "@/pages/sos";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const PROTECTED_ROUTES = ["/home", "/journal", "/dashboard", "/chat", "/sos"];
const AUTH_ROUTES = ["/login", "/register"];

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    const isProtected = PROTECTED_ROUTES.some(r => location === r || location.startsWith(r + "/"));
    const isAuthRoute = AUTH_ROUTES.includes(location);
    if (!user && isProtected) {
      setLocation("/login");
    } else if (user && isAuthRoute) {
      setLocation("/home");
    }
  }, [user, isLoading, location]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading MannMitra...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function Router() {
  return (
    <AuthGuard>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/home" component={HomePage} />
        <Route path="/journal" component={JournalPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/chat" component={ChatPage} />
        <Route path="/sos" component={SosPage} />
        <Route component={NotFound} />
      </Switch>
    </AuthGuard>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
