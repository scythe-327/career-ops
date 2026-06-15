#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'fs';
import path from 'path';
import jsYaml from 'js-yaml';

const parseYaml = jsYaml.load;
const ROOT = path.resolve(import.meta.dirname, '..');

const JOBS_PATH = path.join(ROOT, 'data', 'yc-jobs.json');
const PROFILE_PATH = path.join(ROOT, 'config', 'profile.yml');
const OUTREACH_TSV = path.join(ROOT, 'data', 'outreach.tsv');
const RESUME_PATH = path.join(ROOT, 'cv-rohan-p-h-hightouch.pdf');

const LINKEDIN_URL = 'https://linkedin.com/in/rohan-p-h-876865250';
const PORTFOLIO_URL = 'https://rohan-ph-engineer-z8fhu3w.gamma.site/';

const profile = parseYaml(readFileSync(PROFILE_PATH, 'utf-8'));
const data = JSON.parse(readFileSync(JOBS_PATH, 'utf-8'));

function isRemoteFriendly(location) {
  if (!location) return false;
  const loc = location.toLowerCase();

  // Skip US-only
  if (loc === 'remote (us)' || loc.match(/^remote\s*\(us\)\s*$/)) return false;
  if (loc.match(/^us\s*\/\s*remote\s*\(us\)$/i)) return false;

  // Keep global remote
  if (loc === 'remote') return true;

  // Keep India locations
  if (loc.match(/india|bengaluru|bangalore|mumbai|pune|noida|gurugram/i)) return true;

  // Keep if it has both remote and a non-US location
  const parts = loc.split(/\/|;/).map(s => s.trim().toLowerCase());
  let hasGlobalRemote = false;
  let hasIndia = false;
  let hasUSOnly = true;

  for (const p of parts) {
    if (p === 'remote') hasGlobalRemote = true;
    if (p.match(/india|bengaluru|bangalore|mumbai/i)) hasIndia = true;
    if (p.match(/london|uk|gb|europe|germany|berlin|france|paris|spain|canada|australia|singapore|dubai|japan|tokyo|netherlands|amsterdam|brazil|mexico/i)) hasUSOnly = false;
  }

  // Has global remote + possibly US = OK for India
  if (hasGlobalRemote) return true;
  if (hasIndia) return true;
  if (hasUSOnly && !hasGlobalRemote && !hasIndia) return false;

  return true;
}

function isGoodRole(job) {
  const title = (job.title || '').toLowerCase();
  const role = (job.role || '').toLowerCase();

  const goodKeywords = [
    'software engineer', 'backend', 'full stack', 'fullstack', 'cloud', 'platform',
    'infrastructure', 'devops', 'sre', 'site reliability', 'data engineer',
    'machine learning', 'ml engineer', 'ai engineer', 'founding engineer',
    'founding', 'staff engineer', 'senior engineer', 'tech lead',
    'engineering manager', 'java', 'spring', 'quarkus', 'aws',
  ];

  return goodKeywords.some(k => title.includes(k) || role.includes(k));
}

