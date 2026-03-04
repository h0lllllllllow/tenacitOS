"use client";

import { BRANDING } from "@/config/branding";

interface Workflow {
  id: string;
  emoji: string;
  name: string;
  description: string;
  schedule: string;
  steps: string[];
  status: "active" | "inactive";
  trigger: "cron" | "demand";
}

const WORKFLOWS: Workflow[] = [
  {
    id: "social-radar",
    emoji: "🔭",
    name: "Social Radar",
    description: "Monitors mentions, collaboration opportunities, and relevant conversations across social platforms and forums.",
    schedule: "9:30 and 17:30 (daily)",
    trigger: "cron",
    status: "active",
    steps: [
      `Find mentions of ${BRANDING.twitterHandle} on Twitter/X, LinkedIn, and Instagram`,
      "Review Reddit threads in r/webdev, r/javascript, r/learnprogramming",
      `Detect incoming collaboration opportunities and partnership requests (${BRANDING.ownerCollabEmail})`,
      "Track aprendiendo.dev in conversations and mentions",
      "Send a Telegram summary when something relevant appears",
    ],
  },
  {
    id: "ai-web-news",
    emoji: "📰",
    name: "AI & Web News",
    description: "Summarizes top AI and web development news from Twitter timeline to start the day informed.",
    schedule: "7:45 (daily)",
    trigger: "cron",
    status: "active",
    steps: [
      "Read the Twitter/X timeline via bird CLI",
      "Filter AI, web dev, architecture, and dev-tools news",
      "Select 5-7 most relevant stories for your niche",
      "Generate a structured summary with links and context",
      "Send digest via Telegram",
    ],
  },
  {
    id: "trend-monitor",
    emoji: "🔥",
    name: "Trend Monitor",
    description: "Urgent trend radar for the tech niche. Detects rising topics before they peak.",
    schedule: "7:00, 10:00, 15:00, and 20:00 (daily)",
    trigger: "cron",
    status: "active",
    steps: [
      "Monitor Twitter/X trending topics related to tech and programming",
      "Check Hacker News, dev.to, and GitHub Trending",
      "Evaluate whether the trend is relevant to your channel",
      "If an urgent trend is detected, notify immediately with context",
      "Suggest a content angle when the trend has potential",
    ],
  },
  {
    id: "daily-linkedin",
    emoji: "📊",
    name: "Daily LinkedIn Brief",
    description: "Generates the daily LinkedIn post from top Hacker News, dev.to, and tech web stories.",
    schedule: "9:00 (daily)",
    trigger: "cron",
    status: "active",
    steps: [
      "Collect top Hacker News posts (tech/dev front page)",
      "Review trending dev.to and featured articles",
      "Select the topic with strongest engagement potential",
      "Draft LinkedIn post in your voice (professional, clear, no emojis/hashtags)",
      "Send draft to Telegram for review and publishing",
    ],
  },
  {
    id: "newsletter-digest",
    emoji: "📬",
    name: "Newsletter Digest",
    description: "Curated digest of daily newsletters with actionable highlights.",
    schedule: "20:00 (daily)",
    trigger: "cron",
    status: "active",
    steps: [
      "Access Gmail and find newsletters received today",
      "Filter by relevant senders (tech, AI, productivity, investing)",
      "Extract key points from each newsletter",
      "Generate a category-based digest",
      "Send summary via Telegram",
    ],
  },
  {
    id: "email-categorization",
    emoji: "📧",
    name: "Email Categorization",
    description: "Categorize and summarize daily emails for a low-stress inbox start.",
    schedule: "7:45 (daily)",
    trigger: "cron",
    status: "active",
    steps: [
      "Access Gmail and read today's unread emails",
      "Categorize: urgent / collabs / invoices / university / newsletters / other",
      "Provide summary per category with recommended action",
      "Detect client emails with overdue invoices (>90 days)",
      "Send structured summary via Telegram",
    ],
  },
  {
    id: "weekly-newsletter",
    emoji: "📅",
    name: "Weekly Newsletter",
    description: "Automatic weekly recap of tweets and LinkedIn posts as newsletter input.",
    schedule: "Sundays 18:00",
    trigger: "cron",
    status: "active",
    steps: [
      `Collect tweets from the week (${BRANDING.twitterHandle} via bird CLI)`,
      "Collect published LinkedIn posts",
      "Organize by topic and relevance",
      "Generate weekly recap draft in newsletter tone",
      "Send via Telegram for review before publishing",
    ],
  },
  {
    id: "advisory-board",
    emoji: "🏛️",
    name: "Advisory Board",
    description: "7 AI advisors with distinct personalities and memories. Query one advisor or summon the full board.",
    schedule: "On-demand",
    trigger: "demand",
    status: "active",
    steps: [
      "User sends /cfo, /cmo, /cto, /legal, /growth, /coach, or /product",
      "NightshiftOS loads advisory-board/SKILL.md",
      "Read the corresponding advisor memory file (memory/advisors/)",
      "Reply in that advisor's voice/personality with user context",
      "Update advisor memory with what was learned",
      "/board summons all 7 advisors and compiles a full board meeting",
    ],
  },
  {
    id: "git-backup",
    emoji: "🔄",
    name: "Git Backup",
    description: "Auto-commit and push workspace changes every 4 hours to prevent loss.",
    schedule: "Every 4h",
    trigger: "cron",
    status: "active",
    steps: [
      "Check if there are changes in the NightshiftOS workspace",
      "If changed: git add -A",
      "Generate automatic commit message with timestamp and summary",
      "git push to remote repository",
      "Silent when no changes — notify only on errors",
    ],
  },
  {
    id: "nightly-evolution",
    emoji: "🌙",
    name: "Nightly Evolution",
    description: "Nightly autonomous session that ships roadmap improvements or useful new features.",
    schedule: "03:00 (nightly)",
    trigger: "cron",
    status: "active",
    steps: [
      "Read ROADMAP.md to select next feature",
      "If roadmap is unclear, analyze current state and propose something useful",
      "Implement full feature (code, tests when applicable, UI)",
      "Verify Next.js build passes",
      "Notify via Telegram with implementation summary",
    ],
  },
];

