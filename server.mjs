import express from 'express';
import { execFile } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import schedule from 'node-schedule';

const EMAIL_SVC = process.env.EMAIL_SERVICE_URL;

const PORT = process.env.PORT || 7860;
const jobs = {};

const DATA_DIRS = ['output', 'reports', 'jds', 'batch/tracker-additions', 'tmp'];

// Curated company → domain map (from local yc-outreach.mjs)
const DOMAIN_MAP = {
  'Yassir': 'yassir.com', 'Cashfree Payments': 'cashfree.com', 'Runa': 'runa.com',
  'Enode': 'enode.io', 'GIMO': 'gimo.vn', 'Ashby': 'ashbyhq.com', 'Enerjazz': 'enerjazz.com',
  'Groww': 'groww.in', 'Smartcuts': 'smartcuts.com', 'Deepnote': 'deepnote.com',
  'Loombotic': 'loombotic.com', 'REVER': 'reverscore.com', 'Apprentice Health': 'apprenticehealth.com',
  'Bolster': 'bolster.com', 'BusinessOnBot': 'businessonbot.com', 'GoGoGrandparent': 'gogograndparent.com',
  'Baraka': 'baraka.com', 'Kodo': 'kodo.cards', 'Metorial': 'metorial.com',
  'GovernGPT': 'governgpt.com', 'Sirdab': 'sirdab.com', 'Emergent': 'emergent.sh',
  'Stripe': 'stripe.com', 'Spellbrush': 'spellbrush.com', 'Explorex': 'explorex.co',
  'Razorpay': 'razorpay.com', 'DreamCraft Entertainment, Inc.': 'dreamcraft.com', 'Leadbay': 'leadbay.co',
  'Haystack': 'haystack.com', 'Informed K12': 'informedk12.com', 'Payflow': 'payflow.es',
  'Lightdash': 'lightdash.com', 'Reframe (Glucobit)': 'reframefitness.com', 'Tavus': 'tavus.com',
  'Veryfi, Inc.': 'veryfi.com', 'Ridecell': 'ridecell.com', 'Prembly (formerly Identitypass)': 'prembly.com',
  'Axross Pte Ltd': 'axross.com', 'Miso': 'miso.ai', 'Osium AI': 'osium.ai',
  'Inito': 'inito.com', 'Quickchat AI': 'quickchat.ai', 'DeepAware AI': 'deepaware.ai',
  'Infer': 'infer.in', 'Wifi Dabba, Inc.': 'wifidabba.com', 'Swif.ai': 'swif.ai',
  'Odeko': 'odeko.com', 'Karbon Card': 'karboncard.com', 'Etleap': 'etleap.com', 'Findly': 'findly.ai',
  'Heroic Labs': 'heroiclabs.com', 'OneChronos': 'onechronos.com', 'PostHog': 'posthog.com',
  'FamPay': 'fampay.in', 'ClassDojo': 'classdojo.com', 'AiPrise': 'aiprise.com', 'SigmaOS': 'sigmaos.com',
  'Olympian Motors': 'olympianmotors.com', 'Ziina': 'ziina.com', 'Pelago': 'pelagohealth.com',
  'Instacart': 'instacart.com', 'Pop Meals': 'popmeals.com', 'Ankr Health': 'ankrhealth.com',
  'Constant': 'useconstant.com', 'MorphoAI': 'morphoai.com', 'Autumn': 'autumn.com',
  'Kontigo': 'kontigo.com', 'Upstream': 'upstream.com', 'SuperKalam': 'superkalam.com',
  'Circle Medical': 'circlemedical.com', 'ARQ': 'arq.com', 'Hapi': 'hapi.com',
  'Proven Group': 'proven.com', 'Fleek': 'fleek.com', 'Atomic Industries': 'atomicindustries.com',
  'Roboflow': 'roboflow.com', 'Solve Intelligence': 'solveintelligence.com', 'Encord': 'encord.com',
  'Airweave': 'airweave.ai', 'Aglide': 'aglide.com', 'Respan': 'respan.com', 'Hera': 'hera.com',
  'arnata': 'arnata.com', 'Lucis': 'lucis.com', 'Leeroo': 'leeroo.com', 'Terra API': 'terraapi.com',
  'ProjectPro': 'projectpro.com', 'Runway': 'runwayteam.com', 'Carbonfact': 'carbonfact.com',
  'Prolific': 'prolific.com', 'QFEX': 'qfex.com', 'Seal': 'seal.com', 'Humaans': 'humaans.com',
  'Helloverify': 'helloverify.com', 'Porter': 'porter.com', 'Zippi': 'zippi.com', 'Mercura': 'mercura.com',
  'Legora': 'legora.com', 'Human Archive': 'humanarchive.com', 'Albedo': 'albedo.com',
  'CircuitHub': 'circuithub.com', 'Overview': 'overview.com', 'HyLight': 'hylight.com',
  'Intelline': 'intelline.com', 'Spaceium Inc': 'spaceium.com', 'Rimward': 'rimward.com',
  'Kalam Labs': 'kalamlabs.com', 'Yummy Future': 'yummyfuture.com', 'Charge Robotics': 'chargerobotics.com',
  'Noora Health': 'noorahealth.com', 'Mino Games': 'minogames.com', 'DoorDash': 'doordash.com',
  'Xendit': 'xendit.com', 'Shuttle Central': 'shuttlecentral.com', 'Landeed': 'landeed.com',
  'AgentCollect': 'agentcollect.com', 'VectorShift': 'vectorshift.me', 'Sourcebot': 'sourcebot.dev',
  'Closure': 'closure-intel.com', 'Garage': 'shopgarage.com', 'Astraea': 'tryastraea.com',
  'Manufact': 'manufact.com', 'Thunder Compute': 'thundercompute.com',
};

