import type { FixtureBundle } from './dev-fixtures';
import type { SerializableBundle } from './bundle-loader';

export type DataSource = 'live' | 'fixtures';

export async function loadBundleFromApi(
  slug: string,
): Promise<FixtureBundle | null> {
  try {
    const r = await fetch(`/api/bundle?club=${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { ok?: boolean; bundle?: SerializableBundle };
    if (!j.ok || !j.bundle) return null;
    return {
      ...j.bundle,
      confirmedAtBySession: new Map(Object.entries(j.bundle.confirmedAtBySession ?? {})),
    };
  } catch {
    return null;
  }
}
