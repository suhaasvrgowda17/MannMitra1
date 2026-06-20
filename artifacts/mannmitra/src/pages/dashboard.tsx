import { useState } from "react";
import { useGetDashboardSummary, useGetBurnoutPrediction, useGetSubjectHeatmap, useGetMoodCalendar, getGetDashboardSummaryQueryKey, getGetBurnoutPredictionQueryKey, getGetSubjectHeatmapQueryKey, getGetMoodCalendarQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, AlertTriangle, Calendar, BarChart2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function BurnoutRing({ score, level }: { score: number; level: string }) {
  const colors: Record<string, string> = { low: "#22c55e", moderate: "#eab308", high: "#f97316", critical: "#ef4444" };
  const color = colors[level] ?? colors.low;
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="46" textAnchor="middle" className="fill-foreground" fontSize="14" fontWeight="bold">{score}%</text>
        <text x="50" y="60" textAnchor="middle" fill="#9ca3af" fontSize="9">{level}</text>
      </svg>
    </div>
  );
}

function MoodDot({ mood }: { mood: number }) {
  const color = mood >= 7 ? "bg-green-400" : mood >= 4 ? "bg-yellow-400" : mood > 0 ? "bg-red-400" : "bg-muted";
  return <div className={`w-5 h-5 rounded-sm ${color} transition-colors`} title={`Mood: ${mood.toFixed(1)}/10`} />;
}

export default function DashboardPage() {
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [calYear, setCalYear] = useState(now.getFullYear());

  const { data: summary, isLoading: sumLoading } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: burnout, isLoading: burnoutLoading } = useGetBurnoutPrediction({ query: { queryKey: getGetBurnoutPredictionQueryKey() } });
  const { data: heatmap, isLoading: heatmapLoading } = useGetSubjectHeatmap({ query: { queryKey: getGetSubjectHeatmapQueryKey() } });
  const { data: calendar, isLoading: calLoading } = useGetMoodCalendar(
    { year: calYear, month: calMonth },
    { query: { queryKey: getGetMoodCalendarQueryKey({ year: calYear, month: calMonth }) } }
  );

  const calDays = (() => {
    const firstDay = new Date(calYear, calMonth - 1, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth, 0).getDate();
    const moodMap: Record<string, number> = {};
    calendar?.forEach(e => { moodMap[e.date] = e.mood; });
    const cells: Array<{ date: string | null; mood: number | null }> = [];
    for (let i = 0; i < firstDay; i++) cells.push({ date: null, mood: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ date: dateStr, mood: moodMap[dateStr] ?? null });
    }
    return cells;
  })();

  const monthName = new Date(calYear, calMonth - 1).toLocaleString("en-IN", { month: "long", year: "numeric" });

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Wellness Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your emotional patterns and insights</p>
        </div>

        {/* Weekly mood chart */}
        <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">7-Day Mood Trend</h2>
          </div>
          {sumLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : !summary?.weeklyMoodTrend?.some(d => d.mood > 0) ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No mood data yet. Start journaling to see your trend.</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={summary?.weeklyMoodTrend ?? []} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(175,55%,35%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(175,55%,35%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--card-border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(val: number) => [`${val.toFixed(1)}/10`, "Mood"]}
                />
                <Area type="monotone" dataKey="mood" stroke="hsl(175,55%,35%)" strokeWidth={2} fill="url(#moodGrad)" dot={{ r: 3, fill: "hsl(175,55%,35%)" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Burnout prediction */}
          <div className="bg-card border border-card-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Burnout Prediction</h2>
            </div>
            {burnoutLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : burnout ? (
              <>
                <div className="flex justify-center mb-4">
                  <BurnoutRing score={Math.round(burnout.riskScore)} level={burnout.riskLevel} />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{burnout.analysis}</p>
                {burnout.suggestions?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Suggestions</p>
                    <ul className="space-y-1.5">
                      {burnout.suggestions.slice(0, 3).map((s, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Subject heatmap */}
          <div className="bg-card border border-card-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Subject Stress</h2>
            </div>
            {heatmapLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : !heatmap?.length ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground text-center">
                Tag subjects in your journal entries to see your stress heatmap.
              </div>
            ) : (
              <div className="space-y-3">
                {heatmap.slice(0, 7).map(item => (
                  <div key={item.subject} data-testid={`heatmap-${item.subject}`}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">{item.subject}</span>
                      <span className="text-muted-foreground">{item.stressScore.toFixed(1)}/10</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${(item.stressScore / 10) * 100}%`,
                          backgroundColor: item.stressScore >= 7 ? "#ef4444" : item.stressScore >= 4 ? "#f97316" : "#22c55e",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mood calendar */}
        <div className="bg-card border border-card-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Mood Calendar</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => {
                  if (calMonth === 1) { setCalMonth(12); setCalYear(y => y - 1); }
                  else setCalMonth(m => m - 1);
                }}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-foreground w-36 text-center">{monthName}</span>
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => {
                  if (calMonth === 12) { setCalMonth(1); setCalYear(y => y + 1); }
                  else setCalMonth(m => m + 1);
                }}
                data-testid="button-next-month"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {calLoading ? (
            <Skeleton className="h-36 w-full" />
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                  <div key={d} className="text-xs text-muted-foreground text-center py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calDays.map((cell, i) => (
                  <div key={i} className="flex justify-center">
                    {cell.date ? (
                      <MoodDot mood={cell.mood ?? 0} />
                    ) : (
                      <div className="w-5 h-5" />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-muted" />No entry</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-400" />Stressed</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-yellow-400" />Moderate</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-400" />Good</div>
              </div>
            </>
          )}
        </div>

        {/* Top stress triggers */}
        {!sumLoading && summary?.topStressTriggers?.length ? (
          <div className="bg-card border border-card-border rounded-xl p-6 mt-6">
            <h2 className="font-semibold text-foreground mb-4">Top Stress Triggers</h2>
            <div className="flex flex-wrap gap-2">
              {summary.topStressTriggers.map(t => (
                <span key={t} className="text-sm px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-medium" data-testid={`trigger-${t}`}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
