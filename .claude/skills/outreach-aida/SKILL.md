---
name: outreach-aida
description: Cold outreach email generation using the AIDA framework with recipient targeting, finding emails, and mandatory review before sending
---

# Cold Outreach — Skill

Use whenever generating cold outreach emails for `coldemail` mode, `yc-outreach`, or manual drafting.

## 1. Who to Target

| Company Size | Target Person |
|---|---|
| <30 people | CEO or CTO |
| Mid-size | Technical Recruiter (email them directly, not engineers) |
| 750+ employees | University Recruiter / Campus Recruiter (if student/new grad) |

Never email engineers directly — even if they respond positively, they rarely follow through on referrals.

## 2. How to Find Emails

- **Hunter.io** — lookup by domain
- **Guess by pattern**:
  - Small companies: `firstname@company.com`
  - Mid-size: `firstname.lastname@company.com` or `firstinitiallastname@company.com`
- **LinkedIn People Search** — filter by alumni from your university or past company

## 3. The AIDA Framework

| Step | Purpose | Implementation |
|------|---------|----------------|
| **Attention** | Subject + opening hook | Lead with top experience. Include recruiter name in subject. |
| **Interest** | 1-2 accomplishments with metrics | Cite specific results. Attach resume — don't paste it all. |
| **Desire** | Connect to their specific need | Why you for THIS role/company. Social proof (other offers/interviews). |
| **Action** | Single direct ask | Specific: "I'd like to start the interview process for X." Not vague. |

## 4. The 8 Tips

### Tip #1: Keep It Short
50-125 words. High signal-to-noise. No "I hope this finds you well." No fluff.

### Tip #2: Mention 1-2 Accomplishments
Cite metrics. Name-drop projects/users. Hyperlink to work. Attach resume — don't copy-paste it.

### Tip #3: Add Urgency
If you have other offers/interviews, mention them. Social proof works. But convey enthusiasm so you don't seem like they're a backup.

### Tip #4: Relate Personally
Search LinkedIn for mutual connections, alumni, shared interests. Reference them.

### Tip #5: Have a Specific Ask
- "I'd like to interview for Software Engineering Internship for Summer 2026."
- "How can I start the interview process for the Backend Engineer position?"
Not: "Would love to learn more."

### Tip #6: Strong Subject Line
Lead with top experience. Include recruiter name. Examples:
- `Former Google & Microsoft Intern Interested in FT @ X`
- `CMU Engineer Interested in Data Science @ Asana`
- `[RecruiterName] | IoT Hackathon Winner Interested In Nest Labs`

### Tip #7: Follow Up 3 Times
- Follow-up #1: 3-4 days later
- Follow-up #2: 4-5 days after that
- Follow-up #3: When you have an offer deadline or onsite coming up (adds urgency)

After 3-4 emails with no response, reach out to a different recruiter at the same company (multi-thread).

### Tip #8: Send at the Right Time
- Best days: Tuesday, Wednesday, Thursday
- Best times (recipient TZ): 11:00 AM or 2:00 PM
- Avoid: Mondays, Fridays, weekends, holidays, long weekends

## 5. Email Structure

```
Subject: [Lead with best credential] Interested in [Role] @ [Company]

Hi [Name],

[1-2 sentences — specific accomplishment or reason for reaching out]

[1 sentence — specific ask]

Best,
Rohan P H
```

Total body: 50-125 words. One paragraph or two short ones.

## 6. Examples

### Cloud/Backend Engineer (YC startup)
```
Subject: AWS serverless platform experience — Backend Engineer @ [Company]

Hi [Name],

I built a serverless platform on AWS at BT Group that cut cloud costs by 65% and cold-start latency by 60% across 45+ services. I also designed a centralized auth system handling JWT/OAuth2 for the entire platform.

I'd like to start the interview process for the Backend Engineer role.

Best,
Rohan P H
```

### Founding Engineer
```
Subject: [Company] founding engineer — shipped platform + auth at scale

Hi [Name],

I took end-to-end ownership at BT Group: migrated 17 apps to serverless, built auth for 45+ microservices, led an Angular SPA migration, cut costs by 65%. I ship across backend, frontend, and infrastructure.

For an early team building fast, I cover what would take three hires.

Best,
Rohan P H
```

### With Social Proof (has other interviews)
```
Subject: Serverless platform engineer — Backend @ [Company]

Hi [Name],

I built a serverless platform at BT Group handling 5,000+ RPM, cutting cold-start latency by 60% and cloud OpEx by 65%. I have an onsite with [WellKnownCompany] next month, but I'd rather join [Company] because [specific reason].

I'd like to start the interview process for the Backend Engineer role.

Best,
Rohan P H
```

## 7. Follow-Up Sequence

Send on a Tue/Wed/Thu at recipient's 11am or 2pm.

| # | Timing | Content |
|---|--------|---------|
| 1 | Initial | See examples above |
| 2 | +3 days | "Just wanted to follow up on my note about the Backend Engineer role." |
| 3 | +4 days | Brief, direct: "Still interested? I'd love to interview if there's mutual fit." |
| 4 | When you have leverage | "I'm in SF for onsites at [X] next week. Could we do a phone screen this week?" |

After 4 with no response, find another recruiter at the same company.

## 8. Mandatory Review Step

**Never send without review.** Workflow:

1. Generate drafts following the rules above
2. Show user: To, Subject, Body (full text)
3. Wait for explicit approval
4. Only then run `node send-outreach.mjs`

## When NOT to Use This

- Internal evaluation reports
- LinkedIn messages (adapt to shorter format)
- Follow-ups already in progress (just bump)
