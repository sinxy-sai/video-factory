import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {
  applyPlanningApproval,
  approvedPlanningStates,
  isApprovedPlanningState,
  loadPlanningDocuments,
  planningApprovalsSchema,
  planningStateSchema,
  splitPlanningFrontMatter,
  type PlanningApprovals,
  type PlanningDocument,
  type PlanningState,
} from '../../production/planning';
import {assertEpisodeId} from './episode-id';
import {containsPlaceholder} from './placeholder-terms';

/** Minimum authored body (Markdown, whitespace stripped) for either plan file. */
export const MINIMUM_PLANNING_CHARACTERS = 300;
export const MINIMUM_PLANNING_PARAGRAPHS = 2;
export const DEFAULT_APPROVAL_STATE: PlanningState = 'shot-design-approved';

export const allPlanningApprovals: PlanningApprovals = {
  content: true,
  storyboard: true,
  shotDesign: true,
};

export type PlanningInspection = {
  episodeId: string;
  loaded: boolean;
  documents: Array<{file: string; characters: number; state: PlanningState; approvals: PlanningApprovals}>;
  issues: string[];
};

export type EpisodeApprovalResult = {
  episodeId: string;
  state: PlanningState;
  approvals: PlanningApprovals;
  changed: boolean;
  documents: Array<{file: string; characters: number}>;
};

const planningFiles = ['content-plan.md', 'shot-design.md'] as const;

function planningBody(text: string, path: string): string {
  return splitPlanningFrontMatter(text, path).body;
}

function bodyCharacters(text: string, path: string): number {
  return planningBody(text, path).replace(/\s+/g, '').length;
}

function bodyParagraphs(text: string, path: string): string[] {
  return planningBody(text, path).split(/\r?\n\s*\r?\n/).map((part) => part.trim()).filter(Boolean);
}

/**
 * Read both plan documents and report every reason they are not ready for
 * approval. Missing or malformed files are reported as issues instead of
 * throwing so `episode-status` can display them alongside the rest of the
 * pipeline state.
 */
export function inspectPlanningForApproval(episodeId: string, projectRoot = process.cwd()): PlanningInspection {
  const inspection: PlanningInspection = {episodeId, loaded: false, documents: [], issues: []};
  let documents;
  try {
    documents = loadPlanningDocuments(episodeId, projectRoot);
  } catch (error) {
    inspection.issues.push(error instanceof Error ? error.message : String(error));
    return inspection;
  }
  inspection.loaded = true;
  const pairs: Array<[string, PlanningDocument]> = [
    ['content-plan.md', documents.contentPlan],
    ['shot-design.md', documents.shotDesign],
  ];
  for (const [file, document] of pairs) {
    const path = `${episodeId}/${file}`;
    const characters = bodyCharacters(document.text, path);
    const paragraphs = bodyParagraphs(document.text, path);
    inspection.documents.push({
      file,
      characters,
      state: document.frontMatter.state,
      approvals: document.frontMatter.approvals,
    });
    if (paragraphs.length === 0) {
      inspection.issues.push(`${file}: body is empty; document the planning material before approving`);
      continue;
    }
    if (containsPlaceholder(document.text)) {
      inspection.issues.push(`${file}: still contains placeholder text`);
    }
    if (characters < MINIMUM_PLANNING_CHARACTERS) {
      inspection.issues.push(`${file}: body has ${characters} characters; at least ${MINIMUM_PLANNING_CHARACTERS} are required`);
    }
    if (paragraphs.length < MINIMUM_PLANNING_PARAGRAPHS) {
      inspection.issues.push(`${file}: body has ${paragraphs.length} paragraph(s); at least ${MINIMUM_PLANNING_PARAGRAPHS} are required`);
    }
  }
  return inspection;
}

function parseApprovalState(value: string | undefined): PlanningState {
  const candidate = value ?? DEFAULT_APPROVAL_STATE;
  const parsed = planningStateSchema.safeParse(candidate);
  if (!parsed.success || !isApprovedPlanningState(parsed.data)) {
    throw new Error(`Unknown approval state "${candidate}". Allowed states: ${approvedPlanningStates.join(', ')}`);
  }
  return parsed.data;
}

/**
 * Gate planning approval: both documents must be authored (present, non-empty,
 * placeholder-free, with a real body), then their front matter is rewritten to
 * the requested approved state with every approval flag set to true.
 */
export function approveEpisodePlanning(
  episodeId: string,
  options: {projectRoot?: string; state?: string} = {},
): EpisodeApprovalResult {
  const safeId = assertEpisodeId(episodeId);
  const projectRoot = resolve(options.projectRoot ?? process.cwd());
  const state = parseApprovalState(options.state);
  const inspection = inspectPlanningForApproval(safeId, projectRoot);
  if (!inspection.loaded || inspection.issues.length > 0) {
    throw new Error(`Cannot approve ${safeId}:\n- ${inspection.issues.join('\n- ')}`);
  }

  const documents = loadPlanningDocuments(safeId, projectRoot);
  const source = [documents.contentPlan, documents.shotDesign];
  let changed = false;
  for (const [index, document] of source.entries()) {
    const file = planningFiles[index];
    const updated = applyPlanningApproval(document.text, `${safeId}/${file}`, state, allPlanningApprovals);
    if (updated !== document.text) {
      writeFileSync(document.path, updated, 'utf8');
      changed = true;
    }
  }

  const verified = loadPlanningDocuments(safeId, projectRoot);
  for (const [index, document] of [verified.contentPlan, verified.shotDesign].entries()) {
    const {state: writtenState, approvals} = document.frontMatter;
    const expected = planningApprovalsSchema.parse(allPlanningApprovals);
    if (writtenState !== state || approvals.content !== expected.content || approvals.storyboard !== expected.storyboard || approvals.shotDesign !== expected.shotDesign) {
      throw new Error(`${safeId}/${planningFiles[index]}: failed to persist planning approval front matter`);
    }
  }

  return {
    episodeId: safeId,
    state,
    approvals: {...allPlanningApprovals},
    changed,
    documents: source.map((document, index) => ({
      file: planningFiles[index],
      characters: bodyCharacters(document.text, `${safeId}/${planningFiles[index]}`),
    })),
  };
}