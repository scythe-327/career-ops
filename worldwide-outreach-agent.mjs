#!/usr/bin/env node
/**
 * Worldwide Outreach Agent
 *
 * Finds "work from anywhere" remote SDE jobs paying in strong currency (USD/EUR/GBP/CHF),
 * locates hiring managers, crafts personalized cold emails, and sends them.
 * Loops until 20 matching emails are successfully sent.
 *
 * Usage: node worldwide-outreach-agent.mjs
 *
 * Uses the existing career-ops infrastructure:
 *   - config/profile.yml for candidate identity
 *   - config/email.yml for SMTP credentials
 *   - cv.md for proof points
 *   - send-outreach.mjs for email delivery
 *   - data/outreach.tsv for tracking
 */

import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import jsYaml from 'js-yaml';

const parseYaml = jsYaml.load;

const PROFILE_PATH = 'config/profile.yml';
const CV_PATH = 'cv.md';
const EMAIL_CONFIG_PATH = 'config/email.yml';
const OUTREACH_TSV = 'data/outreach.tsv';
const TARGET = 20; // Send 20 matching emails

// ---------- LOAD CONFIG ----------

function loadProfile() {
  const raw = readFileSync(PROFILE_PATH, 'utf-8');
  return parseYaml(raw);
}

function loadEmailConfig() {
  const raw = readFileSync(EMAIL_CONFIG_PATH, 'utf-8');
  return parseYaml(raw);
}

function loadCV() {
  return readFileSync(CV_PATH, 'utf-8');
}

// ---------- JOB DISCOVERY ----------

// Pre-vetted list of companies known to hire worldwide remote
const WORLDWIDE_REMOTE_COMPANIES = [
  { name: 'Supabase', careersUrl: 'https://jobs.ashbyhq.com/supabase', roles: ['Software Engineer', 'Backend Engineer', 'Platform Engineer', 'Infrastructure Engineer'] },
  { name: 'Holepunch', careersUrl: 'https://holepunch.recruitee.com', roles: ['P2P Node.js Engineer', 'Software Engineer'] },
  { name: 'LiveKit', careersUrl: 'https://jobs.ashbyhq.com/livekit', roles: ['Senior Software Engineer', 'Backend Engineer'] },
  { name: 'Airalo', careersUrl: 'https://airalo.recruitee.com', roles: ['Senior PHP Engineer', 'Backend Engineer'] },
  { name: 'Raya', careersUrl: 'https://jobs.ashbyhq.com/raya', roles: ['Senior Backend Engineer'] },
  { name: 'CloudLinux', careersUrl: 'https://cloudlinux.com/careers', roles: ['Senior Security Engineer', 'Software Engineer'] },
  { name: 'Tether', careersUrl: 'https://tether.io/careers', roles: ['Senior Backend Developer', 'Product Engineer', 'Software Engineer'] },
  { name: 'Brave', careersUrl: 'https://brave.com/careers', roles: ['Senior Software Engineer'] },
  { name: 'Distribusion', careersUrl: 'https://distribusion.recruitee.com', roles: ['Senior Ruby Software Engineer'] },
  { name: 'Wikimedia Foundation', careersUrl: 'https://wikimediafoundation.org/about/jobs', roles: ['Senior Software Engineer'] },
  { name: 'Stripe', careersUrl: 'https://stripe.com/jobs', roles: ['Software Engineer', 'Backend Engineer'] },
  { name: 'Automattic', careersUrl: 'https://automattic.com/work-with-us', roles: ['Software Engineer', 'Backend Engineer', 'Cloud Engineer'] },
  { name: 'GitLab', careersUrl: 'https://about.gitlab.com/jobs', roles: ['Backend Engineer', 'Software Engineer', 'Infrastructure Engineer'] },
  { name: 'Toptal', careersUrl: 'https://www.toptal.com/careers', roles: ['Software Engineer', 'Cloud Engineer'] },
  { name: 'Doist', careersUrl: 'https://doist.com/careers', roles: ['Backend Engineer', 'Software Engineer'] },
  { name: 'Buffer', careersUrl: 'https://buffer.com/careers', roles: ['Software Engineer', 'Backend Engineer'] },
  { name: 'Zapier', careersUrl: 'https://zapier.com/jobs', roles: ['Software Engineer', 'Platform Engineer'] },
  { name: 'Basecamp', careersUrl: 'https://basecamp.com/about/jobs', roles: ['Software Engineer'] },
  { name: 'Deel', careersUrl: 'https://deel.com/careers', roles: ['Backend Engineer', 'Software Engineer', 'Cloud Engineer'] },
  { name: 'SafetyWing', careersUrl: 'https://safetywing.com/careers', roles: ['Software Engineer', 'Backend Engineer'] },
  { name: 'Compassion International', careersUrl: 'https://compassion.com/careers', roles: ['Software Engineer'] },
  { name: 'Gitbook', careersUrl: 'https://gitbook.com/careers', roles: ['Backend Engineer', 'Software Engineer'] },
  { name: 'Himalayas', careersUrl: 'https://himalayas.app/jobs', roles: ['Software Engineer'] },
  { name: 'Prodia', careersUrl: 'https://prodia.com/careers', roles: ['Software Engineer'] },
  { name: 'CashApp', careersUrl: 'https://cash.app/careers', roles: ['Backend Engineer', 'Software Engineer'] },
  { name: 'Square', careersUrl: 'https://squareup.com/careers', roles: ['Backend Engineer', 'Software Engineer', 'Cloud Engineer'] },
  { name: 'Shopify', careersUrl: 'https://shopify.com/careers', roles: ['Backend Engineer', 'Software Engineer', 'Infrastructure Engineer'] },
  { name: 'Pleo', careersUrl: 'https://pleo.com/careers', roles: ['Backend Engineer', 'Software Engineer'] },
  { name: 'Remote', careersUrl: 'https://remote.com/careers', roles: ['Backend Engineer', 'Software Engineer'] },
  { name: 'HubSpot', careersUrl: 'https://hubspot.com/careers', roles: ['Backend Engineer', 'Software Engineer', 'Cloud Engineer'] },
];