// Curated founder / contact emails (from local yc-outreach.mjs)
const FOUNDER_EMAILS = {
  'PostHog': 'james@posthog.com', 'GoGoGrandparent': 'justin@gogograndparent.com',
  'Deepnote': 'jakub@deepnote.com', 'Roboflow': 'joseph@roboflow.com',
  'Porter': 'jonah@porter.com', 'Runway': 'siqi@runwayteam.com',
  'Tavus': 'hassaan@tavus.com', 'Inito': 'varun@inito.com',
  'Stripe': 'recruiting@stripe.com', 'Razorpay': 'careers@razorpay.com',
  'Groww': 'careers@groww.in', 'Cashfree Payments': 'careers@cashfree.com',
  'FamPay': 'kush@fampay.in', 'Baraka': 'faris@baraka.com',
  'Kodo': 'rohit@kodo.cards', 'Veryfi, Inc.': 'david@veryfi.com',
  'SuperKalam': 'abhishek@superkalam.com', 'Emergent': 'team@emergent.sh',
  'Noora Health': 'careers@noorahealth.com', 'Ankr Health': 'team@ankrhealth.com',
  'Infer': 'careers@infer.in', 'Karbon Card': 'peeyush@karboncard.com',
  'Wifi Dabba, Inc.': 'shubhendu@wifidabba.com', 'Lightdash': 'ollie@lightdash.com',
  'Circle Medical': 'careers@circlemedical.com', 'Spellbrush': 'li@spellbrush.com',
  'Leadbay': 'team@leadbay.co', 'Prembly (formerly Identitypass)': 'lanre@prembly.com',
  'Encord': 'ulrik@encord.com', 'Terra API': 'team@terraapi.com',
  'Leeroo': 'founders@leeroo.com', 'Osium AI': 'founders@osium.ai',
};

function guessDomain(company) {
  const clean = (company || '').trim();
  if (DOMAIN_MAP[clean]) return DOMAIN_MAP[clean];
  const simplified = clean.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^(the|a)/, '');
  return `${simplified}.com`;
}

