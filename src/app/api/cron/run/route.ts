import { NextRequest, NextResponse } from "next/server";
import { execFileSync } from "child_process";

async function createNotification(title: string, message: string, type: "info" | "success" | "warning" | "error" = "info") {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message, type }),
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

// POST: Trigger a cron job immediately
export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = typeof body?.id === "string" ? body.id : "";

  if (!id) {
    return NextResponse.json({ error: "Job ID required" }, { status: 400 });
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
  }

  try {
    const output = execFileSync("openclaw", ["cron", "run", id, "--force"], {
      timeout: 15000,
      encoding: "utf-8",
    });

    await createNotification(
      "Cron Job Triggered",
      `Job "${id}" has been manually executed.`,
      "success"
    );

    return NextResponse.json({
      success: true,
      jobId: id,
      message: output.trim() || "Job triggered successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to trigger job";
    console.error("Error triggering cron job:", error);

    await createNotification(
      "Cron Job Failed",
      `Failed to execute job "${id}": ${message}`,
      "error"
    );

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
