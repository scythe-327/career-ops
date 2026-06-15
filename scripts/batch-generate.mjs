#!/usr/bin/env node
/**
 * Batch generator: creates tailored HTML CVs + PDFs + TSV entries for 10 YC companies.
 * Usage: node scripts/batch-generate.mjs
 */

import { execFileSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync, mkdirSync, appendFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TEMPLATE = path.join(ROOT, 'templates', 'cv-template.html');
const OUTPUT = path.join(ROOT, 'output');
const TSV = path.join(ROOT, 'data', 'outreach.tsv');
const TODAY = new Date().toISOString().slice(0, 10);

if (!existsSync(OUTPUT)) mkdirSync(OUTPUT, { recursive: true });

const COMPANIES = [
  {
    name: 'Constant', role: 'Founding Engineer', recruiter: 'Ben Sender', email: 'ben@useconstant.com',
    summary: 'Cloud & Backend Engineer building high-scale serverless platforms with Java (Quarkus/Spring Boot), Angular, and AWS. Reduced cold-start latency by 60% and cloud OpEx by 65%.',
    pitch: 'I\'m a Cloud & Backend Engineer drawn to early-stage building at Constant. I led the migration of 17+ legacy apps to serverless AWS, cutting cold-start latency by 60% and cloud costs by 65% at BT Group. I designed a centralized auth system securing 45+ services and built Angular SPAs from scratch. As a Founding Engineer, I bring the full-stack versatility and infrastructure ownership your team needs.',
    angle: 'full-stack + founding engineer',
  },
  {
    name: 'Narrative', role: 'Founding Engineer (Backend + AI)', recruiter: 'Suchit Dubey', email: 'suchit@trynarrative.com',
    summary: 'Backend & AI Engineer with hands-on RAG system expertise (Mistral 20B + FAISS) and production serverless platforms on AWS.',
    pitch: 'I\'m a Backend & AI Engineer who built production RAG systems with Mistral 20B and FAISS vector search, implementing end-to-end pipelines from embedding to generation. At BT Group, I built serverless platforms handling 5,000+ RPM and reduced cold-start latency by 60%. Narrative\'s AI-powered testing platform aligns perfectly with my experience combining backend infrastructure with LLM deployment.',
    angle: 'backend + AI infrastructure',
  },
  {
    name: 'Reviving Mind', role: 'Founding Engineer', recruiter: 'Rahul Sharma', email: 'rahul@revivingmind.com',
    summary: 'Cloud & Backend Engineer specializing in secure, scalable serverless platforms and AI-powered systems.',
    pitch: 'I\'m a Cloud & Backend Engineer passionate about using technology for meaningful impact — Reviving Mind\'s mission to combat senior isolation through AI-driven collaborative care resonates deeply. I built high-reliability serverless platforms achieving 99.95% availability and LLM-powered recommendation systems. My experience designing secure, compliant infrastructure for enterprise deployments maps well to healthcare\'s requirements.',
    angle: 'healthtech + infrastructure + AI',
  },
  {
    name: 'Wolfia', role: 'Software Engineer (Full-Stack, AI-Native)', recruiter: 'Naren Manoharan', email: 'naren@wolfia.com',
    summary: 'Full-Stack Engineer with AI-native development experience: LLM-powered RAG systems + Angular SPA + serverless AWS.',
    pitch: 'I\'m a Full-Stack Engineer who builds AI-native applications end-to-end. I deployed Mistral 20B locally on GPU with FAISS vector search for a production RAG recommendation engine and led a JSP-to-Angular SPA migration at BT Group. Wolfia\'s AI agents for security questionnaires is solving a real pain point — I\'d love to help scale it.',
    angle: 'full-stack + AI-native + low experience barrier (1+ yr)',
  },
  {
    name: 'Whip', role: 'Founding Mobile Engineer (React Native)', recruiter: 'Agam Jain', email: 'agam@whip.run',
    summary: 'Full-Stack Engineer experienced in Angular/TypeScript frontend, AWS serverless backend, and building consumer-scale applications.',
    pitch: 'I\'m a Full-Stack Engineer who led a JSP-to-Angular SPA migration and built serverless platforms handling 45+ services at BT Group. While my frontend work is Angular rather than React Native, I bring deep component architecture, state management, and API integration experience. Whip\'s interactive AI mini-app platform is a fascinating consumer product — I\'m excited about the Bengaluru-based founding team opportunity.',
    angle: 'full-stack + Bengaluru + consumer product',
  },
  {
    name: 'Allus AI', role: 'Founding AI Agent Engineer', recruiter: 'Shijie Wang', email: 'shijie.wang@allus.ai',
    summary: 'AI Engineer with production RAG/LLM deployment experience and distributed systems expertise on AWS.',
    pitch: 'I\'m an Engineer who combines AI deployment experience with production infrastructure. I built an end-to-end RAG pipeline with Mistral 20B + FAISS for real-time AI recommendations and deployed distributed systems on AWS with 99.95% availability. Allus AI\'s vision foundation model for manufacturing defect detection is tackling a hard, high-impact problem — I\'d contribute both AI and infrastructure depth.',
    angle: 'AI + infrastructure + manufacturing AI',
  },
  {
    name: 'Sully.ai', role: 'Technical Lead', recruiter: 'Ahmed Omar', email: 'omar@sully.ai',
    summary: 'Cloud & Backend Engineer with platform security design expertise, team leadership, and enterprise-scale infrastructure.',
    pitch: 'I\'m a Cloud & Backend Engineer experienced in leading platform-wide initiatives — I designed a centralized auth system serving 45+ services, led the migration of 17+ apps to serverless, and mentored team members on CI/CD and security practices. Sully.ai\'s AI agents for hospital operations operate at the intersection of reliability and scale that I thrive in.',
    angle: 'technical leadership + platform engineering + healthcare AI',
  },
  {
    name: 'SuperKalam', role: 'Mobile Engineer (React Native + Fullstack)', recruiter: 'Aseem Gupta', email: 'aseem@superkalam.com',
    summary: 'Full-Stack Engineer with Angular frontend expertise and scalable backend platforms on AWS.',
    pitch: 'I\'m a Full-Stack Engineer who led a JSP-to-Angular SPA migration and built serverless platforms on AWS at BT Group. While my frontend expertise is Angular, I bring strong component architecture, state management, and API design skills that translate directly to React Native. SuperKalam\'s AI-powered UPSC mentoring platform has meaningful scale potential in India\'s edtech space.',
    angle: 'full-stack + edtech + India market',
  },
  {
    name: 'Convexia', role: 'Founding Engineer', recruiter: 'Rahul Vijayan', email: 'rahul@convexia.bio',
    summary: 'Cloud & Backend Engineer with distributed systems expertise, AI pipeline experience, and full-stack versatility.',
    pitch: 'I\'m a Full-Stack Engineer excited by Convexia\'s AI-maximalist approach to pharma — replacing manual drug diligence with AI agents. I built production-grade AI pipelines (LLM + vector search) and scaled serverless platforms to 5,000+ RPM at 99.95% availability. I\'ve taken end-to-end ownership of complex migrations and love building from scratch.',
    angle: 'AI agents + pharma + full-stack',
  },
  {
    name: 'Hera', role: 'Founding AI Engineer', recruiter: 'Chia-Lun Wu', email: 'chia@hera.video',
    summary: 'Full-Stack & AI Engineer who built Angular SPAs, serverless backends, and LLM-powered recommendation systems.',
    pitch: 'I\'m a Full-Stack Engineer who built Angular-based SPAs and serverless platforms on AWS serving 45+ microservices. My AI work includes deploying Mistral 20B with FAISS for real-time recommendations. Hera\'s AI motion designer is transforming a creative workflow I find fascinating — automating the tedious while preserving creative control is exactly the kind of product challenge I want to solve.',
    angle: 'full-stack + AI + creative tools',
  },
];

function escapeTsv(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes('\t') || s.includes('\n') || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function buildSummaryHtml(c, companySummary) {
  const location = ['Constant','Wolfia','Reviving Mind','Allus AI','Sully.ai','Convexia','Hera'].includes(c.name) ? 'Bengaluru, India (Remote)' :
    'Bengaluru, India';
  const linkedin = 'https://linkedin.com/in/rohan-p-h-876865250';
  const portfolio = 'https://rohanph-cloud-engineer-75sm7wl.gamma.site';

  return [
    `<div class="section avoid-break">`,
    `  <div class="section-title">Professional Summary</div>`,
    `  <div class="summary-text">${companySummary}</div>`,
    `</div>`
  ].join('\n');
}

function buildCompetencies() {
  return [
    'Cloud & Backend Engineering', 'Java (Quarkus / Spring Boot)',
    'AWS Serverless (Lambda, API Gateway)', 'Angular / Frontend',
    'Platform Security (JWT, RSA, OAuth2/OIDC)', 'LLM / RAG Systems',
    'Distributed Systems', 'CI/CD & DevOps',
  ].map(s => `<span class="competency-tag">${s}</span>`).join('\n');
}

function buildExperience() {
  return `
<div class="job">
  <div class="job-header">
    <span class="job-company">BT Group (Openreach)</span>
    <span class="job-period">Aug 2024 – Present</span>
  </div>
  <div class="job-role">Cloud Engineering Professional | Bengaluru</div>
  <ul>
    <li>Migrated 17/45+ legacy applications to a serverless AWS platform (API Gateway + Lambda + Quarkus), supporting REST, SOAP, SES workflows, and DB integrations.</li>
    <li>Designed a centralized Lambda Authorizer handling dual authentication: Custom JWT + Azure AD JWT (OIDC) with RSA-encrypted headers, audience validation, group-based authorization, and fail-secure policy enforcement.</li>
    <li>Reduced auth latency to 80-120ms (warm) while eliminating duplication across 45+ services.</li>
    <li>Re-architected systems from Spring Boot to Quarkus, reducing cold-start latency by 60% and enabling efficient Lambda execution.</li>
    <li>Optimized AWS resource utilization, achieving a 65% reduction in cloud OpEx.</li>
    <li>Led migration from JSP to Angular SPA + headless AEM, improving UX, scalability, and frontend-backend decoupling.</li>
    <li>Designed CI/CD pipelines (GitLab + SAM) with automated builds, deployment, security scans, and environment configuration.</li>
    <li>Implemented structured logging, observability, and debugging pipelines using CloudWatch.</li>
    <li>Awarded Best Platform Security Innovation and Best Migration Project (2025).</li>
  </ul>
</div>
<div class="job">
  <div class="job-header">
    <span class="job-company">BT Group (Openreach)</span>
    <span class="job-period">Jan 2024 – Jul 2024</span>
  </div>
  <div class="job-role">Software Development Intern | Bengaluru</div>
  <ul>
    <li>Migrated Spring Boot services to Quarkus, improving startup times by 40%.</li>
    <li>Implemented circuit breakers and retry logic to meet a strict 2s SLA across distributed APIs.</li>
    <li>Built high-throughput SOAP integrations handling 5,000+ RPM.</li>
  </ul>
</div>
<div class="job">
  <div class="job-header">
    <span class="job-company">HPCC Systems (LexisNexis)</span>
    <span class="job-period">Sep 2022 – Aug 2023</span>
  </div>
  <div class="job-role">Project Intern | Remote</div>
  <ul>
    <li>Won 1st place among 45 teams in a hackathon internship conversion.</li>
    <li>Built a distributed tensor processing pipeline embedding Python (NumPy) in ECL for large-scale image data.</li>
    <li>Developed multi-node tensor resizing and stacking libraries for distributed environments.</li>
  </ul>
</div>`;
}

function buildProject() {
  return `
<div class="project">
  <div class="project-title">AI Wardrobe Intelligence — RAG Outfit Planner</div>
  <div class="project-desc">
    Built an LLM-powered recommendation engine using Mistral 20B deployed locally on GPU. Designed end-to-end RAG pipeline: embedding → FAISS retrieval → gap analysis → prompt planning → LLM generation. Implemented semantic wardrobe search for context-aware outfit generation. Built authentication with dependency injection for protected APIs.
  </div>
  <div class="project-tech">FastAPI, SQLite, FAISS, Mistral 20B, Python, Docker</div>
</div>`;
}

function buildEducation() {
  return `
<div class="edu-item">
  <div class="edu-header">
    <span class="edu-title">B.E. Computer Science and Engineering</span>
    <span class="edu-year">2020 – 2024</span>
  </div>
  <div class="edu-org">R.V. College of Engineering, Bengaluru</div>
</div>`;
}

function buildSkills() {
  const categories = [
    ['Languages', 'Java, Python, JavaScript, C/C++'],
    ['Backend', 'Quarkus, Spring Boot, REST, SOAP, Microservices'],
    ['Cloud', 'AWS Lambda, API Gateway, CloudFront, EC2, ECR, SES, CloudWatch, SAM'],
    ['Security', 'JWT, OAuth2/OIDC, Azure AD, RSA Encryption, API Authorizers'],
    ['Data', 'SQL, DynamoDB, Kafka, SQS, Elasticsearch, FAISS'],
    ['Frontend', 'Angular, TypeScript, HTML/CSS, JavaScript'],
    ['Tools', 'Git, Docker, Linux, Playwright, JUnit, Mockito, CI/CD'],
  ];
  return categories.map(([cat, val]) =>
    `<div class="skill-item"><span class="skill-category">${cat}:</span> ${val}</div>`
  ).join('\n');
}

function generateHtml(c, summary) {
  const template = readFileSync(TEMPLATE, 'utf-8');
  const summaryHtml = buildSummaryHtml(c, summary);
  const competenciesHtml = buildCompetencies();
  const experienceHtml = buildExperience();
  const projectHtml = buildProject();
  const educationHtml = buildEducation();
  const skillsHtml = buildSkills();

  return template
    .replace(/{{NAME}}/g, 'Rohan P H')
    .replace(/{{EMAIL}}/g, 'rohanph327@gmail.com')
    .replace(/{{LINKEDIN_URL}}/g, 'https://linkedin.com/in/rohan-p-h-876865250')
    .replace(/{{LINKEDIN_DISPLAY}}/g, 'linkedin.com/in/rohan-p-h-876865250')
    .replace(/{{PORTFOLIO_URL}}/g, 'https://rohanph-cloud-engineer-75sm7wl.gamma.site')
    .replace(/{{PORTFOLIO_DISPLAY}}/g, 'rohanph-cloud-engineer-75sm7wl.gamma.site')
    .replace(/{{LOCATION}}/g, 'Bengaluru, India')
    .replace(/{{LANG}}/g, 'en')
    .replace(/{{PAGE_WIDTH}}/g, '800px')
    .replace(/{{SECTION_SUMMARY}}/g, 'Professional Summary')
    .replace(/{{SECTION_COMPETENCIES}}/g, 'Core Competencies')
    .replace(/{{SECTION_EXPERIENCE}}/g, 'Experience')
    .replace(/{{SECTION_PROJECTS}}/g, 'Projects')
    .replace(/{{SECTION_EDUCATION}}/g, 'Education')
    .replace(/{{SECTION_CERTIFICATIONS}}/g, '')
    .replace(/{{SECTION_SKILLS}}/g, 'Technical Skills')
    .replace(/{{SUMMARY_TEXT}}/g, summary)
    .replace(/{{COMPETENCIES}}/g, competenciesHtml)
    .replace(/{{EXPERIENCE}}/g, experienceHtml)
    .replace(/{{PROJECTS}}/g, projectHtml)
    .replace(/{{EDUCATION}}/g, educationHtml)
    .replace(/{{CERTIFICATIONS}}/g, '')
    .replace(/{{SKILLS}}/g, skillsHtml);
}

async function main() {
  console.log('🚀 Generating batch of 10 tailored CVs + outreach entries...\n');

  for (const c of COMPANIES) {
    const safeName = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const htmlPath = path.join(OUTPUT, `cv-${safeName}.html`);
    const pdfPath = path.join(OUTPUT, `cv-rohan-ph-${safeName}-${TODAY}.pdf`);
    const shortPdf = path.basename(pdfPath);

    // Generate HTML
    const html = generateHtml(c, c.summary);
    writeFileSync(htmlPath, html, 'utf-8');
    console.log(`  ✓ HTML: ${c.name} (${c.role})`);

    // Generate PDF
    try {
      execFileSync('node', [
        'generate-pdf.mjs', htmlPath, pdfPath, '--format=a4',
      ], { cwd: ROOT, timeout: 30000, stdio: 'pipe' });
      console.log(`  ✓ PDF: ${shortPdf}`);
    } catch (e) {
      console.log(`  ✗ PDF failed for ${c.name}: ${e.message}`);
    }

    // Build email body
    const linkedin = 'linkedin.com/in/rohan-p-h-876865250';
    const portfolio = 'rohanph-cloud-engineer-75sm7wl.gamma.site';
    const emailBody = `Hi ${c.recruiter.split(' ')[0]},

${c.pitch}

I've attached my CV for more detail. My LinkedIn is ${linkedin} and portfolio: ${portfolio}

Would you be open to a brief conversation?

Best,
Rohan P H`;

    const subject = `${c.role === 'Founding Engineer' ? 'Founding Engineer' : c.role} — exploring ${c.name}`;

    // Append to TSV
    const tsvLine = [
      TODAY, c.name, c.role, c.recruiter, c.email,
      'coldemail', 'draft', emailBody.replace(/\n/g, '\\n'), subject, shortPdf,
    ];
    appendFileSync(TSV, '\n' + tsvLine.map(escapeTsv).join('\t'), 'utf-8');
    console.log(`  ✓ TSV entry added`);
    console.log('');
  }

  console.log(`\n✅ All 10 entries generated. TSV updated at ${TSV}`);
  console.log(`   Next: node send-outreach.mjs to dispatch emails`);
}

main();