function guessDomain(company) {
  const domainMap = {
    'Yassir': 'yassir.com',
    'Cashfree Payments': 'cashfree.com',
    'Runa': 'runa.com',
    'Enode': 'enode.io',
    'GIMO': 'gimo.vn',
    'Ashby': 'ashbyhq.com',
    'Enerjazz': 'enerjazz.com',
    'Groww': 'groww.in',
    'Smartcuts': 'smartcuts.com',
    'Deepnote': 'deepnote.com',
    'Loombotic': 'loombotic.com',
    'REVER': 'reverscore.com',
    'Apprentice Health': 'apprenticehealth.com',
    'Bolster': 'bolster.com',
    'BusinessOnBot': 'businessonbot.com',
    'GoGoGrandparent': 'gogograndparent.com',
    'Baraka': 'baraka.com',
    'Kodo': 'kodo.cards',
    'Metorial': 'metorial.com',
    'GovernGPT': 'governgpt.com',
    'Sirdab': 'sirdab.com',
    'Emergent': 'emergent.sh',
    'Stripe': 'stripe.com',
    'Spellbrush': 'spellbrush.com',
    'Explorex': 'explorex.co',
    'Razorpay': 'razorpay.com',
    'DreamCraft Entertainment, Inc.': 'dreamcraft.com',
    'Leadbay': 'leadbay.co',
    'Haystack': 'haystack.com',
    'Informed K12': 'informedk12.com',
    'Payflow': 'payflow.es',
    'Lightdash': 'lightdash.com',
    'Reframe (Glucobit)': 'reframefitness.com',
    'Tavus': 'tavus.com',
    'Veryfi, Inc.': 'veryfi.com',
    'Ridecell': 'ridecell.com',
    'Prembly (formerly Identitypass)': 'prembly.com',
    'Axross Pte Ltd': 'axross.com',
    'Miso': 'miso.ai',
    'Osium AI': 'osium.ai',
    'Inito': 'inito.com',
    'Quickchat AI': 'quickchat.ai',
    'DeepAware AI': 'deepaware.ai',
    'Infer': 'infer.in',
    'Wifi Dabba, Inc.': 'wifidabba.com',
    'Swif.ai': 'swif.ai',
    'Odeko': 'odeko.com',
    'Karbon Card': 'karboncard.com',
    'Etleap': 'etleap.com',
    'Findly': 'findly.ai',
    'Heroic Labs': 'heroiclabs.com',
    'OneChronos': 'onechronos.com',
    'PostHog': 'posthog.com',
    'FamPay': 'fampay.in',
    'ClassDojo': 'classdojo.com',
    'AiPrise': 'aiprise.com',
    'SigmaOS': 'sigmaos.com',
    'Olympian Motors': 'olympianmotors.com',
    'Ziina': 'ziina.com',
    'Pelago': 'pelagohealth.com',
    'Instacart': 'instacart.com',
    'Pop Meals': 'popmeals.com',
    'Ankr Health': 'ankrhealth.com',
    'Constant': 'useconstant.com',
    'MorphoAI': 'morphoai.com',
    'Autumn': 'autumn.com',
    'Kontigo': 'kontigo.com',
    'Upstream': 'upstream.com',
    'SuperKalam': 'superkalam.com',
    'Circle Medical': 'circlemedical.com',
    'ARQ': 'arq.com',
    'Hapi': 'hapi.com',
    'Proven Group': 'proven.com',
    'Fleek': 'fleek.com',
    'Atomic Industries': 'atomicindustries.com',
    'Roboflow': 'roboflow.com',
    'Solve Intelligence': 'solveintelligence.com',
    'Encord': 'encord.com',
    'Airweave': 'airweave.ai',
    'Aglide': 'aglide.com',
    'Respan': 'respan.com',
    'Hera': 'hera.com',
    'arnata': 'arnata.com',
    'Lucis': 'lucis.com',
    'Leeroo': 'leeroo.com',
    'Terra API': 'terraapi.com',
    'ProjectPro': 'projectpro.com',
    'Runway': 'runwayteam.com',
    'Carbonfact': 'carbonfact.com',
    'Prolific': 'prolific.com',
    'QFEX': 'qfex.com',
    'Seal': 'seal.com',
    'Humaans': 'humaans.com',
    'Helloverify': 'helloverify.com',
    'Porter': 'porter.com',
    'Zippi': 'zippi.com',
    'Mercura': 'mercura.com',
    'Legora': 'legora.com',
    'Human Archive': 'humanarchive.com',
    'Albedo': 'albedo.com',
    'CircuitHub': 'circuithub.com',
    'Overview': 'overview.com',
    'HyLight': 'hylight.com',
    'Intelline': 'intelline.com',
    'Spaceium Inc': 'spaceium.com',
    'Rimward': 'rimward.com',
    'Kalam Labs': 'kalamlabs.com',
    'Yummy Future': 'yummyfuture.com',
    'Charge Robotics': 'chargerobotics.com',
    'Noora Health': 'noorahealth.com',
    'Mino Games': 'minogames.com',
    'DoorDash': 'doordash.com',
    'Xendit': 'xendit.com',
    'Shuttle Central': 'shuttlecentral.com',
    'Landeed': 'landeed.com',
    'AgentCollect': 'agentcollect.com',
    'VectorShift': 'vectorshift.me',
    'Sourcebot': 'sourcebot.dev',
    'Closure': 'closure-intel.com',
    'Garage': 'shopgarage.com',
    'Astraea': 'tryastraea.com',
  };

  const cleanName = company.trim();
  if (domainMap[cleanName]) return domainMap[cleanName];

  const simplified = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/^(the|a)/, '');
  return `${simplified}.com`;
}

