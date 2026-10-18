// src/services/smsCampaignService.ts

import crypto from 'crypto';
import { dbOperations as db, pool } from '../backend/database.js';
import { sendSingleSms } from './afroSmsService.js';

export interface CampaignParams {
  campaignName: string;
  message: string;
  recipientType: string; // 'subscribers' | 'persons'
  targetFilter: string;
  packageId?: string | null;
  manualNumbers?: string;
}

export interface Recipient {
  phone: string;
  name?: string;
}

export interface DispatchResult {
  total: number;
  sent: number;
  failed: number;
  sampleErrors: string[];
}

// ------------------------------------------------------------
// Table for scheduled campaigns (created on first use)
// ------------------------------------------------------------
let tableReady: Promise<void> | null = null;

export function ensureScheduleTable(): Promise<void> {
  if (!tableReady) {
    tableReady = pool
      .query(
        `
        CREATE TABLE IF NOT EXISTS sms_scheduled_campaigns (
          id TEXT PRIMARY KEY,
          campaign_name TEXT NOT NULL,
          message TEXT NOT NULL,
          recipient_type TEXT NOT NULL DEFAULT 'subscribers',
          target_filter TEXT NOT NULL DEFAULT 'Active Opt-in',
          package_id TEXT,
          manual_numbers TEXT,
          scheduled_for TIMESTAMPTZ NOT NULL,
          status TEXT NOT NULL DEFAULT 'Scheduled',
          estimated_recipients INTEGER DEFAULT 0,
          sent INTEGER,
          failed INTEGER,
          error TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          started_at TIMESTAMPTZ,
          finished_at TIMESTAMPTZ
        );
        CREATE INDEX IF NOT EXISTS idx_sms_scheduled_due
          ON sms_scheduled_campaigns (status, scheduled_for);
        `
      )
      .then(() => undefined)
      .catch((err) => {
        tableReady = null; // allow a retry on the next call
        throw err;
      });
  }
  return tableReady;
}

// ------------------------------------------------------------
// Recipient resolution (same rules the immediate send always used)
// ------------------------------------------------------------
export async function resolveRecipients(params: CampaignParams): Promise<Recipient[]> {
  const { recipientType, targetFilter, packageId, manualNumbers } = params;

  if (recipientType === 'persons') {
    const packages = await db.getAllPackages();
    const source = packageId ? packages.filter((p: any) => p.id === packageId) : packages;
    return source.flatMap((pkg: any) =>
      (pkg.persons || [])
        .filter((p: any) => p && p.phone)
        .map((p: any) => ({ phone: p.phone, name: p.name || '' }))
    );
  }

  const allSubs = await db.getAllSubscribers();

  if (packageId) {
    return allSubs.filter((s: any) => s.packageInterestId === packageId);
  }
  if (targetFilter === 'All Subscribers') {
    return allSubs;
  }
  if (targetFilter === 'Package-specific') {
    return allSubs.filter((s: any) => Boolean(s.packageInterestId));
  }
  if (targetFilter === 'Manual Numbers') {
    return String(manualNumbers || '')
      .split(/[\n,;]+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((phone) => ({ phone }));
  }
  // Default: Active Opt-in
  return allSubs.filter((s: any) => s.optInStatus === true);
}

// ------------------------------------------------------------
// Send to every recipient and log each result
// ------------------------------------------------------------
export async function dispatchCampaign(
  params: CampaignParams,
  recipients: Recipient[]
): Promise<DispatchResult> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    const result = await sendSingleSms(recipient.phone, params.message);
    const status = result.success ? 'Sent' : 'Failed';

    try {
      await db.createSmsLog({
        phone: recipient.phone,
        message: params.message,
        campaignName: params.campaignName,
        status,
        errorMessage: result.error || null,
      });
    } catch (logErr) {
      console.error('Failed to write sms_log:', logErr);
    }

    if (result.success) sent++;
    else {
      failed++;
      if (errors.length < 5 && result.error) errors.push(result.error);
    }

    // Rate limit — 100ms between sends
    await new Promise((r) => setTimeout(r, 100));
  }

  return { total: recipients.length, sent, failed, sampleErrors: errors };
}