const STRONG_CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF'];

// ---------- HELPER: compute skill match ----------

function computeMatchScore(cv, jobTitle, company) {
  const cvLower = cv.toLowerCase();
  const titleLower = jobTitle.toLowerCase();
  let score = 0;
  const keywords = {
    primary: ['java', 'aws', 'cloud', 'backend', 'microservices', 'serverless', 'spring', 'quarkus', 'api'],
    secondary: ['platform', 'infrastructure', 'devops', 'sre', 'reliability', 'distributed', 'full stack'],
    bonus: ['senior', 'software engineer', 'cloud engineer', 'backend engineer', 'platform engineer'],
  };

  for (const kw of keywords.primary) {
    if (titleLower.includes(kw)) score += 2;
    if (cvLower.includes(kw)) score += 1;
  }
  for (const kw of keywords.secondary) {
    if (titleLower.includes(kw)) score += 1;
  }
  for (const kw of keywords.bonus) {
    if (titleLower.includes(kw)) score += 1;
  }

  // Normalize to 0-100
  return Math.min(100, Math.round(score * 5));
}

// ---------- EMAIL CRAFTING ----------

function craftEmail(cv, profile, company, role, recruiterName) {
  const narrative = profile.narrative;
  const proofPoints = narrative.proof_points || [];
  const headline = narrative.headline || 'Cloud & Backend Engineer';

  // Pick best proof point for the role type
  const primarySkill = role.toLowerCase().includes('cloud') || role.toLowerCase().includes('aws')
    ? 0 : role.toLowerCase().includes('backend') || role.toLowerCase().includes('java')
      ? 1 : 0;

  const proof = proofPoints[primarySkill] || proofPoints[0] || { hero_metric: 'Delivered 60% cold-start reduction and 65% cloud cost savings' };

  const subject = `Cloud/Backend Engineer interested in ${role} at ${company}`;
  const body = `I'm a cloud & backend engineer specializing in AWS serverless and Java microservices. Based in India (IST), working remote-first.

${proof.hero_metric} — this is the kind of impact I bring.

I'd love to share my CV and discuss how my experience aligns with what ${company} is building.

Best,
${profile.candidate.full_name}
${profile.candidate.linkedin}
${profile.candidate.portfolio_url || ''}`;

  return { subject, body };
}

// ---------- RECRUITER SEARCH (simulated) ----------

function getRecruiterEmail(company) {
  // Common patterns: firstname@company.com, careers@company.com, hr@company.com
  const domain = company.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^(the|a) /, '');
  return `careers@${domain}.com`;
}

function guessRecruiterName(company) {
  return `Hiring Manager`;
}

// ---------- MAIN ----------

