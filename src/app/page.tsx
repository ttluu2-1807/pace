import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Activity, Apple, HeartPulse, Brain } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-16 border-b">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6" />
          <span className="text-xl font-bold tracking-tight">PACE</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-3xl mx-auto">
        <Badge variant="secondary" className="mb-4">
          AI-Powered Running Intelligence
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
          The only running app that knows what you ate, how your body feels, and
          what to do next
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl">
          PACE synthesises your nutrition, training load, and recovery status
          into one adaptive coaching layer that evolves with you daily.
        </p>
        <div className="flex gap-3 mt-8">
          <Link href="/signup">
            <Button size="lg">Start Free</Button>
          </Link>
          <Link href="/onboarding">
            <Button size="lg" variant="outline">
              See How It Works
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t py-20 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              icon: Activity,
              title: "Adaptive Training",
              desc: "Plans that re-calculate daily based on your sleep, HRV, and how you actually feel.",
            },
            {
              icon: Apple,
              title: "Precision Nutrition",
              desc: "Carb periodisation matched to your training day. Pre-run, during, and recovery fuelling.",
            },
            {
              icon: HeartPulse,
              title: "Injury Intelligence",
              desc: "Self-report conditions and get immediate training modifications. Track your Injury Risk Index.",
            },
            {
              icon: Brain,
              title: "AI Coach",
              desc: "Ask questions, challenge recommendations, and get deeper explanations from your personal coach.",
            },
          ].map((feature) => (
            <div key={feature.title} className="space-y-2">
              <feature.icon className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6 text-center text-sm text-muted-foreground">
        <p>PACE — Personalised Athletic Conditioning & Energy</p>
      </footer>
    </div>
  );
}
