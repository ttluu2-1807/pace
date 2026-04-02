import { createClient } from "@/lib/supabase/server";
import { getInjuries } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ReportInjuryModal } from "@/components/injury/ReportInjuryModal";
import { UpdateInjuryStatus } from "@/components/injury/UpdateInjuryStatus";
import { InjuryProtocolCard } from "@/components/injury/InjuryProtocolCard";
import {
  getInjuryProtocol,
  getReturnToRunEstimate,
  getTrainingModifications,
} from "@/lib/injury-intelligence";
import type { BodyRegion, InjurySeverity, InjuryStatus } from "@/lib/types";

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

const BODY_REGION_LABELS: Record<BodyRegion, string> = {
  "foot-ankle": "Foot / Ankle",
  "lower-leg": "Lower Leg",
  knee: "Knee",
  "hip-glute": "Hip / Glute",
  "lower-back": "Lower Back",
  "upper-body": "Upper Body",
  other: "Other",
};

const SEVERITY_VARIANT: Record<
  InjurySeverity,
  "default" | "secondary" | "outline" | "destructive"
> = {
  monitoring: "outline",
  mild: "secondary",
  moderate: "default",
  severe: "destructive",
};

const STATUS_VARIANT: Record<
  InjuryStatus,
  "default" | "secondary" | "outline"