function guessContactEmail(company) {
  const domain = guessDomain(company);

  const founderEmails = {
    'PostHog': 'james@posthog.com',
    'GoGoGrandparent': 'justin@gogograndparent.com',
    'Deepnote': 'jakub@deepnote.com',
    'Roboflow': 'joseph@roboflow.com',
    'Porter': 'jonah@porter.com',
    'Runway': 'siqi@runwayteam.com',
    'Tavus': 'hassaan@tavus.com',
    'Inito': 'varun@inito.com',
    'Stripe': 'recruiting@stripe.com',
    'Razorpay': 'careers@razorpay.com',
    'Groww': 'careers@groww.in',
    'Cashfree Payments': 'careers@cashfree.com',
    'FamPay': 'kush@fampay.in',
    'Baraka': 'faris@baraka.com',
    'Kodo': 'rohit@kodo.cards',
    'Veryfi, Inc.': 'david@veryfi.com',
    'SuperKalam': 'abhishek@superkalam.com',
    'Emergent': 'team@emergent.sh',
    'Noora Health': 'careers@noorahealth.com',
    'Ankr Health': 'team@ankrhealth.com',
    'Infer': 'careers@infer.in',
    'Karbon Card': 'peeyush@karboncard.com',
    'Wifi Dabba, Inc.': 'shubhendu@wifidabba.com',
    'Lightdash': 'ollie@lightdash.com',
    'Circle Medical': 'careers@circlemedical.com',
    'Spellbrush': 'li@spellbrush.com',
    'Leadbay': 'team@leadbay.co',
    'Prembly (formerly Identitypass)': 'lanre@prembly.com',
    'Encord': 'ulrik@encord.com',
    'Terra API': 'team@terraapi.com',
    'Leeroo': 'founders@leeroo.com',
    'Osium AI': 'founders@osium.ai',
  };

  if (founderEmails[company]) return founderEmails[company];

  return `team@${domain}`;
}

function getTargetRole(job) {
  const title = job.title || '';
  const role = job.role || '';
  if (title.toLowerCase().includes('founder')) return title;
  if (role === 'backend') return 'Backend Engineer';
  if (role === 'full stack') return 'Full Stack Engineer';
  if (role === 'frontend') return 'Frontend Engineer';
  if (role === 'devops') return 'DevOps Engineer';
  if (role === 'data science') return 'Data Scientist';
  if (role === 'machine learning') return 'ML Engineer';
  if (role === 'engineering manager') return 'Engineering Manager';
  if (role === 'android') return 'Android Engineer';
  if (role === 'ios') return 'iOS Engineer';
  return title || 'Software Engineer';
}

const CANDIDATE_NAME = 'Rohan P H';
const CANDIDATE_PHONE = '+91 89512 28077';

const ACCOMPLISHMENT_CB = 'Migrated 17+ legacy apps to serverless on AWS — cut cold-start latency by 60%, cloud OpEx by 65%, 99.95% availability across 45+ services.';
const ACCOMPLISHMENT_FOUNDING = 'Took E2E ownership at BT Group: migrated 17 apps to serverless, built auth for 45+ microservices, cut costs 65%. Ship across backend, frontend, infra.';
const ACCOMPLISHMENT_AI = 'Built LLM-powered RAG system with Mistral 20B + FAISS. At BT Group cut cold-start latency 60%, cloud costs 65%, handled 5,000+ RPM on serverless AWS.';
const ACCOMPLISHMENT_FALLBACK = 'Cut cloud costs 65%, cold-start latency 60%, 99.95% availability across 45+ services at BT Group. Built auth systems, CI/CD, and full-stack features.';

