"use client";

import { useState } from "react";
import {
  RefreshCw,
  Trash2,
  FileText,
  Key,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { ChangePasswordModal } from "./ChangePasswordModal";

interface QuickActionsProps {
  onActionComplete?: () => void;
}

interface ActionButton {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "emerald" | "blue" | "yellow" | "red";
  action: () => Promise<void> | void;
}

export function QuickActions({ onActionComplete }: QuickActionsProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logsContent, setLogsContent] = useState("");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRestartGateway = async () => {
    setLoadingAction("restart");
    try {
      const res = await fetch("/api/system/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "openclaw-gateway",
          backend: "systemd",
          action: "restart",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to restart gateway");
      }

      showNotification("success", "Gateway restarted successfully");
      onActionComplete?.();
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Failed to restart gateway");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleClearActivityLog = async () => {
    setLoadingAction("clear_log");
    try {
      const res = await fetch("/api/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_activity_log" }),
      });

      if (!res.ok) throw new Error("Failed to clear log");

      showNotification("success", "Activity log cleared successfully");
      onActionComplete?.();
    } catch {
      showNotification("error", "Failed to clear activity log");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleViewLogs = async () => {
    setLoadingAction("view_logs");
    try {
      const res = await fetch("/api/system/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "openclaw-gateway",
          backend: "systemd",
          action: "logs",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to fetch gateway logs");
      }

      setLogsContent(data.output || "No logs available");
      setShowLogsModal(true);
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      setLoadingAction(null);
    }
  };

  const actions: ActionButton[] = [
    {
      id: "restart",
      label: "Restart Gateway",
      icon: RefreshCw,
      color: "blue",
      action: handleRestartGateway,
    },
    {
      id: "clear_log",
      label: "Clear Activity Log",
      icon: Trash2,
      color: "yellow",
      action: handleClearActivityLog,
    },
    {
      id: "view_logs",
      label: "View Gateway Logs",
      icon: FileText,
      color: "emerald",
      action: handleViewLogs,
    },
    {
      id: "change_password",
      label: "Change Password",
      icon: Key,
      color: "red",
      action: () => setShowPasswordModal(true),
    },
  ];

  const colorStyles = {
    emerald: {
      color: "var(--positive)",
      backgroundColor: "color-mix(in srgb, var(--positive) 10%, var(--surface))",
      borderColor: "color-mix(in srgb, var(--positive) 35%, var(--border))",
    },
    blue: {
      color: "var(--info)",
      backgroundColor: "color-mix(in srgb, var(--info) 10%, var(--surface))",
      borderColor: "color-mix(in srgb, var(--info) 35%, var(--border))",
    },
    yellow: {
      color: "var(--warning)",
      backgroundColor: "color-mix(in srgb, var(--warning) 10%, var(--surface))",
      borderColor: "color-mix(in srgb, var(--warning) 35%, var(--border))",
    },
    red: {
      color: "var(--negative)",
      backgroundColor: "color-mix(in srgb, var(--negative) 10%, var(--surface))",
      borderColor: "color-mix(in srgb, var(--negative) 35%, var(--border))",
    },
  };

  return (
    <>
      <div className="rounded-xl p-6" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <RefreshCw className="w-5 h-5" style={{ color: "var(--info)" }} />
          Quick Actions
        </h2>

        {notification && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
              notification.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "bg-red-500/10 text-red-400 border border-red-500/30"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="text-sm">{notification.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            const isLoading = loadingAction === action.id;

            return (
              <button
                key={action.id}
                onClick={() => action.action()}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={colorStyles[action.color]}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span className="font-medium">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          showNotification("success", "Password changed successfully");
          setShowPasswordModal(false);
        }}
      />

      {showLogsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={() => setShowLogsModal(false)}
        >
          <div
            className="w-full max-w-4xl rounded-xl border"
            style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Gateway Logs</h3>
              <button onClick={() => setShowLogsModal(false)} className="p-1 rounded" style={{ color: "var(--text-secondary)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre
              className="p-4 text-xs overflow-auto"
              style={{ maxHeight: "60vh", color: "var(--text-secondary)", backgroundColor: "var(--background)" }}
            >
              {logsContent}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}
