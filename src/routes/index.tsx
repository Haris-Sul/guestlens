import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { analyzeFeedback, type AnalysisResult } from "@/lib/analyze.functions";

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

const SAMPLE_REVIEWS = [
  "We booked the sunrise farm tour and it was the highlight of our trip to Kenya! Our guide Joseph was incredibly knowledgeable — we milked cows, picked fresh macadamia nuts, and had chai made with milk straight from the farm. The kids loved feeding the goats. Only downside: the dirt road signage was hard to follow and we arrived 20 minutes late, and there was no shaded spot to sit during the midday heat.",
  "The Maasai cultural village visit was eye-opening. The jumping dance and beadwork demonstration were unforgettable, and our host Sankau explained traditions with such warmth. However, the souvenir prices felt high and nobody told us cash was the only option. Bring shillings!",
  "Amazing guided hike up the Usambara Mountains. Views were breathtaking and the homestay lunch of ugali and greens was delicious. The trail was muddy after rain and we weren't warned to bring proper boots. Our guide Amani was patient with our slow group.",
  "Spice farm tour in Zanzibar was a sensory delight — we tasted fresh cinnamon, nutmeg, and lemongrass tea. The boy who climbed the coconut tree singing was a crowd favorite. Transport from Stone Town was 45 minutes late though, and the van had no air conditioning.",
  "Lake Bunyonyi canoe trip was peaceful and beautiful. Our paddler shared local legends about Punishment Island. The lodge food was bland and portions small for the price. Would love an option for a sunset paddle.",
  "Coffee farm experience near Kilimanjaro: we picked cherries, roasted beans over fire, and pounded them by hand. Best coffee I've ever had! The bathroom facilities were basic and lacked soap. The farmer family was so welcoming.",
  "Birdwatching walk at the wetlands was fantastic — we spotted over 40 species including a shoebill! Guide Grace had sharp eyes and good binoculars to lend. The booking process over WhatsApp was confusing and we got the wrong start time.",
  "Tea estate tour in Kericho was lovely. Rolling green hills, a great explanation of plucking and processing, and a tasting at the end. It was a bit rushed — only 90 minutes when we expected half a day. Would pay more for a longer version with lunch.",
  "Bush cooking class in a rural village was the most authentic thing we did. We made chapati and pilau over charcoal with Mama Wanjiru. The village had no clear parking area and our driver struggled. Our kids want to go back!",
  "Rwenzori foothills nature walk with a community guide. Waterfalls, chameleons, and a stop at a local school where kids sang for us. The path markers were faded and we briefly got lost. Please add a rain shelter halfway — we got soaked.",
  "Camel ride at sunset in Samburu was magical, and the evening fireside storytelling by elders was beautiful. Mosquitoes were brutal and no repellent was offered. Tents were clean and comfortable.",
];

const PHONE_NUMBERS = [
  "+254 712 345 678",
  "+255 784 123 456",
  "+256 772 987 654",
  "+250 788 456 321",
  "+254 733 908 112",
  "+255 754 667 890",
  "+256 701 234 567",
  "+257 79 812 345",
];

const PRESET_ANALYSIS: AnalysisResult = {
  highlight: {
    swahili: "Wageni walipenda sana mwongozo wa kirafiki na uzoefu halisi wa shamba.",
    english: "Guests loved the friendly guide and the authentic farm experience.",
  },
  fix: {
    swahili: "Boresha alama za barabara na uweke sehemu yenye kivuli kwa wageni.",
    english: "Improve road signage and add a shaded area for guests.",
  },
  opportunity: {
    swahili: "Anzisha kifurushi cha chai na vitafunio vya shamba kwa ajili ya kuuza.",
    english: "Launch a farm tea-and-snacks package to sell to visitors.",
  },
  smsDraft:
    "Asante sana for visiting us! We loved hosting you and hope to see you again. Enjoy 10% off your next visit with code GUEST10.",
  confidence: "Medium",
};

const STORAGE_KEY = "guestlens:analysis-history";
const LEGACY_STORAGE_KEY = "guestlens:last-analysis";

