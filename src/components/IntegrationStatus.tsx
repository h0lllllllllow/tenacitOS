"use client";

import { MessageCircle, MessageSquare, Twitter, Mail, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Integration {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "configured" | "not_configured";
  icon: string;
  lastActivity: string | null;
}

interface IntegrationStatusProps {
  integrations: Integration[] | null;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageCircle,
  MessageSquare,
  Twitter,
  Mail,
};

const statusConfig = {
  connected: {
    icon: CheckCircle,
    color: "var(--positive)",
    label: "Connected",
  },
  disconnected: {
    icon: XCircle,
    color: "var(--negative)",
    label: "Disconnected",
  },
  configured: {
    icon: CheckCircle,
    color: "var(--info)",
    label: "Configured",
  },
  not_configured: {
    icon: AlertCircle,
    color: "var(--warning)",
    label: "Not Configured",
  },
};

export function IntegrationStatus({ integrations }: IntegrationStatusProps) {
  if (!integrations) {
    return (
      <div className="rounded-xl p-6 animate-pulse" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="h-6 rounded w-1/3 mb-4" style={{ backgroundColor: "var(--surface-elevated)" }}></div>
        <div className="space-y-3">
          <div className="h-16 rounded" style={{ backgroundColor: "var(--surface-elevated)" }}></div>
          <div className="h-16 rounded" style={{ backgroundColor: "var(--surface-elevated)" }}></div>
          <div className="h-16 rounded" style={{ backgroundColor: "var(--surface-elevated)" }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-6" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
        <MessageCircle className="w-5 h-5" style={{ color: "var(--info)" }} />
        Integrations
      </h2>

      <div className="space-y-3">
        {integrations.map((integration) => {
          const Icon = iconMap[integration.icon] || MessageCircle;
          const status = statusConfig[integration.status];
          const StatusIcon = status.icon;

          return (
            <div
              key={integration.id}
              className="flex items-center justify-between p-4 rounded-lg border"
              style={{
                backgroundColor: "color-mix(in srgb, var(--surface) 88%, var(--background))",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "var(--surface-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium" style={{ color: "var(--text-primary)" }}>{integration.name}</div>
                  {integration.lastActivity && (
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Last activity:{" "}
                      {formatDistanceToNow(new Date(integration.lastActivity), {
                        addSuffix: true,
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2" style={{ color: status.color }}>
                <StatusIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{status.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
