import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { analyzeFeedback, type AnalysisResult } from "@/server/analyze.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GuestLens — AI Feedback Insights for Rural Tourism" },
      {
        name: "description",
        content:
          "GuestLens helps rural tourism operators turn guest reviews into Swahili-English insights and approved SMS follow-ups — online or offline.",
      },
      { property: "og:title", content: "GuestLens — AI Feedback Insights for Rural Tourism" },
      {
        property: "og:description",
        content:
          "Turn guest reviews into actionable Swahili-English insights and human-approved SMS follow-ups.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const SAMPLE_REVIEW =
  "We booked the sunrise farm tour and it was the highlight of our trip to Kenya! Our guide Joseph was incredibly knowledgeable — we milked cows, picked fresh macadamia nuts, and had chai made with milk straight from the farm. The kids loved feeding the goats. Only downside: the dirt road signage was hard to follow and we arrived 20 minutes late, and there was no shaded spot to sit during the midday heat. Still, we'd absolutely come back and recommend it to anyone visiting the region.";

const GUEST_NUMBER = "+254 712 345 678";

function Index() {
  const [online, setOnline] = useState(true);
  const [review, setReview] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    setSent(false);
    try {
      const result = await analyzeFeedback({ data: { review } });
      setAnalysis(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApproveSend = () => {
    setAnalysis((prev) => (prev ? { ...prev, smsDraft: "" } : prev));
    setSent(true);
  };

  const confidenceStyles: Record<string, string> = {
    High: "bg-success/15 text-success border-success/40",
    Medium: "bg-warning/15 text-warning border-warning/40",
    Low: "bg-destructive/15 text-destructive border-destructive/40",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold tracking-tight text-primary">GuestLens</h1>
          <button
            onClick={() => setOnline(!online)}
            className="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-muted"
            aria-pressed={!online}
          >
            {online ? "🟢 Online" : "🟠 Offline"}
          </button>
        </div>
        {!online && (
          <div className="bg-warning/15 px-4 py-2 text-center text-sm font-medium text-warning">
            🟠 Offline (Store-and-Forward Mode) — Offline mode active. Reviews cached locally.
          </div>
        )}
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6 pb-16">
        {/* Success toast */}
        {sent && (
          <div
            role="alert"
            className="rounded-xl border-2 border-success bg-success px-4 py-4 text-center text-base font-semibold text-success-foreground shadow-lg"
          >
            ✅ SMS successfully queued to {GUEST_NUMBER} via local gateway.
          </div>
        )}

        {/* Section 1: Input Reviews */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-card-foreground">1. Input Reviews</h2>
          <button
            onClick={() => setReview(SAMPLE_REVIEW)}
            className="mt-3 w-full rounded-xl border border-primary/40 bg-secondary px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-muted"
          >
            Load Sample Yelp Review
          </button>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Paste or type a guest review here…"
            rows={6}
            className="mt-3 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <label className="mt-3 block">
            <span className="text-sm font-medium text-muted-foreground">Guest SMS Number</span>
            <input
              type="tel"
              defaultValue={GUEST_NUMBER}
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
        </section>

        {/* Section 2: AI Insight Dashboard */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-card-foreground">2. AI Insight Dashboard</h2>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !review.trim()}
            className="mt-3 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {analyzing ? "Analyzing…" : "Analyze Feedback"}
          </button>
          {error && (
            <p role="alert" className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          {analysis && (
            <div className="mt-4 space-y-3">
              <InsightCard
                emoji="🌟"
                title="Kitu Kilichopendwa (Highlight)"
                insight={analysis.highlight}
              />
              <InsightCard
                emoji="🛠️"
                title="Mabadiliko (Fix Needed)"
                insight={analysis.fix}
              />
              <InsightCard
                emoji="💡"
                title="Fursa Mpya (Opportunity)"
                insight={analysis.opportunity}
              />
            </div>
          )}
        </section>

        {/* Section 3: Human-in-the-Loop Guest Follow-Up */}
        {analysis && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-card-foreground">
              3. Guest Follow-Up (Human Approval)
            </h2>
            <textarea
              value={analysis.smsDraft}
              onChange={(e) => setAnalysis({ ...analysis, smsDraft: e.target.value })}
              placeholder="AI-drafted SMS will appear here…"
              rows={4}
              className="mt-3 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div
              className={`mt-3 inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${confidenceStyles[analysis.confidence]}`}
            >
              ⚠️ AI Confidence: {analysis.confidence} — Human Approval Required
            </div>
            <button
              onClick={handleApproveSend}
              disabled={!analysis.smsDraft.trim()}
              className="mt-3 w-full rounded-xl bg-success px-4 py-3 text-sm font-bold text-success-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Approve &amp; Send SMS
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

function InsightCard({
  emoji,
  title,
  insight,
}: {
  emoji: string;
  title: string;
  insight: { swahili: string; english: string };
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/60 p-4">
      <h3 className="text-sm font-bold text-primary">
        {emoji} {title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-card-foreground">
        {insight.swahili}{" "}
        <span className="text-muted-foreground">({insight.english})</span>
      </p>
    </div>
  );
}
