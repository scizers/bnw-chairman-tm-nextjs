const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export const getTodayCutoff = (now: Date = new Date()) => {
  const cutoff = new Date(now);
  cutoff.setHours(22, 0, 0, 0);
  return cutoff;
};

export const canEditReport = (reportCreatedAt?: string | Date, now: Date = new Date()) => {
  if (!reportCreatedAt) return false;
  const createdAt = reportCreatedAt instanceof Date ? reportCreatedAt : new Date(reportCreatedAt);
  if (Number.isNaN(createdAt.getTime())) return false;
  const editUntil = new Date(createdAt.getTime() + TWO_HOURS_MS);
  const cutoff = getTodayCutoff(now);
  return now.getTime() < editUntil.getTime() && now.getTime() <= cutoff.getTime();
};