type Saved = { review: string; analysis: AnalysisResult; savedAt: number };
type Toast = { id: number; kind: "success" | "error"; text: string };

function readHistory(): Saved[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) return parsed as Saved[];
    }
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    return legacy ? [JSON.parse(legacy) as Saved] : [];
  } catch {
    return [];
  }
}

function saveToHistory(entry: Saved) {
  const history = readHistory();
  const withoutDuplicate = history.filter((item) => item.review !== entry.review);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...withoutDuplicate, entry]));
}

function Index() {
  const [online, setOnline] = useState(true);
  const [review, setReview] = useState("");
  const [phone, setPhone] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [fromDevice, setFromDevice] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [offlineHistory, setOfflineHistory] = useState<Saved[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const sampleIdx = useRef(0);
  const phoneIdx = useRef(0);

  const nextPhone = () => {
    const next = PHONE_NUMBERS[phoneIdx.current] ?? "";
    setPhone(next);
    phoneIdx.current = (phoneIdx.current + 1) % PHONE_NUMBERS.length;
  };

  const pushToast = (kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
  };
  const closeToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  const loadSample = () => {
    setReview(SAMPLE_REVIEWS[sampleIdx.current] ?? "");
    sampleIdx.current = (sampleIdx.current + 1) % SAMPLE_REVIEWS.length;
    nextPhone();
  };

  const showResult = (result: AnalysisResult, device: boolean) => {
    setAnalysis(result);
    setDraft(result.smsDraft);
    setFromDevice(device);
  };

  const selectSaved = (items: Saved[], index: number) => {
    const saved = items[index];
    if (!saved) return;
    setHistoryIndex(index);
    setReview(saved.review);
    showResult(saved.analysis, true);
  };

  const toggleOnline = () => {
    if (online) {
      const saved = readHistory();
      const available = saved.length
        ? saved
        : [{ review: SAMPLE_REVIEWS[0] ?? "Saved farm-tour review", analysis: PRESET_ANALYSIS, savedAt: 0 }];
      setOfflineHistory(available);
      selectSaved(available, available.length - 1);
    } else {
      setReview("");
      setAnalysis(null);
      setDraft(null);
      setFromDevice(false);
    }
    setOnline(!online);
  };

  const moveSaved = (direction: -1 | 1) => {
    if (!offlineHistory.length) return;
    const nextIndex = (historyIndex + direction + offlineHistory.length) % offlineHistory.length;
    selectSaved(offlineHistory, nextIndex);
  };

  const handleAnalyze = async () => {
    if (!online) {
      const saved = offlineHistory[historyIndex];
      if (saved) showResult(saved.analysis, true);
      return;
    }
    setAnalyzing(true);
    try {
      const result = await analyzeFeedback({ data: { review } });
      showResult(result, false);
      try {
        saveToHistory({ review, analysis: result, savedAt: Date.now() });
      } catch {
        /* storage full or unavailable */
      }
    } catch (e) {
      pushToast("error", e instanceof Error ? e.message : "Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApproveSend = () => {
    pushToast("success", `✅ SMS successfully queued to ${phone} via local gateway.`);
    setDraft(null);
  };

  const confidenceStyles: Record<string, string> = {
    High: "bg-success/15 text-success border-success/40",
    Medium: "bg-warning/15 text-warning border-warning/40",
    Low: "bg-destructive/15 text-destructive border-destructive/40",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <h1 className="text-2xl font-bold text-primary">GuestLens</h1>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-base font-semibold text-card-foreground sm:flex" aria-label="Current operator Amina">
              <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground" aria-hidden="true">●</span>
              <span>Amina</span>
            </div>
            <button
              onClick={toggleOnline}
              className="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-2 text-base font-semibold text-secondary-foreground transition-colors hover:bg-muted"
              aria-pressed={!online}
            >
              {online ? "🟢 Online" : "🟠 Offline"}
            </button>
          </div>
        </div>
        {!online && (
          <div className="bg-warning/15 px-4 py-2 text-center text-base font-medium text-warning">
            🟠 Offline (Store-and-Forward Mode) — Offline mode active. Reviews cached locally.
          </div>
        )}
      </header>

      {/* Toasts */}
      <div className="mx-auto flex max-w-2xl flex-col gap-2 px-4 pt-3" aria-live="polite">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => closeToast(t.id)} />
        ))}
      </div>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6 pb-16">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-card-foreground">1. Input Reviews</h2>
          <button
            onClick={loadSample}
            disabled={!online}
            className="mt-3 w-full rounded-xl border border-primary/40 bg-secondary px-4 py-3 text-base font-semibold text-primary transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Load Sample Yelp Review
          </button>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            readOnly={!online}
            placeholder="Paste or type a guest review here…"
            rows={6}
            className="mt-3 w-full rounded-xl border border-input bg-background px-4 py-3 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring read-only:cursor-default read-only:bg-muted"
          />
          {!online && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-secondary px-3 py-2">
              <button onClick={() => moveSaved(-1)} aria-label="Previous saved review" className="grid size-11 place-items-center rounded-lg text-2xl text-primary transition-colors hover:bg-muted">←</button>
              <span className="text-base font-semibold text-secondary-foreground">Saved review {historyIndex + 1} of {offlineHistory.length}</span>
              <button onClick={() => moveSaved(1)} aria-label="Next saved review" className="grid size-11 place-items-center rounded-lg text-2xl text-primary transition-colors hover:bg-muted">→</button>
            </div>
          )}
          <label className="mt-3 block">
            <span className="text-base font-medium text-muted-foreground">Guest SMS Number</span>
            <span className="mt-1 flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter guest number"
                className="min-w-0 flex-1 rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button type="button" onClick={nextPhone} aria-label="Load another phone number" title="Load another phone number" className="grid size-12 shrink-0 place-items-center rounded-xl border border-primary/40 bg-secondary text-xl text-primary transition-colors hover:bg-muted">↻</button>
            </span>
          </label>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-card-foreground">2. AI Insight Dashboard</h2>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || (online && !review.trim())}
            className="mt-3 w-full rounded-xl bg-primary px-4 py-3 text-base font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {analyzing ? "Analyzing…" : "Analyze Feedback"}
          </button>
          {analysis && (
            <div className="mt-4 space-y-3">
              {fromDevice && (
                <div className="inline-flex items-center rounded-full border border-warning/40 bg-warning/15 px-3 py-1.5 text-sm font-semibold text-warning">
                  ⚡ Loaded from device storage
                </div>
              )}
              <InsightCard emoji="🌟" title="Kitu Kilichopendwa (Highlight)" insight={analysis.highlight} />
              <InsightCard emoji="🛠️" title="Mabadiliko (Fix Needed)" insight={analysis.fix} />
              <InsightCard emoji="💡" title="Fursa Mpya (Opportunity)" insight={analysis.opportunity} />
            </div>
          )}
        </section>

        {analysis && draft !== null && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-card-foreground">
              3. Guest Follow-Up (Human Approval)
            </h2>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="AI-drafted SMS will appear here…"
              rows={4}
              className="mt-3 w-full rounded-xl border border-input bg-background px-4 py-3 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div
              className={`mt-3 inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold ${confidenceStyles[analysis.confidence]}`}
            >
              ⚠️ AI Confidence: {analysis.confidence} — Human Approval Required
            </div>
            <button
              onClick={handleApproveSend}
              disabled={!draft.trim()}
              className="mt-3 w-full rounded-xl bg-success px-4 py-3 text-base font-bold text-success-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Approve &amp; Send SMS
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const styles =
    toast.kind === "success"
      ? "border-success bg-success text-success-foreground"
      : "border-destructive bg-destructive text-destructive-foreground";
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-base font-semibold shadow-lg ${styles}`}
    >
      <span className="flex-1">{toast.text}</span>
      <button onClick={onClose} aria-label="Close notification" className="px-1 text-base leading-none opacity-80 hover:opacity-100">
        ✕
      </button>
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
      <h3 className="text-base font-bold text-primary">
        {emoji} {title}
      </h3>
      <p className="mt-1.5 text-base leading-relaxed text-card-foreground">
        {insight.swahili} <span className="text-muted-foreground">({insight.english})</span>
      </p>
    </div>
  );
}