// ------------------------------------------------------------
// Scheduling
// ------------------------------------------------------------
export async function scheduleCampaign(
  params: CampaignParams,
  scheduledFor: Date,
  estimatedRecipients: number
) {
  await ensureScheduleTable();
  const id = `sched_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const result = await pool.query(
    `INSERT INTO sms_scheduled_campaigns
       (id, campaign_name, message, recipient_type, target_filter, package_id,
        manual_numbers, scheduled_for, estimated_recipients)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      id,
      params.campaignName,
      params.message,
      params.recipientType,
      params.targetFilter,
      params.packageId || null,
      params.manualNumbers || null,
      scheduledFor.toISOString(),
      estimatedRecipients,
    ]
  );
  return result.rows[0];
}

export async function cancelScheduledCampaign(campaignName: string): Promise<number> {
  await ensureScheduleTable();
  const result = await pool.query(
    `UPDATE sms_scheduled_campaigns
        SET status = 'Cancelled', finished_at = NOW()
      WHERE campaign_name = $1 AND status = 'Scheduled'`,
    [campaignName]
  );
  return result.rowCount || 0;
}

let processing = false;

/**
 * Sends every scheduled campaign whose time has arrived.
 * Safe to call often and from several places (timer + cron endpoint):
 * each campaign is claimed atomically, so it can never be sent twice.
 */
export async function processDueCampaigns(): Promise<number> {
  if (processing) return 0;
  processing = true;
  let processed = 0;

  try {
    await ensureScheduleTable();

    // A campaign stuck in "Running" means the server stopped mid-send.
    // Mark it instead of re-sending, so nobody gets the same SMS twice.
    await pool.query(
      `UPDATE sms_scheduled_campaigns
          SET status = 'Error',
              error = 'Interrupted: server stopped during sending',
              finished_at = NOW()
        WHERE status = 'Running' AND started_at < NOW() - INTERVAL '2 hours'`
    );

    for (;;) {
      const claim = await pool.query(
        `UPDATE sms_scheduled_campaigns
            SET status = 'Running', started_at = NOW()
          WHERE id = (
            SELECT id FROM sms_scheduled_campaigns
             WHERE status = 'Scheduled' AND scheduled_for <= NOW()
             ORDER BY scheduled_for ASC
             LIMIT 1
             FOR UPDATE SKIP LOCKED
          )
          RETURNING *`
      );
      const row = claim.rows[0];
      if (!row) break;

      processed++;
      console.warn(`[SMS] Scheduled campaign starting: "${row.campaign_name}" (${row.id})`);

      try {
        const params: CampaignParams = {
          campaignName: row.campaign_name,
          message: row.message,
          recipientType: row.recipient_type,
          targetFilter: row.target_filter,
          packageId: row.package_id,
          manualNumbers: row.manual_numbers || '',
        };

        const recipients = await resolveRecipients(params);
        if (recipients.length === 0) {
          await pool.query(
            `UPDATE sms_scheduled_campaigns
                SET status = 'Error', error = 'No recipients matched at send time',
                    finished_at = NOW()
              WHERE id = $1`,
            [row.id]
          );
          continue;
        }

        const result = await dispatchCampaign(params, recipients);
        await pool.query(
          `UPDATE sms_scheduled_campaigns
              SET status = 'Done', sent = $2, failed = $3, finished_at = NOW()
            WHERE id = $1`,
          [row.id, result.sent, result.failed]
        );
        console.warn(
          `[SMS] Scheduled campaign finished: "${row.campaign_name}" sent=${result.sent} failed=${result.failed}`
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[SMS] Scheduled campaign "${row.campaign_name}" failed:`, message);
        await pool
          .query(
            `UPDATE sms_scheduled_campaigns
                SET status = 'Error', error = $2, finished_at = NOW()
              WHERE id = $1`,
            [row.id, message]
          )
          .catch(() => undefined);
      }
    }
  } finally {
    processing = false;
  }

  return processed;
}

let schedulerTimer: NodeJS.Timeout | null = null;

/** Checks for due campaigns every 30 seconds while the server process is alive. */
export function startSmsScheduler(): void {
  if (schedulerTimer) return;

  const tick = () => {
    processDueCampaigns().catch((err) =>
      console.error('[SMS] Scheduler error:', err instanceof Error ? err.message : err)
    );
  };

  schedulerTimer = setInterval(tick, 30_000);
  setTimeout(tick, 5_000); // also check shortly after startup
  console.log('⏰ SMS scheduler started (checks every 30s)');
}
