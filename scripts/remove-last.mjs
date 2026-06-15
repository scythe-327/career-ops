import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const d = JSON.parse(readFileSync(path.join(ROOT, 'data', 'yc-jobs.json'), 'utf-8'));
d.jobs = d.jobs.filter(j => !(j.company === 'Charge Robotics' && j.title.includes('Robotics System Operator')));
d.total = d.jobs.length;

const esc = v => { const s = String(v); return s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r') ? '"' + s.replace(/"/g, '""') + '"' : s; };
const headers = ['id','title','company','location','job_type','role','salary','batch','oneliner','url'];
const lines = [headers.join(',')].concat(d.jobs.map(j => headers.map(h => esc(j[h])).join(',')));

writeFileSync(path.join(ROOT, 'data', 'yc-jobs.json'), JSON.stringify(d, null, 2), 'utf-8');
writeFileSync(path.join(ROOT, 'data', 'yc-jobs.csv'), '\uFEFF' + lines.join('\r\n'), 'utf-8');

console.log('Done. Total:', d.jobs.length);
