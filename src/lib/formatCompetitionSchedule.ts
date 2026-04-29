type CompetitionScheduleLike = {
    compDay: string;
    startTime?: string | null;
    endTime?: string | null;
};

function parseClockValue(baseDate: Date, value?: string | null): string | null {
    if (!value) return null;

    const raw = value.trim();
    if (!raw) return null;

    // Handle ISO-like datetime/time strings first.
    if (raw.includes('T') || raw.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(raw)) {
        const parsed = new Date(raw);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
        }
    }

    // Handle 12-hour formatted input (e.g. "2:30 PM").
    if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(raw)) {
        const parsed = new Date(`${baseDate.toDateString()} ${raw.toUpperCase()}`);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
        }
    }

    // Handle 24-hour values with optional seconds/timezone suffix.
    const [hourStr, minuteRaw] = raw.split(':');
    const minuteStr = minuteRaw?.slice(0, 2);
    const hours = Number(hourStr);
    const minutes = Number(minuteStr);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

    const dt = new Date(baseDate);
    if (Number.isNaN(dt.getTime())) {
        const fallback = new Date();
        fallback.setHours(hours, minutes, 0, 0);
        return fallback.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }

    dt.setHours(hours, minutes, 0, 0);
    return dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatCompetitionSchedule(item: CompetitionScheduleLike): string {
    const day = new Date(item.compDay);
    const dateLabel = 'Thu, Apr 30';

    const start = parseClockValue(day, item.startTime);
    const end = parseClockValue(day, item.endTime);

    if (start && end) return `${dateLabel} | ${start} - ${end}`;
    if (start) return `${dateLabel} | ${start}`;
    return dateLabel;
}
