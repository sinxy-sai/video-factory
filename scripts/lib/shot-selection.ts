import type {ShotBrief} from '../../content/shot-brief';

export const SHOT_FLAG = '--shot';

/**
 * Read the optional `--shot <shot-id>` selector. A missing value or repeated
 * flag is a usage error rather than a silently ignored argument, because the
 * commands would otherwise render the whole episode during a single-shot
 * iteration loop.
 */
export function parseShotFlag(args: string[]): string | null {
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== SHOT_FLAG) continue;
    const value = args[index + 1];
    if (!value || value.startsWith('--')) throw new Error('--shot requires a shot id, for example: --shot shot-001');
    values.push(value);
    index += 1;
  }
  if (values.length > 1) throw new Error('--shot accepts exactly one shot id');
  return values[0] ?? null;
}

export function resolveShotBriefs(briefs: ShotBrief[], shotId: string): ShotBrief[] {
  const selected = briefs.filter((brief) => brief.id === shotId);
  if (selected.length === 0) {
    const available = briefs.map((brief) => brief.id).join(', ') || 'none';
    throw new Error(`Unknown shot "${shotId}". Available shots: ${available}`);
  }
  return selected;
}

/** Filter shot briefs by an optional `--shot` flag; no flag means every shot. */
export function selectShotBriefs(briefs: ShotBrief[], args: string[]): ShotBrief[] {
  const requested = parseShotFlag(args);
  return requested ? resolveShotBriefs(briefs, requested) : briefs;
}