function findContactEmail(company) {
  // 1. Curated founder emails
  if (FOUNDER_EMAILS[company]) return FOUNDER_EMAILS[company];

  const domain = guessDomain(company);

  // 2. Patterns to try in order
  const nameParts = company.split(/[\s-]+/);
  const first = nameParts[0]?.toLowerCase().replace(/[^a-z]/g, '') || '';
  const patterns = [
    `hello@${domain}`,
    `team@${domain}`,
    `founders@${domain}`,
    `apply@${domain}`,
    `careers@${domain}`,
    `recruiting@${domain}`,
    `jobs@${domain}`,
  ];
  // Add firstname@domain if company name is a person (single word)
  if (first && nameParts.length <= 2) patterns.unshift(`${first}@${domain}`);

  return { domain, patterns };
}

// Email verification cache (skips already-bounced domains)
const bouncedDomains = new Set();

const STARTER_FILES = {
  'data/pipeline.md': '# Pipeline Inbox\n\n## Pendientes\n\n## Procesadas\n',
  'data/applications.md': '# Applications Tracker\n\n| # | Date | Company | Role | Score | Status | PDF | Report | Notes |\n|---|------|---------|------|-------|--------|-----|--------|-------|\n',
  'data/outreach.tsv': 'date\tcompany\trole\trecruiter_name\trecruiter_channel\tmessage_type\tstatus\tsubject\tmessage\tresume_path\n',
  'data/scan-history.tsv': 'url\tfirst_seen\tportal\ttitle\tcompany\tstatus\n',
};

function ensureDataFiles() {
  for (const dir of DATA_DIRS) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
  for (const [file, content] of Object.entries(STARTER_FILES)) {
    if (!existsSync(file)) writeFileSync(file, content, 'utf-8');
  }
  // Create config/email.yml from env vars — refresh always to pick up secret changes
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const yml = `smtp_host: smtp.gmail.com\nsmtp_port: 587\nsmtp_secure: false\nsmtp_user: '${process.env.SMTP_USER}'\nsmtp_pass: '${process.env.SMTP_PASS}'\nfrom_name: 'Rohan P H'\nfrom_email: '${process.env.SMTP_USER}'\ncandidate_linkedin: 'https://linkedin.com/in/rohan-p-h-876865250'\ncandidate_portfolio: 'https://rohanph-cloud-engineer-75sm7wl.gamma.site/'\n`;
    mkdirSync('config', { recursive: true });
    writeFileSync('config/email.yml', yml, 'utf-8');
    console.log('Created config/email.yml from SMTP_USER/SMTP_PASS env vars');
  }
}

function runScript(script, args = []) {
  return new Promise((resolve, reject) => {
    const child = execFile('node', [script, ...args], {
      cwd: '.',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    }, (error, stdout, stderr) => {
      if (error) reject({ error, stderr });
      else resolve({ stdout, stderr });
    });
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  });
}

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

app.post('/run/scan', async (req, res) => {
  try {
    const args = req.body?.company ? ['--company', req.body.company] : [];
    if (req.body?.dryRun) args.push('--dry-run');
    await runScript('scan.mjs', args);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.error?.message || err.message });
  }
});

app.post('/run/send-outreach', async (_req, res) => {
  try {
    await runScript('send-outreach.mjs');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.error?.message || err.message });
  }
});

app.post('/run/worldwide-outreach', async (_req, res) => {
  try {
    await runScript('worldwide-outreach-agent.mjs');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.error?.message || err.message });
  }
});

app.post('/run/pdf', async (req, res) => {
  try {
    const { input, output, format } = req.body || {};
    if (!input || !output) return res.status(400).json({ error: 'input and output required' });
    const args = [input, output];
    if (format) args.push(`--format=${format}`);
    await runScript('generate-pdf.mjs', args);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.error?.message || err.message });
  }
});

