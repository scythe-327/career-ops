#!/usr/bin/env node
/**
 * YC Job Scraper - Uses /jobs/search API to find all jobs
 *
 * Usage: node scripts/yc-scraper.mjs
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'data');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const SEARCH_URL = 'https://www.workatastartup.com/jobs/search';
const HEADERS = { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' };

// Broad search queries to cover all jobs
const QUERIES = [
  'engineer', 'software', 'developer', 'backend', 'frontend',
  'full stack', 'data', 'machine learning', 'devops', 'sre',
  'product', 'designer', 'mobile', 'ios', 'android',
  'founding', 'senior', 'staff', 'lead', 'infrastructure',
  'security', 'ai', 'ml', 'platform', 'qa', 'test',
  'scientist', 'researcher', 'analyst', 'consultant',
  'growth', 'marketing', 'sales', 'operations', 'finance',
  'hr', 'recruiter', 'support', 'success', 'legal',
  'hardware', 'embedded', 'robotics', 'firmware',
];

function escapeCsv(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')
    ? `"${s.replace(/"/g, '""')}"` : s;
}

function printTable(jobs) {
  const n = Math.min(jobs.length, 50);
  console.log('');
  console.log('┌──────┬──────────────────────────────────────────────┬──────────────────────────────────┬──────────────┬────────┐');
  console.log('│  #   │ Company                                      │ Title                           │ Location      │ Type   │');
  console.log('├──────┼──────────────────────────────────────────────┼──────────────────────────────────┼──────────────┼────────┤');
  const trunc = (s, n) => s && s.length > n ? s.substring(0, n-1) + '\u2026' : (s || 'N/A').padEnd(n);
  for (let i = 0; i < n; i++) {
    const j = jobs[i];
    console.log(`│ ${String(i+1).padStart(4)} │ ${trunc(j.company, 44)} │ ${trunc(j.title, 32)} │ ${trunc(j.location, 12)} │ ${trunc(j.job_type || 'FT', 6)} │`);
  }
  console.log('└──────┴──────────────────────────────────────────────┴──────────────────────────────────┴──────────────┴────────┘');
  if (jobs.length > 50) console.log(`\n(${jobs.length} total, showing 50)`);
}

async function searchJobs(query) {
  try {
    const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}`;
    const r = await fetch(url, { headers: HEADERS });
    const data = await r.json();
    return (data.jobs || []).map(j => ({
      id: j.id,
      title: j.title || '',
      company: j.companyName || '',
      location: j.location || '',
      job_type: j.jobType || '',
      role: j.roleType || '',
      salary: j.salary || '',
      batch: j.companyBatch || '',
      oneliner: j.companyOneLiner || '',
      url: j.applyUrl || '',
    }));
  } catch {
    return [];
  }
}

async function main() {
  console.log('\n🔍 Scraping YC jobs from workatastartup.com...\n');

  const allJobs = new Map();

  for (let i = 0; i < QUERIES.length; i++) {
    const q = QUERIES[i];
    const jobs = await searchJobs(q);
    let newCount = 0;
    for (const j of jobs) {
      if (!allJobs.has(j.id)) {
        allJobs.set(j.id, j);
        newCount++;
      }
    }
    if (newCount > 0) {
      console.log(`   [${String(i+1).padStart(2)}/${QUERIES.length}] "${q.padEnd(18)}" → ${newCount} new (${allJobs.size} total)`);
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100));
  }

  const jobs = Array.from(allJobs.values());
  console.log(`\n✅ Total: ${jobs.length} unique jobs found\n`);

  // Save
  const headers = ['id','title','company','location','job_type','role','salary','batch','oneliner','url'];
  const csvPath = path.join(OUT_DIR, 'yc-jobs.csv');
  const jsonPath = path.join(OUT_DIR, 'yc-jobs.json');

  const lines = [headers.join(',')];
  for (const j of jobs) {
    lines.push(headers.map(h => escapeCsv(j[h])).join(','));
  }
  writeFileSync(csvPath, '\uFEFF' + lines.join('\r\n'), 'utf-8');
  writeFileSync(jsonPath, JSON.stringify({ total: jobs.length, jobs }, null, 2), 'utf-8');
  console.log(`💾 JSON: ${jsonPath}`);
  console.log(`💾 CSV: ${csvPath}`);

  printTable(jobs);
}

main();
