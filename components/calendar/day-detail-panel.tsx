import { AgendaList } from "@/components/today/agenda-list";
import type { TimeEntry } from "@/lib/db/schema";

export function DayDetailPanel({
  label,
  entries,
  timezone,
  timeFormat,
}: {
  label: string;
  entries: TimeEntry[];
  timezone: string;
  timeFormat: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <p className="mb-3 text-sm font-semibold capitalize">{label}</p>
      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          Nada registrado este día.
        </p>
      ) : (
        <AgendaList entries={entries} timezone={timezone} timeFormat={timeFormat} />
      )}
    </div>
  );
}