app.post('/run/test-email', async (req, res) => {
  try {
    const { to, subject, message } = req.body || {};
    if (!to) return res.status(400).json({ error: '"to" field required' });

    // Use email microservice if configured (Koyeb)
    if (EMAIL_SVC) {
      const r = await fetch(EMAIL_SVC.replace(/\/+$/, '') + '/run/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject: subject || 'Career-Ops Test Email', message: message || 'Test from Career-Ops.' }),
      });
      const d = await r.json();
      return res.json(d);
    }

    const cfg = (await import('js-yaml')).load(await import('fs').then(m => m.readFileSync('config/email.yml', 'utf-8')));
    const transporter = (await import('nodemailer')).default.createTransport({
      host: cfg.smtp_host, port: cfg.smtp_port, secure: cfg.smtp_secure,
      auth: { user: cfg.smtp_user, pass: cfg.smtp_pass },
    });

    const body = `Hi,

This is a test email from the Career-Ops deployment.

${message || 'Test message - no content.'}

---
Best regards,
${cfg.from_name || 'Career-Ops'}
${cfg.candidate_linkedin || ''}`;

    await transporter.sendMail({
      from: `"${cfg.from_name}" <${cfg.from_email}>`,
      to, subject: subject || 'Career-Ops Test Email', text: body,
    });

    res.json({ success: true, to });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Clean send-email endpoint (no template wrapping). Proxies to EMAIL_SVC if configured.
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, text } = req.body || {};
    if (!to || !subject) return res.status(400).json({ error: '"to" and "subject" required' });

    if (EMAIL_SVC) {
      const r = await fetch(EMAIL_SVC.replace(/\/+$/, '') + '/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, text: text || '' }),
      });
      return res.json(await r.json());
    }

    const cfg = (await import('js-yaml')).load((await import('fs')).readFileSync('config/email.yml', 'utf-8'));
    const transporter = (await import('nodemailer')).default.createTransport({
      host: cfg.smtp_host, port: cfg.smtp_port, secure: cfg.smtp_secure,
      auth: { user: cfg.smtp_user, pass: cfg.smtp_pass },
    });
    await transporter.sendMail({
      from: `"${cfg.from_name}" <${cfg.from_email}>`,
      to, subject, text: text || '',
    });
    res.json({ success: true, to, subject });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/run/doctor', async (_req, res) => {
  try {
    await runScript('doctor.mjs');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.error?.message || err.message });
  }
});

app.post('/run/verify', async (_req, res) => {
  try {
    await runScript('verify-pipeline.mjs');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.error?.message || err.message });
  }
});

app.post('/run/yc-fetch', async (req, res) => {
  try {
    const args = [];
    if (req.body?.query) args.push('-q', req.body.query);
    if (req.body?.role) args.push('--role', req.body.role);
    if (req.body?.location) args.push('-l', req.body.location);
    if (req.body?.company) args.push('--company', req.body.company);
    if (req.body?.hits) args.push('-n', String(req.body.hits));
    if (req.body?.output) args.push('-o', req.body.output);
    await runScript('scripts/yc-fetch.mjs', ['fetch', ...args]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.error?.message || err.message });
  }
});

app.post('/run/yc-scrape', async (_req, res) => {
  try {
    await runScript('scripts/yc-scraper.mjs');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.error?.message || err.message });
  }
});