function StatusBadge({ status }: { status: "active" | "inactive" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <div style={{
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        backgroundColor: status === "active" ? "var(--positive)" : "var(--text-muted)",
      }} />
      <span style={{
        fontFamily: "var(--font-body)",
        fontSize: "10px",
        fontWeight: 600,
        color: status === "active" ? "var(--positive)" : "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}>
        {status === "active" ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

function TriggerBadge({ trigger }: { trigger: "cron" | "demand" }) {
  return (
    <div style={{
      padding: "2px 7px",
      backgroundColor: trigger === "cron"
        ? "rgba(59, 130, 246, 0.12)"
        : "rgba(168, 85, 247, 0.12)",
      border: `1px solid ${trigger === "cron" ? "rgba(59, 130, 246, 0.25)" : "rgba(168, 85, 247, 0.25)"}`,
      borderRadius: "5px",
      fontFamily: "var(--font-body)",
      fontSize: "10px",
      fontWeight: 600,
      color: trigger === "cron" ? "#60a5fa" : "var(--accent)",
      letterSpacing: "0.4px",
      textTransform: "uppercase" as const,
    }}>
      {trigger === "cron" ? "⏱ Cron" : "⚡ On-demand"}
    </div>
  );
}

export default function WorkflowsPage() {
  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "24px",
          fontWeight: 700,
          letterSpacing: "-1px",
          color: "var(--text-primary)",
          marginBottom: "4px",
        }}>
          Workflows
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)" }}>
          {WORKFLOWS.filter(w => w.status === "active").length} active workflows · {WORKFLOWS.filter(w => w.trigger === "cron").length} automatic crons · {WORKFLOWS.filter(w => w.trigger === "demand").length} on-demand
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" }}>
        {[
          { label: "Total workflows", value: WORKFLOWS.length, color: "var(--text-primary)" },
          { label: "Active crons", value: WORKFLOWS.filter(w => w.trigger === "cron" && w.status === "active").length, color: "#60a5fa" },
          { label: "On-demand", value: WORKFLOWS.filter(w => w.trigger === "demand").length, color: "var(--accent)" },
        ].map((stat) => (
          <div key={stat.label} style={{
            padding: "16px 20px",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            minWidth: "140px",
          }}>
            <div style={{
              fontFamily: "var(--font-heading)",
              fontSize: "28px",
              fontWeight: 700,
              color: stat.color,
              letterSpacing: "-1px",
            }}>
              {stat.value}
            </div>
            <div style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "var(--text-muted)",
              marginTop: "2px",
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Workflow cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {WORKFLOWS.map((workflow) => (
          <div key={workflow.id} style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "20px 24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          }}>
            {/* Card header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "var(--surface-elevated)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  border: "1px solid var(--border-strong)",
                  flexShrink: 0,
                }}>
                  {workflow.emoji}
                </div>
                <div>
                  <h3 style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.3px",
                    marginBottom: "2px",
                  }}>
                    {workflow.name}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <TriggerBadge trigger={workflow.trigger} />
                    <StatusBadge status={workflow.status} />
                  </div>
                </div>
              </div>
              {/* Schedule */}
              <div style={{
                padding: "6px 12px",
                backgroundColor: "var(--surface-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                color: "var(--text-secondary)",
                whiteSpace: "nowrap" as const,
                flexShrink: 0,
              }}>
                🕐 {workflow.schedule}
              </div>
            </div>

            {/* Description */}
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "var(--text-secondary)",
              lineHeight: "1.6",
              marginBottom: "16px",
            }}>
              {workflow.description}
            </p>

            {/* Steps */}
            <div style={{
              backgroundColor: "var(--surface-elevated)",
              borderRadius: "10px",
              padding: "12px 16px",
              border: "1px solid var(--border)",
            }}>
              <div style={{
                fontFamily: "var(--font-body)",
                fontSize: "10px",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.7px",
                marginBottom: "8px",
              }}>
                Steps
              </div>
              <ol style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {workflow.steps.map((step, i) => (
                  <li key={i} style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    lineHeight: "1.5",
                  }}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
