const ISO_DATE_LENGTH = 'YYYY-MM-DD'.length;

// Deadlines are calendar dates compared in UTC so results never depend on the server's timezone.
export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, ISO_DATE_LENGTH);
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, ISO_DATE_LENGTH);
}