function craftEmail(job, contactName) {
  const company = job.company;
  const title = job.title || 'Software Engineer';
  const role = job.role || '';
  const oneliner = job.oneliner || '';

  const roleLower = (title + ' ' + role).toLowerCase();
  const isCloudBackend = roleLower.match(/backend|cloud|platform|infrastructure|devops|sre|full stack|fullstack/);
  const isAI = roleLower.match(/machine learning|ml|ai|data science|data engineer/);
  const isFounding = roleLower.includes('founding');

  const name = contactName && contactName !== 'Team' ? contactName : null;

  const cred = isFounding ? ACCOMPLISHMENT_FOUNDING
    : isCloudBackend ? ACCOMPLISHMENT_CB
    : isAI ? ACCOMPLISHMENT_AI
    : ACCOMPLISHMENT_FALLBACK;

  // Subject: lead with strongest credential
  let subject;
  if (isFounding) {
    subject = `${company} founding engineer — shipped platform + auth at scale`;
  } else if (isCloudBackend) {
    subject = `Serverless platform experience — ${title} @ ${company}`;
  } else {
    subject = `${title} @ ${company} — cloud infrastructure background`;
  }

  // Body: one paragraph, 50-125 words, no greeting fluff, specific ask
  let body;
  if (isFounding) {
    body = `${cred} For an early team building ${oneliner || 'fast'}, I cover what takes three hires.
\nI'd like to start the interview process for the ${title} role.`;
  } else if (isCloudBackend) {
    body = `${cred} ${company}'s ${role || title} needs someone who's done this before — migrated platforms, optimized cost/latency, secured distributed systems. That's what I've been doing.
\nI'd like to start the interview process for the ${title} role.`;
  } else if (isAI) {
    body = `${cred} I bridge LLM deployment and production infrastructure — built both vector search pipelines and serverless platforms at scale.
\nI'd like to start the interview process for the ${title} role.`;
  } else {
    body = `${cred} I bring production experience, measurable impact, and full-stack versatility.
\nI'd like to start the interview process for the ${title} role.`;
  }

  const greeting = name ? `Hi ${name},` : 'Hi Team,';

  const fullBody = `${greeting}

${body}

Best,
${CANDIDATE_NAME}
${LINKEDIN_URL}`;

  return { subject, body: fullBody };
}

function sanitizeForTSV(text) {
  return text.replace(/\n/g, '\\n').replace(/\t/g, ' ').replace(/"/g, '');
}

const jobs = data.jobs || [];

const filtered = jobs.filter(j => {
  if (!isRemoteFriendly(j.location)) {
    return false;
  }
  if (!isGoodRole(j)) {
    return false;
  }
  return true;
});

console.log(`\n📊 YC Jobs Analysis:`);
console.log(`   Total jobs: ${jobs.length}`);
console.log(`   Remote/India-friendly: ${jobs.filter(j => isRemoteFriendly(j.location)).length}`);
console.log(`   Good role match: ${filtered.length}`);

// Show candidates
console.log(`\n🎯 Top matches for remote-from-India:`);
filtered.forEach((j, i) => {
  const domain = guessDomain(j.company);
  const email = guessContactEmail(j.company);
  console.log(`   ${i+1}. ${j.company.padEnd(28)} ${(j.location || '').padEnd(35)} ${(j.title || '').substring(0, 40)}`);
  console.log(`      → ${email}`);
});

console.log(`\n📧 Generating outreach entries...`);

if (!existsSync(OUTREACH_TSV)) {
  writeFileSync(OUTREACH_TSV, 'date\tcompany\trole\trecruiter_name\trecruiter_channel\tmessage_type\tstatus\tmessage\tsubject\tresume_path\n', 'utf-8');
}

let existingLines = readFileSync(OUTREACH_TSV, 'utf-8').trim().split('\n').filter(l => l.trim());
let duplicates = 0;
let added = 0;
const addedEntries = [];

const today = new Date().toISOString().split('T')[0];

for (const job of filtered) {
  const targetRole = getTargetRole(job);
  const email = guessContactEmail(job.company);
  const { subject, body } = craftEmail(job, '');

  const row = [
    today,
    job.company,
    targetRole,
    'Team',
    email,
    'coldemail',
    'draft',
    sanitizeForTSV(body),
    subject,
    RESUME_PATH,
  ].join('\t');

  const isDup = existingLines.some(l => {
    const cols = l.split('\t');
    return cols[1] === job.company && cols[2] === targetRole && cols[4] === email;
  });

  if (isDup) {
    duplicates++;
    continue;
  }

  appendFileSync(OUTREACH_TSV, row + '\n', 'utf-8');
  existingLines.push(row);
  added++;
  addedEntries.push({ company: job.company, email, subject, body, targetRole });
  console.log(`   ✅ ${job.company} → ${email} | "${subject}"`);
}

console.log(`\n📋 Summary: ${added} added, ${duplicates} duplicates skipped`);
console.log(`   Total outreach entries: ${existingLines.length - 1}`);

if (added > 0) {
  console.log(`\n📋 New drafts — review before sending:\n`);
  for (const e of addedEntries) {
    console.log(`── ${e.company} ──────────────────────────────`);
    console.log(`To: ${e.email}`);
    console.log(`Sub: ${e.subject}`);
    console.log(`${e.body}\n`);
  }
  console.log('────────────────────────────────────────────');
  console.log('Run `node send-outreach.mjs` to send after you approve.');
}