app.post('/run/yc-email', async (_req, res) => {
  try {
    // 1. Run the scraper
    await runScript('scripts/yc-scraper.mjs');

    // 2. Read output
    const { readFileSync, existsSync } = await import('fs');
    if (!existsSync('data/yc-jobs.json')) return res.status(500).json({ error: 'yc-jobs.json not found after scrape' });
    const raw = JSON.parse(readFileSync('data/yc-jobs.json', 'utf-8'));
    const jobs = (raw.jobs || []).slice(0, 8);

    // 3. Build email body
    let body = 'YC Jobs - Scraped\n' + '='.repeat(40) + '\n\n';
    jobs.forEach((j, i) => {
      body += `${i + 1}. ${j.title || 'N/A'} @ ${j.company || 'N/A'}\n`;
      body += `   Location: ${j.location || 'N/A'}\n`;
      body += `   ${j.url || 'N/A'}\n\n`;
    });

    // 4. Send via Koyeb proxy or direct
    const cfg = (await import('js-yaml')).load(readFileSync('config/email.yml', 'utf-8'));
    if (EMAIL_SVC) {
      const r = await fetch(EMAIL_SVC.replace(/\/+$/, '') + '/run/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: process.env.SMTP_USER || 'lockin3277@gmail.com', subject: 'YC Jobs - Scraped', message: body }),
      });
      const d = await r.json();
      res.json({ success: d.success, jobs: jobs.length, email_sent: d.success, body: body.substring(0, 500) });
    } else {
      const transporter = (await import('nodemailer')).default.createTransport({
        host: cfg.smtp_host, port: cfg.smtp_port, secure: cfg.smtp_secure,
        auth: { user: cfg.smtp_user, pass: cfg.smtp_pass },
      });
      await transporter.sendMail({
        from: `"${cfg.from_name}" <${cfg.from_email}>`,
        to: 'lockin3277@gmail.com', subject: 'YC Jobs - Scraped', text: body,
      });
      res.json({ success: true, jobs: jobs.length, body: body.substring(0, 500) });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/run/yc-outreach', async (req, res) => {
  try {
    const { readFileSync, existsSync, writeFileSync } = await import('fs');
    const jsYaml = await import('js-yaml');
    const count = Math.min(Math.max(parseInt(req.body?.count) || 1, 1), 5);

    // 1. Fast YC query — only targeted terms, no 30-query crawl
    const HEADERS = { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' };
    const terms = ['cloud engineer', 'backend engineer', 'platform engineer', 'infrastructure', 'devops'];
    const seen = new Map();
    for (const term of terms) {
      try {
        const r = await fetch(`https://www.workatastartup.com/jobs/search?q=${encodeURIComponent(term)}`, { headers: HEADERS });
        const data = await r.json();
        for (const j of (data.jobs || [])) {
          if (!seen.has(j.id)) seen.set(j.id, {
            id: j.id, title: j.title || '', company: j.companyName || '',
            location: j.location || '', job_type: j.jobType || '',
            role: j.roleType || '', salary: j.salary || '',
            batch: j.companyBatch || '', oneliner: j.companyOneLiner || '',
            url: j.applyUrl || '',
          });
        }
      } catch {}
    }
    const allJobs = Array.from(seen.values());

    // 2. Score & shortlist — match against Rohan's profile keywords
    const keywords = ['cloud', 'backend', 'platform', 'infrastructure', 'aws', 'java', 'serverless', 'devops', 'sre', 'kubernetes', 'terraform', 'engineer'];
    const scored = allJobs.map(j => {
      const text = (j.title + ' ' + j.oneliner).toLowerCase();
      const score = keywords.filter(k => text.includes(k)).length;
      return { ...j, score };
    }).filter(j => j.score > 0).sort((a, b) => b.score - a.score);

    const topN = scored.slice(0, Math.max(count, 3));
    if (!topN.length) return res.json({ success: false, error: 'No matching jobs found', total: allJobs.length });

    const cfg = jsYaml.load(readFileSync('config/email.yml', 'utf-8'));
    const cv = existsSync('cv.md') ? readFileSync('cv.md', 'utf-8') : '';
    const headline = 'Cloud & Backend Engineer specializing in serverless AWS, Java microservices, and AI';
    const highlights = cv.includes('60%')
      ? 'reducing cold-start latency by 60%, cutting cloud OpEx by 65%, and building LLM-powered RAG systems'
      : 'building and scaling distributed systems on AWS';
    const name = cfg.from_name || 'Rohan P H';

    const results = [];
    for (let i = 0; i < count && i < topN.length; i++) {
      const target = topN[i];

      // Try fetching the company's job page for contact info
      let contactEmail = null;
      let contactName = null;
      if (target.id) {
        try {
          const appR = await fetch(`https://www.workatastartup.com/companies/${encodeURIComponent(target.company?.toLowerCase().replace(/[^a-z0-9]/g, '-') || '')}`, {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
          });
          const appData = await appR.json();
          if (appData.company) {
            contactEmail = appData.company.founder_email || appData.company.contact_email;
            contactName = appData.company.founder_name || appData.company.contact_name;
          }
        } catch {}
      }
      let found = null;
      if (!contactEmail) {
        found = findContactEmail(target.company);
        if (typeof found === 'string') {
          contactEmail = found;
          contactName = `${target.company} Team`;
        } else if (found.patterns?.length) {
          contactEmail = found.patterns[0];
          contactName = `${target.company} Team`;
        }
      }

      const emailBody = `Hi ${contactName || target.company} team,

I'm reaching out about the ${target.title} role at ${target.company}. 

I'm ${name}, a ${headline}. At BT Openreach, I've been owning end-to-end delivery of serverless platforms — ${highlights}.

I'm drawn to ${target.company} because of ${target.oneliner || 'the impactful work you\'re doing'}, and I'm confident my background in AWS, distributed systems, and Java aligns well with what you're building.

I'd love to chat about how I can contribute.

Best,
${name}
${cfg.candidate_linkedin || ''}`;

      // Try multiple contact emails (curated match, then patterns)
      const tries = found ? (typeof found === 'string' ? [found] : [contactEmail, ...found.patterns.filter(p => p !== contactEmail)]) : [contactEmail].filter(Boolean);
      let emailResult = { success: false };
      let sentEmail = null;
      for (const addr of tries) {
        if (bouncedDomains.has(addr.split('@')[1])) continue;
        try {
          const r = await fetch((EMAIL_SVC || 'http://localhost:' + PORT).replace(/\/+$/, '') + '/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: addr, subject: `Application for ${target.title} at ${target.company}`, text: emailBody }),
          });
          const result = await r.json();
          if (result.success) {
            emailResult = { success: true };
            sentEmail = addr;
            break;
          }
          emailResult = { success: false, error: result.error };
        } catch (e) {
          emailResult = { success: false, error: e.message };
          const domain = addr.split('@')[1];
          if (domain) bouncedDomains.add(domain);
        }
      }

      const ts = new Date().toISOString();
      const finalEmail = sentEmail || contactEmail;
      const draftLine = `${ts}\t${target.company}\t${target.title}\t${contactName}\t${finalEmail}\toutreach\t${emailResult.success ? 'sent' : 'pending'}\tApplication for ${target.title} at ${target.company}\t${emailBody.substring(0,100)}...\n`;
      writeFileSync('data/outreach.tsv', draftLine, { flag: 'as+' });

      results.push({
        target: { company: target.company, title: target.title, score: target.score },
        contact: { name: contactName, email: finalEmail },
        email_sent: emailResult.success,
      });
    }

    res.json({
      success: results.some(r => r.email_sent),
      emails: results,
      total_scraped: allJobs.length,
      shortlisted: scored.length,
      top_3: scored.slice(0, 3).map(j => ({ company: j.company, title: j.title, score: j.score })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/run/yc-scrape-eng', async (req, res) => {
  try {
    const args = [];
    if (req.body?.filters) args.push('-f', req.body.filters);
    if (req.body?.hits) args.push('-n', String(req.body.hits));
    if (req.body?.maxPages) args.push('-m', String(req.body.maxPages));
    await runScript('scripts/scrape-yc-jobs.mjs', args);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.error?.message || err.message });
  }
});

app.post('/run/scrape', async (req, res) => {
  const { prompt, source, company, role, location, title, hits } = req.body || {};
  const sources = source === 'all' ? ['portals', 'yc', 'yc-eng', 'yc-public'] : [source || 'yc'];
  const results = [];

  console.log(`[scrape] prompt="${prompt}" source=${sources.join(',')} company=${company} role=${role} location=${location}`);

  for (const s of sources) {
    try {
      switch (s) {
        case 'portals': {
          const args = [];
          if (company) args.push('--company', company);
          await runScript('scan.mjs', args);
          results.push({ source: s, success: true });
          break;
        }
        case 'yc': {
          const args = ['fetch'];
          if (company) args.push('--company', company);
          if (role) args.push('--role', role);
          if (location) args.push('-l', location);
          if (title) args.push('-q', title);
          if (hits) args.push('-n', String(hits));
          await runScript('scripts/yc-fetch.mjs', args);
          results.push({ source: s, success: true });
          break;
        }
        case 'yc-eng': {
          const args = [];
          const filters = [];
          if (role) filters.push(`role:${role}`);
          if (company) filters.push(`company_name:"${company}"`);
          if (location) filters.push(`locations_for_search:"${location}"`);
          if (filters.length) args.push('-f', filters.join(' AND '));
          if (hits) args.push('-n', String(hits));
          await runScript('scripts/scrape-yc-jobs.mjs', args);
          results.push({ source: s, success: true });
          break;
        }
        case 'yc-public': {
          await runScript('scripts/yc-scraper.mjs');
          results.push({ source: s, success: true });
          break;
        }
        default:
          results.push({ source: s, success: false, error: `unknown source: ${s}` });
      }
    } catch (err) {
      results.push({ source: s, success: false, error: err.error?.message || err.message });
    }
  }

  res.json({ success: results.some(r => r.success), results });
});

app.post('/run/outreach-for', async (req, res) => {
  try {
    const { company, role } = req.body || {};
    if (!company || !role) return res.status(400).json({ error: '"company" and "role" required' });

    const fs = await import('fs');
    const jsYaml = await import('js-yaml');

    // 1. Load CV
    const cv = fs.existsSync('cv.md') ? fs.readFileSync('cv.md', 'utf-8') : '';
    // 2. Load SMTP config
    const cfg = jsYaml.load(fs.readFileSync('config/email.yml', 'utf-8'));
    const transporter = (await import('nodemailer')).default.createTransport({
      host: cfg.smtp_host, port: cfg.smtp_port, secure: cfg.smtp_secure,
      auth: { user: cfg.smtp_user, pass: cfg.smtp_pass },
    });

    // 3. Try YC Algolia for company info
    let jobInfo = null;
    try {
      const algoliaKey = process.env.YC_ALGOLIA_KEY || '';
      if (algoliaKey) {
        const resA = await fetch(`https://45bwzj1sgc-dsn.algolia.net/1/indexes/WaaSPublicCompanyJob_created_at_desc_production/query`, {
          method: 'POST',
          headers: { 'X-Algolia-Application-Id': '45BWZJ1SGC', 'X-Algolia-API-Key': algoliaKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: role, hitsPerPage: 5, filters: `company_name:"${company}"`, attributesToRetrieve: ['title','company_name','locations_for_search','remote','description'] }),
        });
        const data = await resA.json();
        if (data.hits?.length) jobInfo = data.hits[0];
      }
    } catch {}

    // 4. Build a genuine outreach email using CV context
    const name = cfg.from_name || 'Rohan P H';
    const headline = 'Cloud & Backend Engineer specializing in serverless AWS, Java microservices, and AI';
    const highlights = cv.includes('60%') ? 'reducing cold-start latency by 60%, cutting cloud OpEx by 65%, and building LLM-powered RAG systems' : 'building and scaling distributed systems on AWS';
    const companyContext = jobInfo ? `I see you're hiring a ${jobInfo.title} — ${jobInfo.description?.substring(0, 200) || 'building AI-native solutions'}` : `I'm very interested in the ${role} role at ${company}`;

    const body = `Hi ${company} team,

${companyContext}.

I'm ${name}, a ${headline}. At BT Openreach, I've been owning end-to-end delivery of serverless platforms — ${highlights}.

I'm drawn to ${company} because of the meaningful impact you're making, and I'm confident my background in ${(jobInfo?.description || '').includes('AWS') ? 'AWS, distributed systems, and on-the-ground delivery' : 'full-stack engineering, security, and AI'} aligns well with what you're building.

I'd love to chat about how I can contribute.

Best,
${name}
${cfg.candidate_linkedin || ''}`;

    // 5. Find contact emails (curated map + smart patterns)
    const found = findContactEmail(company);
    const guesses = typeof found === 'string' ? [found] : found.patterns;

    let sent = false;
    const results = [];
    for (const to of guesses) {
      try {
        const ephost = (EMAIL_SVC || 'http://localhost:' + PORT).replace(/\/+$/, '');
        const r = await fetch(ephost + '/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, subject: `Application for ${role} at ${company}`, text: body }),
        });
        const d = await r.json();
        if (d.success) { results.push({ to, success: true }); sent = true; break; }
        else { results.push({ to, success: false, error: d.error }); }
      } catch (e) {
        results.push({ to, success: false, error: e.message });
      }
    }

    res.json({ success: sent, company, role, candidate_name: name, emails_tried: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/run/ai-prompt', (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: '"prompt" required' });

  const jobId = randomUUID().slice(0, 8);
  jobs[jobId] = { status: 'running', prompt, result: null, error: null, started: Date.now() };

  const child = execFile('opencode', ['run', prompt, '--dangerously-skip-permissions', '--format', 'default'], {
    cwd: '.',
    env: { ...process.env, TERM: 'dumb', OPENCODE_CLI_DISABLE_TELEMETRY: '1' },
    timeout: 600000,
    maxBuffer: 10 * 1024 * 1024,
  });

  let stdout = '', stderr = '';
  child.stdout.on('data', d => stdout += d);
  child.stderr.on('data', d => stderr += d);

  child.on('close', code => {
    jobs[jobId].status = code === 0 ? 'done' : 'error';
    jobs[jobId].result = stdout.trim();
    jobs[jobId].error = code !== 0 ? stderr.trim() : null;
  });
  child.on('error', err => {
    jobs[jobId].status = 'error';
    jobs[jobId].error = err.message;
  });

  res.json({ success: true, job_id: jobId, status: 'running' });
});

app.get('/run/ai-prompt/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: 'job not found' });
  res.json({ job_id: req.params.jobId, status: job.status, result: job.result, error: job.error });
});

app.get('/run/ai-prompt', (_req, res) => {
  const list = Object.entries(jobs).slice(-20).map(([id, j]) => ({ job_id: id, status: j.status, prompt: j.prompt?.slice(0, 80), started: j.started }));
  res.json(list);
});

const SCAN_SCHEDULE = process.env.SCAN_SCHEDULE;
const OUTREACH_SCHEDULE = process.env.OUTREACH_SCHEDULE;
const YC_SCHEDULE = process.env.YC_SCHEDULE;

if (SCAN_SCHEDULE) {
  schedule.scheduleJob(SCAN_SCHEDULE, () => {
    console.log(`[${new Date().toISOString()}] Scheduled scan starting...`);
    runScript('scan.mjs').catch(err => console.error('Scheduled scan failed:', err.error?.message));
  });
  console.log(`Scan scheduled: ${SCAN_SCHEDULE}`);
}

if (OUTREACH_SCHEDULE) {
  schedule.scheduleJob(OUTREACH_SCHEDULE, () => {
    console.log(`[${new Date().toISOString()}] Scheduled outreach starting...`);
    runScript('worldwide-outreach-agent.mjs').catch(err => console.error('Scheduled outreach failed:', err.error?.message));
  });
  console.log(`Outreach scheduled: ${OUTREACH_SCHEDULE}`);
}

if (YC_SCHEDULE) {
  schedule.scheduleJob(YC_SCHEDULE, () => {
    console.log(`[${new Date().toISOString()}] Scheduled YC scrape starting...`);
    runScript('scripts/yc-scraper.mjs').catch(err => console.error('Scheduled YC scrape failed:', err.error?.message));
  });
  console.log(`YC scrape scheduled: ${YC_SCHEDULE}`);
}

ensureDataFiles();

app.listen(PORT, () => {
  console.log(`Career-Ops server listening on port ${PORT}`);
});
