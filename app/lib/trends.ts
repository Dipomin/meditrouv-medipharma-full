/**
 * Tendances d'alertes (fonctions pures, sans React Native).
 * Testables en Node (`__tests__/trends.test.ts`).
 */

export type DayBucket = {
  /** Clé « AAAA-MM-JJ ». */
  key: string;
  /** Libellé court (« Auj. », « lun. », « 5 »). */
  label: string;
  count: number;
};

const keyOf = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/**
 * Ventile des éléments datés sur les `days` derniers jours (aujourd'hui
 * inclus), du plus ancien au plus récent. Dates illisibles ignorées.
 */
export const bucketByDay = (
  items: readonly { createdAt: string }[],
  days: number,
  now: Date = new Date()
): DayBucket[] => {
  const span = Math.max(1, Math.floor(days));
  const buckets = new Map<string, number>();
  const ordered: DayBucket[] = [];
  for (let offset = span - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    const key = keyOf(date);
    buckets.set(key, 0);
    const label =
      offset === 0
        ? "Auj."
        : span <= 7
          ? date
              .toLocaleDateString("fr-FR", { weekday: "short" })
              .replace(".", "")
          : String(date.getDate());
    ordered.push({ key, label, count: 0 });
  }
  for (const item of items) {
    const date = new Date(item.createdAt);
    if (Number.isNaN(date.getTime())) {
      continue;
    }
    const key = keyOf(date);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }
  return ordered.map((bucket) => ({
    ...bucket,
    count: buckets.get(bucket.key) ?? 0,
  }));
};

/** Total d'un découpage journalier. */
export const bucketTotal = (buckets: readonly DayBucket[]): number =>
  buckets.reduce((total, bucket) => total + bucket.count, 0);
