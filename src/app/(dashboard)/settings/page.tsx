"use client";

import { useCallback, useEffect, useState } from "react";
import { Settings, RefreshCw } from "lucide-react";
import { SystemInfo } from "@/components/SystemInfo";
import { IntegrationStatus } from "@/components/IntegrationStatus";
import { QuickActions } from "@/components/QuickActions";
import { ThemeSelector } from "@/components/ThemeSelector";
import { DemoActivityToggle } from "@/components/DemoActivityToggle";

interface SystemData {
  agent: {
    name: string;
    creature: string;
    emoji: string;
  };
  system: {
    uptime: number;
    uptimeFormatted: string;
    nodeVersion: string;
    model: string;
    workspacePath: string;
    platform: string;
    hostname: string;
    memory: {
      total: number;
      free: number;
      used: number;
    };
  };
  integrations: Array<{
    id: string;
    name: string;
    status: "connected" | "disconnected" | "configured" | "not_configured";
    icon: string;
    lastActivity: string | null;
  }>;
  timestamp: string;
}

export default function SettingsPage() {
  const [systemData, setSystemData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchSystemData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      setLoadError(null);

      const res = await fetch(`/api/system?ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Request failed (${res.status})`);
      }

      const data = await res.json();
      if (!data?.agent || !data?.system || !Array.isArray(data?.integrations)) {
        throw new Error("Invalid system payload");
      }

      setSystemData(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to fetch system data:", error);
      setLoadError(error instanceof Error ? error.message : "Failed to load system data");
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(() => fetchSystemData(false), 30000);
    return () => clearInterval(interval);
  }, [fetchSystemData]);

  useEffect(() => {
    const es = new EventSource("/api/live/stream");
    es.onmessage = () => {
      fetchSystemData(false);
    };
    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [fetchSystemData]);

  const handleRefresh = () => {
    fetchSystemData(true);
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 
            className="text-2xl md:text-3xl font-bold mb-1 md:mb-2 flex items-center gap-2 md:gap-3"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
          >
            <Settings className="w-6 h-6 md:w-8 md:h-8" style={{ color: "var(--accent)" }} />
            Settings
          </h1>
          <p className="text-sm md:text-base" style={{ color: "var(--text-secondary)" }}>
            System status, integrations, and configuration
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 w-full sm:w-auto"
          style={{ 
            backgroundColor: "var(--card)", 
            color: "var(--text-secondary)",
            border: "1px solid var(--border)"
          }}
        >
          <RefreshCw className={`w-4 h-4 ${(loading || refreshing) ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Last Refresh Time / Errors */}
      {loadError ? (
        <div className="text-sm mb-6" style={{ color: "var(--negative)" }}>
          Failed to load system data. {loadError}
        </div>
      ) : lastRefresh ? (
        <div className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      ) : null}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* System Info - Full width on first row */}
        <div className="lg:col-span-2">
          <SystemInfo data={systemData} />
        </div>

        {/* Integration Status */}
        <div>
          <IntegrationStatus integrations={systemData?.integrations || null} />
        </div>

        {/* Quick Actions */}
        <div>
          <QuickActions onActionComplete={handleRefresh} />
        </div>

        {/* Theme Selector */}
        <div className="lg:col-span-2">
          <ThemeSelector />
        </div>

        {/* Demo Activity */}
        <div className="lg:col-span-2">
          <DemoActivityToggle />
        </div>
      </div>

      {/* Footer Info */}
      <div 
        className="mt-6 md:mt-8 p-3 md:p-4 rounded-xl"
        style={{ 
          backgroundColor: "rgba(26, 26, 26, 0.5)", 
          border: "1px solid var(--border)" 
        }}
      >
        <div className="flex items-center justify-between text-sm" style={{ color: "var(--text-muted)" }}>
          <span>NightshiftOS v1.0.0</span>
          <span>OpenClaw Agent Dashboard</span>
        </div>
      </div>
    </div>
  );
}
