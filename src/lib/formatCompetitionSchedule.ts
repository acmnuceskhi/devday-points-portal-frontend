type CompetitionScheduleLike = {
    compDay: string;
    startTime?: string | null;
    endTime?: string | null;
};

const PAKISTAN_TIMEZONE = 'Asia/Karachi';

function parseCompetitionDay(value: string): Date {
    const raw = value.trim();
    if (!raw) return new Date(NaN);

    // If the backend sends a date-only string (YYYY-MM-DD), pin it to midnight in PKT
    // to avoid off-by-one day issues when the viewer is in a different timezone.
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return new Date(`${raw}T00:00:00+05:00`);
    }

    return new Date(raw);
}

function formatClock(hours: number, minutes: number): string {
    const safeHours = ((hours % 24) + 24) % 24;
    const safeMinutes = ((minutes % 60) + 60) % 60;
    const suffix = safeHours >= 12 ? 'PM' : 'AM';
    const hour12 = safeHours % 12 || 12;
    return `${hour12}:${String(safeMinutes).padStart(2, '0')} ${suffix}`;
}

function formatTimeInPakistan(dt: Date): string {
    return dt.toLocaleTimeString(undefined, {
        timeZone: PAKISTAN_TIMEZONE,
        hour: 'numeric',
        minute: '2-digit',
    });
}

function formatTimeFromIso(raw: string, dt: Date): string {
    // Important: some backend fields are stored as UTC timestamps but represent *Pakistan wall-clock*
    // times (e.g. "2026-04-30T08:30:00.000Z" should render as 8:30 AM, not 1:30 PM).
    // If the value explicitly ends with "Z", format in UTC to preserve the wall-clock portion.
    if (/[zZ]$/.test(raw)) {
        return dt.toLocaleTimeString(undefined, { timeZone: 'UTC', hour: 'numeric', minute: '2-digit' });
    }

    // Otherwise, respect the timestamp's offset by formatting in Pakistan time.
    return formatTimeInPakistan(dt);
}

function parseClockValue(baseDate: Date, value?: string | null): string | null {
    if (!value) return null;

    const raw = value.trim();
    if (!raw) return null;

    // Handle ISO-like datetime/time strings first.
    if (raw.includes('T') || raw.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(raw)) {
        const parsed = new Date(raw);
        if (!Number.isNaN(parsed.getTime())) {
            return formatTimeFromIso(raw, parsed);
        }
    }

    // Handle 12-hour formatted input (e.g. "2:30 PM").
    if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(raw)) {
        // Normalize and return the clock value directly (treat as PK local wall-clock).
        const [timePart, ampmRaw] = raw.toUpperCase().split(/\s+/);
        const [hStr, mStr] = timePart.split(':');
        const hours = Number(hStr);
        const minutes = Number(mStr);
        if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
        const ampm = ampmRaw === 'PM' ? 'PM' : 'AM';
        const hour24 = ampm === 'PM' ? (hours % 12) + 12 : hours % 12;
        return formatClock(hour24, minutes);
    }

    // Handle 24-hour values with optional seconds/timezone suffix.
    const [hourStr, minuteRaw] = raw.split(':');
    const minuteStr = minuteRaw?.slice(0, 2);
    const hours = Number(hourStr);
    const minutes = Number(minuteStr);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

    // Treat bare "HH:mm" as PK local wall-clock time rather than applying viewer timezone conversions.
    // (If the backend later sends ISO timestamps instead, the ISO branch above will handle TZ conversion.)
    void baseDate; // baseDate kept for API compatibility / potential future use.
    return formatClock(hours, minutes);
}

export function formatCompetitionSchedule(item: CompetitionScheduleLike): string {
    const day = parseCompetitionDay(item.compDay);
    const dateLabel = Number.isNaN(day.getTime())
        ? 'Date TBA'
        : day.toLocaleDateString(undefined, {
            timeZone: PAKISTAN_TIMEZONE,
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });

    const start = parseClockValue(day, item.startTime);
    const end = parseClockValue(day, item.endTime);

    if (start && end) return `${dateLabel} | ${start} - ${end}`;
    if (start) return `${dateLabel} | ${start}`;
    return dateLabel;
}
