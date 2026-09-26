const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

/** Date + heure de début/fin d'une tâche planifiée. Les heures utilisent
 * deux <select> (heure 00-23, minute par pas de 5) plutôt qu'un
 * <input type="time"> natif — celui-ci suit le fuseau/la locale du
 * navigateur (AM/PM pour certains utilisateurs) et s'est révélé peu
 * fiable sur mobile ; les select garantissent un horaire "européen"
 * (24h) sans ambiguïté, identique pour tout le monde. */
export function ScheduleFields({
  idPrefix,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
}: {
  idPrefix: string;
  defaultDate?: string | null;
  /** "HH:MM", ou null si non planifiée. */
  defaultStartTime?: string | null;
  defaultEndTime?: string | null;
}) {
  const [defaultStartHour, defaultStartMinute] = (defaultStartTime ?? "").split(":");
  const [defaultEndHour, defaultEndMinute] = (defaultEndTime ?? "").split(":");

  return (
    <div>
      <label className="field-label" htmlFor={`${idPrefix}ScheduledDate`}>
        Planifier le (optionnel)
      </label>
      <div className="mt-1 space-y-2">
        <input
          id={`${idPrefix}ScheduledDate`}
          name="scheduledDate"
          type="date"
          defaultValue={defaultDate ?? ""}
          className="field-input mt-0"
        />
        <div className="flex flex-wrap items-center gap-1.5 text-[14px] text-[#1d1d1f]">
          <span className="text-[#6e6e73]">De</span>
          <select
            name="startHour"
            defaultValue={defaultStartHour ?? ""}
            aria-label="Heure de début"
            className="field-input mt-0 w-auto"
          >
            <option value="">—</option>
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {h}h
              </option>
            ))}
          </select>
          <span>:</span>
          <select
            name="startMinute"
            defaultValue={defaultStartMinute ?? "00"}
            aria-label="Minute de début"
            className="field-input mt-0 w-auto"
          >
            {MINUTES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <span className="text-[#6e6e73]">à</span>
          <select
            name="endHour"
            defaultValue={defaultEndHour ?? ""}
            aria-label="Heure de fin"
            className="field-input mt-0 w-auto"
          >
            <option value="">—</option>
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {h}h
              </option>
            ))}
          </select>
          <span>:</span>
          <select
            name="endMinute"
            defaultValue={defaultEndMinute ?? "00"}
            aria-label="Minute de fin"
            className="field-input mt-0 w-auto"
          >
            {MINUTES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
