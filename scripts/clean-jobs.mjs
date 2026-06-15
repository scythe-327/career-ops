#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const data = JSON.parse(readFileSync(path.join(ROOT, 'data', 'yc-jobs.json'), 'utf-8'));

const EXCLUDE_TITLES = [
  /manager,\s*trust\s*&\s*safety/i,
  /fp\s*&\s*a\b/i,
  /head of talent/i,
  /chief of staff/i,
  /counsel/i,
  /logistics/i,
  /finance/i,
  /marketing/i,
  /sales development/i,
  /account executive/i,
  /sdr\b/i,
  /media buyer/i,
  /seo\b/i,
  /growth/i,
  /recruiter/i,
  /recruiting/i,
  /talent acquisition/i,
  /people (operations|partner|manager)/i,
  /hr\b/i,
  /human resources/i,
  /legal/i,
  /operations (manager|lead|associate)/i,
  /office manager/i,
  /administrative/i,
  /brand designer/i,
  /graphic designer/i,
  /product designer/i,
  /ux designer/i,
  /ui designer/i,
  /product manager/i,
  /project manager/i,
  /program manager/i,
  /scrum master/i,
];

const EXCLUDE_COMPANIES = new Set([]);

const before = data.jobs.length;

data.jobs = data.jobs.filter(j => {
  const title = j.title || '';

  for (const rx of EXCLUDE_TITLES) {
    if (rx.test(title)) return false;
  }

  return true;
});

data.total = data.jobs.length;
const removed = before - data.jobs.length;

console.log(`\n🧹 Cleaned: ${before} → ${data.jobs.length} (removed ${removed})\n`);

// Save JSON
writeFileSync(path.join(ROOT, 'data', 'yc-jobs.json'), JSON.stringify(data, null, 2), 'utf-8');

// Save CSV
const headers = ['id','title','company','location','job_type','role','salary','batch','oneliner','url'];
const escapeCsv = v => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')
    ? `"${s.replace(/"/g, '""')}"` : s;
};
const lines = [headers.join(',')];
for (const j of data.jobs) {
  lines.push(headers.map(h => escapeCsv(j[h])).join(','));
}
writeFileSync(path.join(ROOT, 'data', 'yc-jobs.csv'), '\uFEFF' + lines.join('\r\n'), 'utf-8');

console.log('✅ Updated data/yc-jobs.json + data/yc-jobs.csv\n');

// Final stats
const types = {};
data.jobs.forEach(x => { types[x.job_type] = (types[x.job_type] || 0) + 1 });
console.log('Types:', Object.entries(types).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}: ${v}`).join(', '));

const remote = data.jobs.filter(x => (x.location||'').toLowerCase().includes('remote')).length;
const us = data.jobs.filter(x => (x.location||'').toLowerCase().match(/us|united states|san francisco|new york|austin|seattle|boston|los angeles/i)).length;
const india = data.jobs.filter(x => (x.location||'').toLowerCase().match(/india|bengaluru|bangalore|hyderabad|mumbai|delhi|pune|chennai|gurgaon/i)).length;
console.log(`Remote: ${remote}, US: ${us}, India: ${india}`);

// Top companies
const companies = {};
data.jobs.forEach(x => { companies[x.company] = (companies[x.company] || 0) + 1 });
const top = Object.entries(companies).sort((a,b)=>b[1]-a[1]).slice(0, 10);
console.log('Top companies:', top.map(([k,v])=>`${k} (${v})`).join(', '));