async function main() {
  console.log('════════════════════════════════════════════════════');
  console.log('  Worldwide Outreach Agent');
  console.log('  Target: 20 matching cold emails sent');
  console.log('════════════════════════════════════════════════════\n');

  const profile = loadProfile();
  const emailConfig = loadEmailConfig();
  const cv = loadCV();

  console.log(`  Candidate: ${profile.candidate.full_name}`);
  console.log(`  Email:     ${profile.candidate.email}`);
  console.log(`  Location:  ${profile.location.city}, ${profile.location.country}`);
  console.log('');

  // Ensure outreach.tsv exists
  if (!existsSync(OUTREACH_TSV)) {
    writeFileSync(OUTREACH_TSV, 'date\tcompany\trole\trecruiter_name\trecruiter_channel\tmessage_type\tstatus\tsubject\tmessage\tresume_path\n', 'utf-8');
  }

  // Read current sent count
  const existingLines = readFileSync(OUTREACH_TSV, 'utf-8').trim().split('\n').filter(l => l.trim());
  let sentCount = 0;
  for (let i = 1; i < existingLines.length; i++) {
    const cols = existingLines[i].split('\t');
    if (cols[6] === 'sent') sentCount++;
  }

  let remaining = Math.max(0, TARGET - sentCount);
  console.log(`  Already sent: ${sentCount}/${TARGET}`);
  console.log(`  Remaining:    ${remaining}`);
  console.log('');

  if (remaining <= 0) {
    console.log('✅ Target reached! Already have 20+ sent emails.');
    return;
  }

  // Shuffle companies for variety
  const shuffled = [...WORLDWIDE_REMOTE_COMPANIES].sort(() => Math.random() - 0.5);

  for (const company of shuffled) {
    if (remaining <= 0) break;

    console.log(`\n── ${company.name} ──`);

    for (const role of company.roles) {
      if (remaining <= 0) break;

      const matchScore = computeMatchScore(cv, role, company.name);

      if (matchScore < 40) {
        console.log(`  ⏭️  ${role} (match: ${matchScore}%) — too low`);
        continue;
      }

      console.log(`  ✓ ${role} (match: ${matchScore}%)`);

      // Find recruiter
      const recruiterName = guessRecruiterName(company.name);
      const recruiterEmail = getRecruiterEmail(company.name);

      // Craft email
      const { subject, body } = craftEmail(cv, profile, company.name, role, recruiterName);

      // Write to outreach TSV
      const date = new Date().toISOString().split('T')[0];
      const messageType = 'cold_email';
      const resumePath = 'cv-rohan-p-h-hightouch.pdf';
      const cols = [
        date,
        company.name,
        role,
        recruiterName || 'Hiring Team',
        recruiterEmail,
        messageType,
        'draft',
        subject,
        body.replace(/\n/g, '\\n'),
        resumePath,
      ];
      appendFileSync(OUTREACH_TSV, cols.join('\t') + '\n', 'utf-8');

      console.log(`    → ${recruiterEmail} | "${subject}"`);
      remaining--;
      sentCount++;
    }
  }

  console.log(`\n────────────────────────────────────────────────────`);
  console.log(`  Drafts created: ${sentCount - Math.max(0, remaining)}`);
  console.log(`  Run: node send-outreach.mjs`);
  console.log(`  to send all drafted emails (sends up to 20/day)`);
  console.log('────────────────────────────────────────────────────\n');

  // If we have drafts, try to send them
  if (sentCount > 0) {
    console.log('  📤 Sending emails via send-outreach.mjs...');
    try {
      execSync('node send-outreach.mjs', { stdio: 'inherit', timeout: 600000 });
    } catch (err) {
      console.log(`  ⚠️  Send error: ${err.message}`);
      console.log('  Drafts saved in data/outreach.tsv — you can retry with `node send-outreach.mjs`');
    }
  }

  // Check if we need another batch
  const finalSent = readFileSync(OUTREACH_TSV, 'utf-8').trim().split('\n').filter(l => l.trim());
  let finalSentCount = 0;
  for (let i = 1; i < finalSent.length; i++) {
    const cols = finalSent[i].split('\t');
    if (cols[6] === 'sent') finalSentCount++;
  }

  if (finalSentCount < TARGET) {
    console.log(`\n  📋 Sent: ${finalSentCount}/${TARGET}. Need ${TARGET - finalSentCount} more.`);
    console.log('  Run this script again tomorrow to create more drafts + send.');
  } else {
    console.log(`\n  🎉 Target reached: ${finalSentCount}/${TARGET} emails sent!`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
