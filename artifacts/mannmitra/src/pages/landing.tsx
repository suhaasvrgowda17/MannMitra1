import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Heart, BookOpen, BarChart2, MessageCircle, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">MannMitra</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" data-testid="link-login">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" data-testid="link-register">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-6">
          <Heart className="w-3.5 h-3.5" />
          AI Wellness Companion for Exam Aspirants
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
          Feel Better.<br />Perform Better.
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          MannMitra understands the unique pressure of JEE, NEET, UPSC, and other competitive exams.
          Your personal AI companion for emotional wellness, stress tracking, and burnout prevention.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register">
            <Button size="lg" className="px-8" data-testid="button-hero-cta">
              Start your wellness journey
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="px-8" data-testid="button-hero-signin">
              Sign in
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-border">
        <h2 className="text-3xl font-bold text-center text-foreground mb-4">
          Built for the Indian exam aspirant
        </h2>
        <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
          Every feature is designed with your unique journey in mind.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: BookOpen,
              title: "Emotional Journaling",
              desc: "Write in English, Hindi, Tamil, Telugu, Kannada, or Bengali. AI analyzes your mood and stress patterns automatically.",
            },
            {
              icon: BarChart2,
              title: "Subject Stress Heatmap",
              desc: "See which subjects are stressing you most. Spot patterns before they become problems.",
            },
            {
              icon: Shield,
              title: "Burnout Prediction",
              desc: "Analyze 7-14 days of entries to predict burnout risk with personalized recovery suggestions.",
            },
            {
              icon: MessageCircle,
              title: "AI Companion Chat",
              desc: "Context-aware responses for exam anxiety, comparison stress, family pressure, and more.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card border border-card-border rounded-xl p-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tagline */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-primary rounded-2xl p-12 text-center">
          <p className="text-primary-foreground/80 text-sm font-medium mb-3">MannMitra</p>
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            A Friend for Every Thought
          </h2>
          <p className="text-primary-foreground/70 max-w-xl mx-auto mb-8">
            Because every student deserves someone who truly understands their journey — not just their marks.
          </p>
          <Link href="/register">
            <Button variant="secondary" size="lg" data-testid="button-bottom-cta">
              Begin your journey
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-muted-foreground">
          MannMitra — Feel Better. Perform Better.
        </div>
      </footer>
    </div>
  );
}
