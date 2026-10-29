import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {
  MINIMUM_PLANNING_CHARACTERS,
  approveEpisodePlanning,
  inspectPlanningForApproval,
} from '../lib/episode-approval';

const frontMatter = (state: string) => `---\nstate: ${state}\napprovals:\n  content: false\n  storyboard: false\n  shot-design: false\n---\n\n`;

const authoredBody = (title: string, subject: string) => [
  `# ${title}`,
  '',
  `${subject}这一段记录受众、学习目标、事实边界、旁白结构和资料来源，确保后续镜头设计有可追溯的内容依据。`.repeat(4),
  '',
  '## 结构',
  '',
  `第二个段落描述镜头顺序、视觉关系、连续性、字幕意图和制作假设，避免用重复段落凑长度。`.repeat(4),
  '',
].join('\n');

const writePlan = (root: string, file: string, content: string) => {
  writeFileSync(join(root, 'content', 'episodes', 'demo-topic', file), content, 'utf8');
};

const root = mkdtempSync(join(tmpdir(), 'science-video-approval-'));
try {
  mkdirSync(join(root, 'content', 'episodes', 'demo-topic'), {recursive: true});

  const missing = inspectPlanningForApproval('demo-topic', root);
  assert.equal(missing.loaded, false);
  assert.equal(missing.issues.length, 1);
  assert.throws(() => approveEpisodePlanning('demo-topic', {projectRoot: root}), /missing content-plan\.md/);

  writePlan(root, 'content-plan.md', `${frontMatter('discussion')}${authoredBody('Demo Content Plan', '内容计划')}`);
  writePlan(root, 'shot-design.md', `${frontMatter('discussion')}TODO: finish shot design`);

  const placeholderIssues = inspectPlanningForApproval('demo-topic', root);
  assert.equal(placeholderIssues.loaded, true);
  assert.equal(placeholderIssues.issues.some((issue) => /shot-design\.md: still contains placeholder text/.test(issue)), true);
  assert.throws(() => approveEpisodePlanning('demo-topic', {projectRoot: root}), /placeholder text/);

  writePlan(root, 'shot-design.md', `${frontMatter('discussion')}太短。`);
  const shortIssues = inspectPlanningForApproval('demo-topic', root);
  assert.equal(shortIssues.issues.some((issue) => issue.includes(`at least ${MINIMUM_PLANNING_CHARACTERS}`)), true);
  assert.throws(() => approveEpisodePlanning('demo-topic', {projectRoot: root}), /at least 300/);

  writePlan(root, 'shot-design.md', `${frontMatter('discussion')}${authoredBody('Demo Shot Design', '分镜设计')}`);
  writePlan(root, 'content-plan.md', `${frontMatter('discussion')}${authoredBody('Demo Content Plan', '内容计划')}`);

  const first = approveEpisodePlanning('demo-topic', {projectRoot: root});
  assert.equal(first.changed, true);
  assert.equal(first.state, 'shot-design-approved');
  assert.deepEqual(first.approvals, {content: true, storyboard: true, shotDesign: true});
  assert.equal(first.documents.length, 2);

  const contentPlan = readFileSync(join(root, 'content', 'episodes', 'demo-topic', 'content-plan.md'), 'utf8');
  assert.match(contentPlan, /^---\nstate: shot-design-approved\napprovals:\n {2}content: true\n {2}storyboard: true\n {2}shot-design: true\n---\n/);
  assert.equal(contentPlan.includes('# Demo Content Plan'), true, 'approval must preserve the authored body');

  const second = approveEpisodePlanning('demo-topic', {projectRoot: root});
  assert.equal(second.changed, false, 're-approving an approved episode must be a no-op');

  const later = approveEpisodePlanning('demo-topic', {projectRoot: root, state: 'final-render'});
  assert.equal(later.state, 'final-render');
  assert.match(readFileSync(join(root, 'content', 'episodes', 'demo-topic', 'shot-design.md'), 'utf8'), /state: final-render/);

  assert.throws(() => approveEpisodePlanning('demo-topic', {projectRoot: root, state: 'discussion'}), /Unknown approval state/);
  assert.throws(() => approveEpisodePlanning('demo-topic', {projectRoot: root, state: 'nope'}), /Unknown approval state/);
  assert.throws(() => approveEpisodePlanning('../outside', {projectRoot: root}), /Invalid episode id/);

  writePlan(root, 'content-plan.md', `${frontMatter('discussion').replace(/\n/g, '\r\n')}${authoredBody('CRLF Plan', '换行符').replace(/\n/g, '\r\n')}`);
  writePlan(root, 'shot-design.md', `${frontMatter('discussion').replace(/\n/g, '\r\n')}${authoredBody('CRLF Shot Design', '换行符').replace(/\n/g, '\r\n')}`);
  approveEpisodePlanning('demo-topic', {projectRoot: root});
  const crlf = readFileSync(join(root, 'content', 'episodes', 'demo-topic', 'content-plan.md'), 'utf8');
  assert.equal(crlf.includes('\r\n'), true, 'approval must preserve CRLF documents');

  console.log('episode approval gate validates planning content and writes approved front matter');
} finally {
  rmSync(root, {recursive: true, force: true});
}