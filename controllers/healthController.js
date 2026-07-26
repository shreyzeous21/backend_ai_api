import os from "os";
import { ENV } from "../env.js";

let lastHealthHit = null;
let totalHits = 0;
const serverStartedAt = new Date();

function formatDateTime(date) {
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function formatUptime(seconds) {
  seconds = Math.floor(seconds);

  const days = Math.floor(seconds / 86400);
  seconds %= 86400;

  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;

  const minutes = Math.floor(seconds / 60);
  seconds %= 60;

  const parts = [];

  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(" ");
}

function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB", "TB"];

  let i = 0;
  let value = bytes;

  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }

  return `${value.toFixed(2)} ${units[i]}`;
}

export const healthController = (req, res) => {
  const start = process.hrtime.bigint();

  const previousHit = lastHealthHit;
  lastHealthHit = new Date();
  totalHits++;

  const memory = process.memoryUsage();

  const heapUsage = ((memory.heapUsed / memory.heapTotal) * 100).toFixed(2);

  const end = process.hrtime.bigint();

  const responseTime = (Number(end - start) / 1_000_000).toFixed(3);

  res.status(200).json({
    success: true,
    status: "healthy",

    service: {
      name: "Node AI Gateway",
      version: "1.0.0",
      environment: ENV.NODE_ENV,
    },

    server: {
      hostname: os.hostname(),
      platform: process.platform,
      architecture: process.arch,
      nodeVersion: process.version,
      processId: process.pid,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },

    health: {
      currentHit: formatDateTime(lastHealthHit),
      previousHit: previousHit ? formatDateTime(previousHit) : "Never",

      serverStartedAt: formatDateTime(serverStartedAt),

      uptime: formatUptime(process.uptime()),

      totalHealthChecks: totalHits,

      timestamp: lastHealthHit.toISOString(),

      responseTime: `${responseTime} ms`,
    },

    memory: {
      rss: formatBytes(memory.rss),
      heapTotal: formatBytes(memory.heapTotal),
      heapUsed: formatBytes(memory.heapUsed),
      heapUsage: `${heapUsage}%`,
      external: formatBytes(memory.external),
    },

    checks: {
      api: "OK",
      memory: "OK",
    },
  });
};
