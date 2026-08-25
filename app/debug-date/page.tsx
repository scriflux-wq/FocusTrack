"use client";

import { useEffect, useState } from "react";
import { toZonedTime } from "date-fns-tz";
import { getDayRange, getWeekRange } from "@/lib/calendar/date-utils";

export default function DebugDatePage() {
  const [info, setInfo] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    async function run() {
      const now = new Date();
      const tz = "Europe/Madrid";
      const zoned = toZonedTime(now, tz);
      const day = getDayRange(now, tz);
      const week1 = getWeekRange(now, tz, 1);
      const week0 = getWeekRange(now, tz, 0);

      let serverDate = "?";
      try {
        const r = await fetch(window.location.href, { method: "HEAD", cache: "no-store" });
        serverDate = r.headers.get("date") ?? "(no date header)";
      } catch {
        serverDate = "(fetch failed)";
      }

      // One-shot client-only diagnostic snapshot (needs `navigator`, unavailable
      // during SSR) — not a case of syncing to an external store that changes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInfo({
        "SERVER date header (ground truth)": serverDate,
        "navigator.userAgent": navigator.userAgent,
        "Intl detected timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
        "new Date().toString() (device clock)": now.toString(),
        "new Date().toISOString() (UTC)": now.toISOString(),
        "getTimezoneOffset (min)": String(now.getTimezoneOffset()),
        "toZonedTime(now, Europe/Madrid).toString()": zoned.toString(),
        "  -> getDate() (day of month)": String(zoned.getDate()),
        "  -> getDay() (0=Sun)": String(zoned.getDay()),
        "  -> getHours()": String(zoned.getHours()),
        "getDayRange(now).start (UTC)": day.start.toISOString(),
        "getDayRange(now).end (UTC)": day.end.toISOString(),
        "getWeekRange(now, weekStartsOn=1).start (UTC)": week1.start.toISOString(),
        "getWeekRange(now, weekStartsOn=0).start (UTC)": week0.start.toISOString(),
      });
    }
    run();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "monospace", fontSize: 13, whiteSpace: "pre-wrap" }}>
      <h1 style={{ fontSize: 18, marginBottom: 16 }}>Diagnóstico de fecha/hora</h1>
      {!info && <p>Cargando…</p>}
      {info &&
        Object.entries(info).map(([k, v]) => (
          <div key={k} style={{ marginBottom: 10 }}>
            <div style={{ color: "#666" }}>{k}</div>
            <div style={{ fontWeight: "bold" }}>{v}</div>
          </div>
        ))}
    </div>
  );
}
