import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const checklistItems = [
  'Create event and confirm it is visible in event listings',
  'Register attendee and confirm ticket generation + notification',
  'Open tickets page and verify ticket status/details',
  'Post event discussion message and verify persistence',
  'Create poll and confirm voting updates results',
  'Join community and verify membership relationship',
  'Post to community feed and verify visibility for members',
  'Send organizer announcement and verify attendee banner visibility',
  'Create organizer webhook and verify it is listed with secret metadata',
  'Open networking and complete request/respond/remove flow',
];

function parseArgs(argv) {
  const args = {
    output: '.phase3-manual-verify.md',
    includeExtended: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--output' && argv[i + 1]) {
      args.output = argv[i + 1];
      i += 1;
    } else if (token === '--extended') {
      args.includeExtended = true;
    }
  }

  return args;
}

const { output, includeExtended } = parseArgs(process.argv);
const rootChecklistPath = resolve(process.cwd(), '..', 'QA-CHECKLIST.md');
let sourceHint = 'Default Phase 3 checklist';

if (existsSync(rootChecklistPath)) {
  sourceHint = `Derived from ${rootChecklistPath}`;
}

const lines = [
  '# Phase 3 Manual Verification Runbook',
  '',
  `Generated: ${new Date().toISOString()}`,
  `Source: ${sourceHint}`,
  '',
  '## Core Flows',
  ...checklistItems.map((item) => `- [ ] ${item}`),
  '',
  '## Notes',
  '- Environment tested:',
  '- Tester:',
  '- Blocking issues found:',
  '- Non-blocking issues found:',
  '',
];

if (includeExtended && existsSync(rootChecklistPath)) {
  const source = readFileSync(rootChecklistPath, 'utf8');
  lines.push('## Extended Reference', '```markdown', source, '```', '');
}

const outputPath = resolve(process.cwd(), output);
writeFileSync(outputPath, lines.join('\n'), 'utf8');

console.log('PHASE3_VERIFY_CHECKLIST_READY');
console.log(`Output: ${outputPath}`);
console.log('Checklist summary:');
for (const item of checklistItems) {
  console.log(`- [ ] ${item}`);
}
