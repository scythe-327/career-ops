import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('data/outreach.tsv', 'utf-8');

// Fix corruption: Neha's entry runs into Distribusion entry without newline
const fixed = content.replace(
  /(exploring opportunities at Optum)(2026-06-12\tDistribusion)/,
  '$1\n$2'
);

// Reset the 7 incorrectly-flagged entries back to draft
const lines = fixed.split('\n');
const validEmails = [
  'amandeep.shergill@automattic.com',
  'tanya@gohighlevel.com',
  'bobby@gohighlevel.com',
  'contact@rayatheapp.com',
  'alan.price@deel.com',
  'huw.sensier@deel.com',
  'talent@distribusion.com',
];

for (let i = 0; i < lines.length; i++) {
  const cols = lines[i].split('\t');
  if (cols[6] === 'invalid_email' && validEmails.includes(cols[4])) {
    cols[6] = 'draft';
    lines[i] = cols.join('\t');
    console.log('Reset to draft:', cols[1], cols[4]);
  }
}

// Check if Distribusion talent@ entry is separate
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('talent@distribusion.com')) {
    const cols = lines[i].split('\t');
    console.log('Distribusion entry found at line', i+1, 'status:', cols[6]);
  }
}

writeFileSync('data/outreach.tsv', lines.join('\n'), 'utf-8');
console.log('TSV fixed successfully');
console.log('Total lines:', lines.length);
