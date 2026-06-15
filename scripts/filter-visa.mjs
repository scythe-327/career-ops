#!/usr/bin/env node
/**
 * Remove jobs that require US work authorization.
 *
 * Logic:
 * - "Remote (US)" or US-only cities/states → requires US visa
 * - "Remote" (global) + "Remote (US)" → still requires US visa (no non-US option)
 * - "US / Remote" → unclear, but "Remote" is global so visa NOT required
 * - "Remote / Remote (US)" → unclear, "Remote" is global so visa NOT required
 * - International locations → visa NOT required
 */

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const data = JSON.parse(readFileSync(path.join(ROOT, 'data', 'yc-jobs.json'), 'utf-8'));

function isUsOnly(location) {
  if (!location) return false;
  const loc = location.toLowerCase().trim();

  // Exact matches for US-only patterns
  if (loc === 'remote (us)') return true;
  if (loc === 'us / remote (us)') return true;
  if (loc.match(/^us\s*\/\s*remote\s*\(us\)$/i)) return true;
  if (loc === 'us / ca / remote (us)') return true;
  if (loc.match(/^ca\s*\/\s*remote/i) && !loc.match(/canada|calgary|montreal|toronto|vancouver/i)) return true;
  if (loc.match(/^\d+\s+market\s+st/i)) return true;

  // Split by common delimiters and analyze each part
  const parts = loc.split(/\/|;|,|(?:\s+or\s+)/).map(s => s.trim()).filter(Boolean);

  let hasGlobalRemote = false;
  let hasUsOnly = false;
  let hasUsCity = false;
  let hasInternational = false;

  for (const part of parts) {
    const p = part.toLowerCase().trim();

    // Global remote
    if (p === 'remote') { hasGlobalRemote = true; continue; }

    if (p.match(/^remote\s*\(us\)$/i)) { hasUsOnly = true; continue; }
    if (p === 'us' || p === 'usa') { hasUsOnly = true; continue; }

    // Known international
    if (p.match(/india|bengaluru|bangalore|mumbai|hyderabad|delhi|pune|noida/i)) { hasInternational = true; continue; }
    if (p.match(/london|uk|united kingdom|gb\b|england/i)) { hasInternational = true; continue; }
    if (p.match(/europe|germany|berlin|france|paris|spain|barcelona|netherlands|amsterdam|poland|krakow|warsaw|prague|czech/i)) { hasInternational = true; continue; }
    if (p.match(/canada|toronto|vancouver|montreal|calgary/i)) { hasInternational = true; continue; }
    if (p.match(/australia|sydney|melbourne|singapore|japan|tokyo|china|beijing|brazil|mexico|mexico city|dubai|uae|argentina|hanoi|vietnam/i)) { hasInternational = true; continue; }
    if (p.match(/remote\s*\((?:gb|uk|eu|europe|canada|ca|india|in|de|fr|es|nl|sg|au|br|mx)\)/i)) { hasInternational = true; continue; }
    if (p.match(/,\s*(?:gb|uk|in|ca|au|de|fr|es|nl|sg|jp|br|mx|ae|pl|ie|il|eu)\b/i)) { hasInternational = true; continue; }
    if (p === 'remote (uk)' || p === 'remote (gb)' || p === 'remote (eu)' || p === 'remote (europe)') { hasInternational = true; continue; }
    if (p.match(/california/i) && !p.match(/ca\b/)) continue; // "california" alone - US city
    if (p === 'ca' && hasUsOnly) continue; // "CA" after "US" - US state

    // US cities / states
    if (p.match(/^(san francisco|new york|austin|seattle|boston|los angeles|chicago|portland|denver|phoenix|miami|atlanta|dallas|houston)/i)) { hasUsCity = true; continue; }
    if (p.match(/^(palo alto|mountain view|menlo park|sunnyvale|cupertino|santa clara|irvine|san diego|salt lake city|raleigh|durham|nashville|lehi|redwood city|south san francisco|san mateo|oakland|berkeley|santa monica|culver city|long beach|seal beach)/i)) { hasUsCity = true; continue; }
    if (p.match(/^(dc|washington dc|silicon valley|bay area|sf\b|nyc)/i)) { hasUsCity = true; continue; }
    if (p.match(/,\s*(ca|ny|tx|wa|ma|il|co|or|az|fl|ga|ut|nc|tn|pa|md|va|dc|mn|oh|mi|wi|nj|ct)\b/i)) { hasUsCity = true; continue; }

    // "california " prefix could be "california " + something
    if (p.match(/^california\s/i)) { hasUsCity = true; continue; }
  }

  // Decision: visa required ONLY if every option is US-based
  const strictlyUsOnly = (hasUsOnly || hasUsCity) && !hasGlobalRemote && !hasInternational;
  return strictlyUsOnly;
}

const before = data.jobs.length;
const removed = data.jobs.filter(j => isUsOnly(j.location));
const kept = data.jobs.filter(j => !isUsOnly(j.location));

console.log(`\n🛂 US Visa Filter`);
console.log(`   Total: ${before}`);
console.log(`   Keeping: ${kept.length}`);
console.log(`   Removing (US-only): ${removed.length}\n`);

// Show verification sample
console.log('Verification - checking edge cases:');
const edgeCases = ['Yassir', 'Enode', 'EquipmentShare', 'Clipboard', 'Runa', 'Perseus Defense', 'Just Appraised', 'Hive', 'Instawork'];
for (const name of edgeCases) {
  const j = data.jobs.find(x => x.company === name);
  if (j) {
    const decision = isUsOnly(j.location) ? 'REMOVE' : 'KEEP';
    console.log(`  ${decision}: ${j.company.padEnd(20)} ${j.location}`);
  }
}
console.log('');

if (removed.length > 0) {
  console.log(`Removed (US-only, needs visa):`);
  removed.slice(0, 15).forEach((j, i) =>
    console.log(`  ${i+1}. ${j.company.padEnd(24)} ${j.location}`)
  );
  if (removed.length > 15) console.log(`  ... and ${removed.length - 15} more`);
  console.log('');
}

data.jobs = kept;
data.total = kept.length;

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
const remoteCount = data.jobs.filter(x => (x.location||'').toLowerCase().includes('remote')).length;
const usCount = data.jobs.filter(x => (x.location||'').toLowerCase().match(/\b(us|remote\s*\(us\))/i)).length;
const indiaCount = data.jobs.filter(x => (x.location||'').toLowerCase().match(/india|bengaluru|bangalore/i)).length;
const types = {};
data.jobs.forEach(x => { types[x.job_type] = (types[x.job_type] || 0) + 1 });
console.log(`Types: ${Object.entries(types).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}: ${v}`).join(', ')}`);
console.log(`Remote: ${remoteCount}, US-mentioning: ${usCount}, India: ${indiaCount}`);

// Show first 20 kept jobs
console.log('\nFirst 20 kept jobs:');
data.jobs.slice(0, 20).forEach((j, i) => console.log(`  ${i+1}. ${j.company.padEnd(24)} ${j.location.padEnd(30)} ${j.title.substring(0, 40)}`));