> = {
  current: "default",
  recovering: "secondary",
  historical: "outline",
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ----------------------------------------------------------------
// Page
// ----------------------------------------------------------------

export default async function InjuryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const injuries = await getInjuries(user.id);

  const activeInjuries = injuries.filter(
    (i) => i.status === "current" || i.status === "recovering"
  );
  const historicalInjuries = injuries.filter(
    (i) => i.status === "historical"
  );

  // Derive training modifications from all active injuries
  const modifications = getTrainingModifications(injuries);
  const hasCriticalModification = modifications.some(
    (m) => m.severity === "critical"
  );

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Injury &amp; Recovery
          </h1>
          <p className="text-muted-foreground text-sm">
            Smart rehab guidance, personalised to your condition
          </p>
        </div>
        <ReportInjuryModal />
      </div>

      {/* ────────────────────────────────────────────────────── */}
      {/* Section 1: Active Modifications Banner               */}
      {/* ────────────────────────────────────────────────────── */}
      {modifications.length > 0 && (
        <div
          id="modifications-banner"
          className={`rounded-xl border px-4 py-3 space-y-2 ${
            hasCriticalModification
              ? "border-destructive/40 bg-destructive/5"
              : "border-amber-500/40 bg-amber-50/50 dark:bg-amber-900/10"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-semibold ${
                hasCriticalModification
                  ? "text-destructive"
                  : "text-amber-700 dark:text-amber-400"
              }`}
            >
              {hasCriticalModification
                ? "Training is currently restricted"
                : "Training is currently modified"}
            </span>
          </div>
          <ul className="space-y-1">
            {modifications.map((mod, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span
                  className={`mt-0.5 shrink-0 font-bold ${
                    mod.severity === "critical"
                      ? "text-destructive"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {mod.severity === "critical" ? "!" : "–"}
                </span>
                <span>
                  <span className="font-medium">{mod.rule}</span>
                  {mod.reason && (
                    <span className="text-muted-foreground ml-1">
                      ({mod.reason})
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <a
            href="#active-injuries"
            className="text-xs underline text-muted-foreground hover:text-foreground transition-colors"
          >
            See why →
          </a>
        </div>
      )}

      {/* ────────────────────────────────────────────────────── */}
      {/* Section 2: Active Injuries (enhanced)                 */}
      {/* ────────────────────────────────────────────────────── */}
      <div id="active-injuries" className="space-y-3">
        <h2 className="font-semibold">Active Conditions</h2>

        {activeInjuries.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground text-sm">
              No active injuries. Keep it that way!
            </CardContent>
          </Card>
        ) : (
          activeInjuries.map((injury) => {
            const protocol = getInjuryProtocol(
              injury.body_region,
              injury.condition,
              injury.severity
            );
            const returnEstimate = getReturnToRunEstimate(injury);

            return (
              <Card key={injury.id}>
                <CardContent className="py-4 space-y-4">
                  {/* ── Identity header ── */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">
                        {BODY_REGION_LABELS[injury.body_region]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {injury.condition}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Badge variant={SEVERITY_VARIANT[injury.severity]}>
                        {capitalize(injury.severity)}
                      </Badge>
                      <Badge variant={STATUS_VARIANT[injury.status]}>
                        {capitalize(injury.status)}
                      </Badge>
                    </div>
                  </div>

                  {/* ── Notes ── */}
                  {injury.notes && (
                    <>
                      <Separator />
                      <p className="text-sm text-muted-foreground">
                        {injury.notes}
                      </p>
                    </>
                  )}

                  <Separator />

                  {/* ── Protocol card ── */}
                  <InjuryProtocolCard
                    protocol={protocol}
                    severity={injury.severity}
                    status={injury.status}
                    returnEstimate={returnEstimate}
                  />

                  <Separator />

                  {/* ── Status update ── */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Update status:
                    </span>
                    <UpdateInjuryStatus
                      injuryId={injury.id}
                      currentStatus={injury.status}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* ────────────────────────────────────────────────────── */}
      {/* Section 3: Training Modifications Detail              */}
      {/* ────────────────────────────────────────────────────── */}
      {modifications.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">How this affects your training</h2>
          <Card>
            <CardContent className="py-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                The rules below are derived from your active conditions. All
                modifications are automatically considered in your training plan.
              </p>
              <div className="space-y-3">
                {modifications.map((mod, i) => (
                  <div key={i} className="space-y-0.5">
                    <div className="flex items-start gap-2">
                      <span
                        className={`text-xs mt-0.5 shrink-0 font-bold ${
                          mod.severity === "critical"
                            ? "text-destructive"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {mod.severity === "critical" ? "!" : "–"}
                      </span>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{mod.rule}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Why: </span>
                          {mod.reason}
                        </p>
                      </div>
                    </div>
                    {i < modifications.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ────────────────────────────────────────────────────── */}
      {/* Section 4: Recovery Resources                         */}
      {/* ────────────────────────────────────────────────────── */}
      {activeInjuries.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Prevention &amp; Long-Term Health</h2>
          {activeInjuries.map((injury) => {
            const protocol = getInjuryProtocol(
              injury.body_region,
              injury.condition,
              injury.severity
            );
            return (
              <Card key={`prevention-${injury.id}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {protocol.condition} — Prevention Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ul className="space-y-1">
                    {protocol.preventionTips.map((tip, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-muted-foreground"
                      >
                        <span className="mt-0.5 shrink-0 text-foreground/50">
                          •
                        </span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ────────────────────────────────────────────────────── */}
      {/* Section 5: Historical                                 */}
      {/* ────────────────────────────────────────────────────── */}
      {historicalInjuries.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-muted-foreground">History</h2>
          {historicalInjuries.map((injury) => (
            <Card key={injury.id} className="opacity-60">
              <CardContent className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {BODY_REGION_LABELS[injury.body_region]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {injury.condition}
                    </p>
                  </div>
                  <Badge variant="secondary">Historical</Badge>
                </div>
                <UpdateInjuryStatus
                  injuryId={injury.id}
                  currentStatus={injury.status}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Summary Stats ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Injury Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{activeInjuries.length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {injuries.filter((i) => i.status === "recovering").length}
              </p>
              <p className="text-xs text-muted-foreground">Recovering</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{historicalInjuries.length}</p>
              <p className="text-xs text-muted-foreground">Historical</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Disclaimer ── */}
      <p className="text-xs text-muted-foreground">
        PACE uses your self-reported injury information to provide evidence-based
        rehab guidance and modify training recommendations. This is not medical
        advice. For diagnosis, imaging, and treatment, consult a qualified sports
        medicine professional or physiotherapist.
      </p>
    </div>
  );
}
