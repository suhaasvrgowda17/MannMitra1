import { Link } from "wouter";
import { useGetDashboardSummary, useGetBurnoutPrediction, getGetDashboardSummaryQueryKey, getGetBurnoutPredictionQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Flame, TrendingUp, AlertTriangle, CheckCircle, ChevronRight } from "lucide-react";

function BurnoutBadge({ level }: { level: string }) {
  const config: Record<string, { color: string; label: string }> = {
    low: { color: "bg-green-100 text-green-700 border-green-200", label: "Low Risk" },
    moderate: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Moderate Risk" },
    high: { color: "bg-orange-100 text-orange-700 border-orange-200", label: "High Risk" },
    critical: { color: "bg-red-100 text-red-700 border-red-200", label: "Critical Risk" },
  };
  const c = config[level] ?? config.low;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.color}`}>
      {c.label}
    </span>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: burnout, isLoading: burnoutLoading } = useGetBurnoutPrediction({ query: { queryKey: getGetBurnoutPredictionQueryKey() } });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            {greeting()}, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">How are you feeling today?</p>
        </div>

        {/* Quick action */}
        <div className="bg-primary rounded-2xl p-6 mb-6 flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/80 text-sm mb-1">Ready to reflect?</p>
            <h2 className="text-primary-foreground font-bold text-xl">Write in your journal</h2>
          </div>
          <Link href="/journal">
            <Button variant="secondary" className="flex-shrink-0" data-testid="button-quick-journal">
              <BookOpen className="w-4 h-4 mr-2" />
              New entry
            </Button>
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {summaryLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border border-card-border rounded-xl p-4">
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))
          ) : (
            <>
              <div className="bg-card border border-card-border rounded-xl p-4" data-testid="stat-journals">
                <div className="text-2xl font-bold text-foreground">{summary?.totalJournals ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><BookOpen className="w-3 h-3" /> Journal entries</div>
              </div>
              <div className="bg-card border border-card-border rounded-xl p-4" data-testid="stat-streak">
                <div className="text-2xl font-bold text-foreground">{summary?.currentStreakDays ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Flame className="w-3 h-3" /> Day streak</div>
              </div>
              <div className="bg-card border border-card-border rounded-xl p-4" data-testid="stat-mood">
                <div className="text-2xl font-bold text-foreground">{summary?.averageMood?.toFixed(1) ?? "—"}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Avg mood /10</div>
              </div>
            </>
          )}
        </div>

        {/* Burnout risk card */}
        <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              Burnout Risk
            </h3>
            {!burnoutLoading && burnout && <BurnoutBadge level={burnout.riskLevel} />}
          </div>
          {burnoutLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : burnout ? (
            <>
              <div className="w-full bg-muted rounded-full h-2 mb-3">
                <div
                  className={`h-2 rounded-full transition-all ${burnout.riskLevel === "low" ? "bg-green-500" : burnout.riskLevel === "moderate" ? "bg-yellow-500" : burnout.riskLevel === "high" ? "bg-orange-500" : "bg-red-500"}`}
                  style={{ width: `${burnout.riskScore}%` }}
                  data-testid="burnout-progress"
                />
              </div>
              <p className="text-sm text-muted-foreground">{burnout.analysis}</p>
            </>
          ) : null}
          <Link href="/dashboard" className="text-xs text-primary font-medium mt-3 inline-flex items-center gap-1 hover:underline" data-testid="link-dashboard">
            View full analysis <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Recent insights */}
        {!summaryLoading && summary?.recentInsights && summary.recentInsights.length > 0 && (
          <div className="bg-card border border-card-border rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              Recent AI insights
            </h3>
            <ul className="space-y-3">
              {summary.recentInsights.slice(0, 3).map((insight, i) => (
                <li key={i} className="text-sm text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/30" data-testid={`insight-${i}`}>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!summaryLoading && summary?.totalJournals === 0 && (
          <div className="bg-card border border-card-border rounded-xl p-8 text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Start your first journal entry</h3>
            <p className="text-sm text-muted-foreground mb-4">Write about your day, your studies, or whatever's on your mind. MannMitra will analyze your mood and give you personalized insights.</p>
            <Link href="/journal">
              <Button data-testid="button-first-journal">Write your first entry</Button>
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
