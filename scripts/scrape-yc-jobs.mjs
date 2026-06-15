#!/usr/bin/env node
/**
 * YC Engineering Job Scraper
 *
 * Usage:
 *   node scripts/scrape-yc-jobs.mjs --api-key "<key>" [--filters "role:eng"] [--hits 100]
 *
 * API key: page source of https://www.workatastartup.com/companies → window.AlgoliaOpts.key
 */

import { execFileSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync, mkdirSync, unlinkSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TMP = path.join(ROOT, 'tmp');
if (!existsSync(TMP)) mkdirSync(TMP, { recursive: true });

const ALGOLIA_APP_ID = '45BWZJ1SGC';
const JOBS_INDEX = 'WaaSPublicCompanyJob_created_at_desc_production';
const API_ENDPOINT = `https://${ALGOLIA_APP_ID.toLowerCase()}-dsn.algolia.net/1/indexes/${JOBS_INDEX}/query`;
const PS_SCRIPT = path.join(__dirname, 'invoke-algolia.ps1');

const EXTRACT_FIELDS = [
  'title', 'company_name', 'company_website', 'company_description',
  'company_team_size', 'locations_for_search', 'remote', 'job_type',
  'role', 'eng_type', 'min_experience', 'has_salary', 'has_equity',
  'us_visa_required', 'created_at', 'search_path', 'description',
];

// ─── CLI ────────────────────────────────────────────────────────────
let apiKey = '';
let outputDir = path.join(ROOT, 'data');
let filters = 'role:eng';
let hitsPerPage = 100;
let maxPages = 1000;

const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--api-key' || a === '-k') apiKey = args[++i];
  else if (a === '--output' || a === '-o') outputDir = args[++i];
  else if (a === '--filters' || a === '-f') filters = args[++i];
  else if (a === '--hits' || a === '-n') hitsPerPage = parseInt(args[++i]) || 100;
  else if (a === '--max-pages' || a === '-m') maxPages = parseInt(args[++i]) || 1000;
  else if (a === '--help' || a === '-h') { help(); process.exit(0); }
}

function help() { console.log(`
YC Engineering Job Scraper
Usage:
  node scripts/scrape-yc-jobs.mjs --api-key "<key>"
  node scripts/scrape-yc-jobs.mjs -k "<key>" -f "role:eng" -n 100 -o ./data
`); }

if (!apiKey) { console.log('❌ --api-key is required'); help(); process.exit(1); }

// ─── Invoke Algolia via PowerShell (writes response to file) ─────────
function invokeAlgolia(body) {
  const bodyFile = path.join(TMP, '_algolia_req.json');
  const outFile = path.join(TMP, '_algolia_resp.json');
  writeFileSync(bodyFile, JSON.stringify(body), 'utf-8');

  execFileSync('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
    '-File', PS_SCRIPT,
    '-ApiKey', apiKey,
    '-BodyFile', bodyFile,
    '-OutFile', outFile,
    '-ApiEndpoint', API_ENDPOINT,
  ], { timeout: 60000, encoding: 'utf-8', stdio: 'pipe' });

  if (!existsSync(outFile)) {
    throw new Error('Response file not created');
  }

  const raw = readFileSync(outFile, 'utf-8');
  try {
    unlinkSync(outFile);
  } catch {}

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`JSON parse failed. Raw start: ${raw.substring(0, 200)}`);
  }
}

// ─── CSV ────────────────────────────────────────────────────────────
function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r'))
    return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function flattenJob(job) {
  const locations = Array.isArray(job.locations_for_search)
    ? job.locations_for_search.join('; ') : (job.locations_for_search || '');
  const engType = Array.isArray(job.eng_type)
    ? job.eng_type.join('; ') : (job.eng_type || '');
  const fullUrl = job.search_path
    ? (job.search_path.startsWith('http') ? job.search_path : `https://www.ycombinator.com${job.search_path}`)
    : '';
  return {
    objectID: String(job.objectID),
    job_title: job.title || '',
    company_name: job.company_name || '',
    company_website: job.company_website || '',
    company_description: (job.company_description || '').substring(0, 500),
    team_size: job.company_team_size ?? '',
    location: locations,
    remote: job.remote ?? '',
    job_type: job.job_type ?? '',
    role: job.role ?? '',
    eng_type: engType,
    experience: job.min_experience ?? '',
    salary_available: job.has_salary ?? '',
    equity_available: job.has_equity ?? '',
    visa_required: job.us_visa_required ?? '',
    posted_at: job.created_at || '',
    job_url: fullUrl,
  };
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔍 Scraping YC engineering jobs...\n');
  const allJobs = new Map();
  let page = 0;
  let totalHits = 0;

  while (page < maxPages) {
    const body = {
      query: '', filters, hitsPerPage, page,
      attributesToRetrieve: EXTRACT_FIELDS,
    };

    try {
      const result = invokeAlgolia(body);
      const hits = result.hits || [];

      if (page === 0) {
        totalHits = result.nbHits || 0;
        console.log(`📊 Total: ${totalHits}, fetching ${hitsPerPage}/page...\n`);
      }

      if (hits.length === 0) { console.log(`   ✓ Page ${page}: empty.`); break; }

      let newCount = 0;
      for (const job of hits) {
        if (!allJobs.has(job.objectID)) {
          allJobs.set(job.objectID, flattenJob(job));
          newCount++;
        }
      }
      console.log(`   Page ${page}: ${hits.length} hits, ${newCount} new (${allJobs.size} total)`);
      page++;
    } catch (err) {
      console.log(`\n❌ Page ${page} failed: ${err.message}`);
      break;
    }
  }

  const jobs = Array.from(allJobs.values());
  console.log(`\n✅ Done. ${jobs.length} unique jobs.\n`);

  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  // JSON
  const jsonPath = path.join(outputDir, 'yc-engineering-jobs.json');
  writeFileSync(jsonPath, JSON.stringify({ total: jobs.length, jobs }, null, 2), 'utf-8');
  console.log(`💾 ${jsonPath}`);

  // CSV
  const csvHeaders = ['objectID','job_title','company_name','company_website',
    'company_description','team_size','location','remote','job_type',
    'role','eng_type','experience','salary_available','equity_available',
    'visa_required','posted_at','job_url'];
  const csvLines = [csvHeaders.join(',')];
  for (const job of jobs) {
    csvLines.push(csvHeaders.map(h => escapeCsv(job[h])).join(','));
  }
  const csvPath = path.join(outputDir, 'yc-engineering-jobs.csv');
  writeFileSync(csvPath, '\uFEFF' + csvLines.join('\r\n'), 'utf-8');
  console.log(`💾 ${csvPath}`);

  // Summary
  const r = j => j.remote === 'yes', i = j => j.location.includes('IN'),
    u = j => j.location.includes('US'), vs = j => j.visa_required === 'yes',
    nv = j => j.visa_required === 'none';
  console.log(`\n📈 Remote:${jobs.filter(r).length} India:${jobs.filter(i).length} US:${jobs.filter(u).length} Visa:${jobs.filter(vs).length} NoVisa:${jobs.filter(nv).length}`);
}

main();
