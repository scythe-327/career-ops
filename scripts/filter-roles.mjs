#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const data = JSON.parse(readFileSync(path.join(ROOT, 'data', 'yc-jobs.json'), 'utf-8'));

// Engineering/tech roles to KEEP
const KEEP_ROLES = new Set([
  'full stack', 'backend', 'frontend', 'devops', 'machine learning',
  'data science', 'embedded systems', 'hardware', 'qa engineer',
  'robotics', 'engineering manager', 'android', 'ios',
  'electrical', 'mechanical', 'research',
]);

// Engineering/tech title keywords
const KEEP_TITLES = [
  /software engineer/i, /sde\b/i, /full.?stack/i, /backend/i, /frontend/i,
  /devops/i, /sre\b/i, /platform engineer/i, /infrastructure/i,
  /machine learning/i, /ml engineer/i, /ai engineer/i, /ai\b.*engineer/i,
  /data engineer/i, /data scientist/i, /data analyst/i,
  /systems? engineer/i, /network engineer/i, /security engineer/i,
  /cloud engineer/i, /site reliability/i,
  /founding engineer/i, /staff engineer/i, /principal engineer/i,
  /senior engineer/i, /lead engineer/i, /software developer/i,
  /app developer/i, /mobile engineer/i, /ios engineer/i, /android engineer/i,
  /embedded/i, /firmware/i, /hardware engineer/i, /electrical engineer/i,
  /mechanical engineer/i, /robotics/i, /qa engineer/i, /test engineer/i,
  /solutions engineer/i, /research engineer/i, /applied scientist/i,
  /engineering manager/i, /engineering lead/i, /engineering trainee/i,
  /front.?end/i, /back.?end/i,
  /game developer/i, /game engineer/i,
  /developer advocate/i, /devrel/i,
  /data infrastructure/i, /data platform/i,
  /llm/i, /nlp/i, /computer vision/i, /cuda/i,
  /tech lead/i, /technical lead/i,
  /cad\b/i, /pcb/i, /fpga/i,
  /head of engineering/i, /vp of engineering/i,
  /cto\b/i, /chief technology/i,
  /ci\/cd/i, /release engineer/i,
  /blockchain/i, /web3/i,
];

const KEEP_COMPANIES = new Set([
  'DoorDash', 'Instawork', 'Circle Medical', 'Ashby', 'Roboflow',
]);

function isTechJob(job) {
  const role = (job.role || '').toLowerCase().trim();
  const title = job.title || '';
  const company = job.company || '';

  // Keep by role
  if (KEEP_ROLES.has(role)) return true;

  // Keep by company (known tech companies)
  if (KEEP_COMPANIES.has(company)) return true;

  // Keep by title keywords
  for (const rx of KEEP_TITLES) {
    if (rx.test(title)) return true;
  }

  return false;
}

const before = data.jobs.length;
const filtered = data.jobs.filter(isTechJob);
const removed = before - filtered.length;

console.log(`\n🔍 Role filter: ${before} → ${filtered.length} jobs (removed ${removed})\n`);

// Show removed sample
if (removed > 0) {
  const removedJobs = data.jobs.filter(j => !isTechJob(j));
  console.log('Removed sample:');
  removedJobs.slice(0, 15).forEach((j, i) =>
    console.log(`  ${i+1}. [${j.role || '?'}] ${j.company} - ${j.title}`)
  );
  if (removedJobs.length > 15) console.log(`  ... and ${removedJobs.length - 15} more`);
  console.log('');
}

// Save
const jsonPath = path.join(ROOT, 'data', 'yc-jobs.json');
writeFileSync(jsonPath, JSON.stringify({ total: filtered.length, jobs: filtered }, null, 2), 'utf-8');

const headers = ['id','title','company','location','job_type','role','salary','batch','oneliner','url'];
const escapeCsv = v => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')
    ? `"${s.replace(/"/g, '""')}"` : s;
};
const csvPath = path.join(ROOT, 'data', 'yc-jobs.csv');
const lines = [headers.join(',')];
for (const j of filtered) {
  lines.push(headers.map(h => escapeCsv(j[h])).join(','));
}
writeFileSync(csvPath, '\uFEFF' + lines.join('\r\n'), 'utf-8');

console.log('💾 Updated JSON + CSV\n');

// Summary
const types = {};
filtered.forEach(x => { types[x.job_type] = (types[x.job_type] || 0) + 1 });
console.log('By type:', Object.entries(types).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}: ${v}`).join(', '));

const roles = {};
filtered.forEach(x => { const r = x.role || 'Unknown'; roles[r] = (roles[r] || 0) + 1 });
console.log('By role:', Object.entries(roles).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}: ${v}`).join(', '));

const remote = filtered.filter(x => (x.location||'').toLowerCase().includes('remote')).length;
const us = filtered.filter(x => (x.location||'').toLowerCase().match(/us|united states|san francisco|new york|austin|seattle|boston|los angeles/i)).length;
const india = filtered.filter(x => (x.location||'').toLowerCase().match(/india|bengaluru|bangalore|hyderabad|mumbai|delhi|pune|chennai|gurgaon/i)).length;
console.log(`Remote: ${remote}, US: ${us}, India: ${india}`);
