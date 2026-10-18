// src/services/afroSmsService.ts
import * as AfromessageModule from 'afromessage';

const resolveAfromessage = (): any => {
  let candidate: any = AfromessageModule;
  for (let i = 0; i < 4; i++) {
    if (candidate && typeof candidate.getInstance === 'function') return candidate;
    candidate = candidate?.default;
  }
  throw new Error('afromessage SDK export not found (getInstance missing)');
};

let smsApi: any;

const getSmsApi = () => {
  if (!smsApi) {
    const Afromessage = resolveAfromessage();
    smsApi = Afromessage.getInstance({
      apiKey: process.env.AFROMESSAGE_TOKEN || '',
      senderName: process.env.AFROMESSAGE_SENDER_NAMES || '',
      identifierId: process.env.AFROMESSAGE_IDENTIFIER_ID || '',
    });
  }
  return smsApi;
};

const normalizePhone = (phone: string) => {
  const normalized = phone.trim().replace(/[\s()-]/g, '');
  if (/^\+2519\d{8}$/.test(normalized)) return `0${normalized.slice(4)}`;
  if (/^2519\d{8}$/.test(normalized)) return `0${normalized.slice(3)}`;
  return normalized;
};

// The SDK wraps the API's own reply, so the real payload is nested:
//   { acknowledge, response: { acknowledge, response: { status, message_id, to, ... } } }
// Walk down the `.response` chain and collect what we need from any level.
const readProviderReply = (reply: any) => {
  let messageId = '';
  let status = '';
  let failureError = '';
  let current: any = reply;

  for (let depth = 0; depth < 5 && current && typeof current === 'object'; depth++) {
    if (!messageId && typeof current.message_id === 'string') {
      messageId = current.message_id.trim();
    }
    if (!status && typeof current.status === 'string') {
      status = current.status.trim().toLowerCase();
    }
    if (current.acknowledge === 'failure' && !failureError) {
      failureError =
        (typeof current.error === 'string' && current.error) ||
        (typeof current.message === 'string' && current.message) ||
        'AfroMessage reported failure';
    }
    current = current.response;
  }

  return { messageId, status, failureError };
};

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendSingleSms(phone: string, message: string): Promise<SendResult> {
  if (!phone) {
    return { success: false, error: 'Missing phone number' };
  }

  const apiKey = process.env.AFROMESSAGE_TOKEN;
  const to = normalizePhone(phone);
  console.warn(
    '[SMS] AfroMessage send attempt',
    JSON.stringify({
      apiKeyConfigured: Boolean(apiKey),
      senderConfigured: Boolean(process.env.AFROMESSAGE_SENDER_NAMES),
      identifierConfigured: Boolean(process.env.AFROMESSAGE_IDENTIFIER_ID),
      phoneFormat: to.startsWith('09') ? 'ethiopian-local' : 'other',
    })
  );

  if (!apiKey) {
    console.error('[SMS] AfroMessage send skipped: AFROMESSAGE_TOKEN is not configured');
    return { success: false, error: 'AFROMESSAGE_TOKEN not configured' };
  }

  try {
    const reply: any = await getSmsApi().sendSms({ to, message });

    // Raw provider reply (contains no secrets) so we can see exactly what AfroMessage says.
    console.warn('[SMS] AfroMessage raw response', JSON.stringify(reply));

    const { messageId, status, failureError } = readProviderReply(reply);
    const rejectedStatuses = new Set(['failure', 'failed', 'error', 'rejected', 'denied']);

    console.warn(
      '[SMS] AfroMessage response parsed',
      JSON.stringify({
        acknowledge: reply?.acknowledge,
        providerStatus: status || null,
        hasMessageId: Boolean(messageId),
      })
    );

    // Accepted = AfroMessage gave us a message ID and nothing in the reply says failure.
    // Status text such as "Send is in progress..." is a normal accepted state.
    if (messageId && !failureError && !rejectedStatuses.has(status)) {
      return { success: true, messageId };
    }

    const error =
      failureError ||
      (rejectedStatuses.has(status)
        ? `AfroMessage rejected the SMS with status "${status}"`
        : `AfroMessage did not confirm the send: ${JSON.stringify(reply)}`);
    console.error('[SMS] AfroMessage did not accept the SMS:', error);
    return { success: false, error };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[SMS] AfroMessage request failed:', message);
    return { success: false, error: message || 'Unknown SMS provider error' };
  }
}
