import { useState } from "react";
import { useListJournals, useCreateJournal, useDeleteJournal, getListJournalsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "kn", label: "Kannada" },
  { value: "bn", label: "Bengali" },
];

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "History", "Geography", "Economics", "Polity", "Current Affairs", "English", "Reasoning"];

function MoodDot({ score }: { score: number | null }) {
  if (score === null) return null;
  const color = score >= 7 ? "bg-green-400" : score >= 4 ? "bg-yellow-400" : "bg-red-400";
  return <span className={`inline-block w-2 h-2 rounded-full ${color} flex-shrink-0`} />;
}

function StressLevelBadge({ level }: { level: string | null }) {
  if (!level) return null;
  const colors: Record<string, string> = {
    low: "bg-green-50 text-green-700 border-green-200",
    moderate: "bg-yellow-50 text-yellow-700 border-yellow-200",
    high: "bg-orange-50 text-orange-700 border-orange-200",
    critical: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colors[level] ?? colors.moderate}`}>
      {level} stress
    </span>
  );
}

export default function JournalPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("en");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page] = useState(1);

  const { data, isLoading } = useListJournals({ page, limit: 20 }, { query: { queryKey: getListJournalsQueryKey({ page, limit: 20 }) } });
  const createJournal = useCreateJournal();
  const deleteJournal = useDeleteJournal();

  const handleSubmit = () => {
    if (!content.trim()) return;
    createJournal.mutate(
      { data: { content: content.trim(), language, subjects: selectedSubjects } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListJournalsQueryKey() });
          setContent("");
          setSelectedSubjects([]);
          setShowForm(false);
          toast({ title: "Journal saved", description: "Your entry has been analyzed by MannMitra." });
        },
        onError: () => toast({ title: "Error", description: "Could not save journal entry.", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteJournal.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListJournalsQueryKey() }),
    });
  };

  const toggleSubject = (s: string) => {
    setSelectedSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Journal</h1>
            <p className="text-sm text-muted-foreground mt-1">Write freely — MannMitra will understand</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-new-entry">
            {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showForm ? "Cancel" : "New entry"}
          </Button>
        </div>

        {/* New entry form */}
        {showForm && (
          <div className="bg-card border border-card-border rounded-xl p-6 mb-6 animate-in slide-in-from-top-2 duration-200">
            <h2 className="font-semibold text-foreground mb-4">How are you feeling?</h2>
            <Textarea
              placeholder="Write about your day, your studies, anything on your mind... MannMitra will analyze your mood and give you personalized insights."
              className="min-h-[140px] mb-4 resize-none"
              value={content}
              onChange={e => setContent(e.target.value)}
              data-testid="textarea-journal"
            />
            <div className="flex flex-wrap gap-2 mb-4">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-36 h-8 text-sm" data-testid="select-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground self-center">Write in any language</p>
            </div>
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Tag subjects (optional)</p>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSubject(s)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${selectedSubjects.includes(s) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                    data-testid={`subject-${s.toLowerCase()}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={!content.trim() || createJournal.isPending} data-testid="button-save-journal">
                {createJournal.isPending ? "Analyzing..." : "Save entry"}
              </Button>
            </div>
          </div>
        )}

        {/* Journal list */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border border-card-border rounded-xl p-5">
                <Skeleton className="h-4 w-32 mb-3" />
                <Skeleton className="h-16 w-full mb-3" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        ) : !data?.entries?.length ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Your journal is empty</h3>
            <p className="text-sm text-muted-foreground mb-4">Start writing to unlock AI-powered insights about your wellness.</p>
            <Button onClick={() => setShowForm(true)} data-testid="button-start-journaling">Start journaling</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {data.entries.map(entry => (
              <div key={entry.id} className="bg-card border border-card-border rounded-xl overflow-hidden" data-testid={`journal-entry-${entry.id}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <MoodDot score={entry.moodScore ?? null} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <StressLevelBadge level={entry.stressLevel ?? null} />
                      {entry.language !== "en" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border">
                          {LANGUAGES.find(l => l.value === entry.language)?.label ?? entry.language}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                        data-testid={`button-expand-${entry.id}`}
                      >
                        {expandedId === entry.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                        data-testid={`button-delete-${entry.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className={`text-sm text-foreground leading-relaxed ${expandedId === entry.id ? "" : "line-clamp-3"}`}>
                    {entry.content}
                  </p>
                  {entry.subjects && entry.subjects.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {entry.subjects.map(s => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                {expandedId === entry.id && entry.aiInsight && (
                  <div className="px-5 pb-5">
                    <div className="bg-primary/5 border border-primary/15 rounded-lg p-4">
                      <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wide">MannMitra insight</p>
                      <p className="text-sm text-foreground leading-relaxed">{entry.aiInsight}</p>
                    </div>
                    {entry.stressTriggers && entry.stressTriggers.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-2">Stress triggers detected:</p>
                        <div className="flex flex-wrap gap-1">
                          {entry.stressTriggers.map(t => (
                            <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
