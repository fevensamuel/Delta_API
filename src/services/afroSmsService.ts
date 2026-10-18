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
    const response: any = await getSmsApi().sendSms({ to, message });

    // Raw provider reply (contains no secrets) so we can see exactly what AfroMessage says.
    console.warn('[SMS] AfroMessage raw response', JSON.stringify(response));

    const providerResponse = response?.response;
    const messageId =
      typeof providerResponse?.message_id === 'string' ? providerResponse.message_id.trim() : '';
    const providerStatus =
      typeof providerResponse?.status === 'string'
        ? providerResponse.status.trim().toLowerCase()
        : '';
    const rejectedStatuses = new Set(['failure', 'failed', 'error', 'rejected', 'denied']);

    console.warn(
      '[SMS] AfroMessage response parsed',
      JSON.stringify({
        acknowledge: response?.acknowledge,
        providerStatus: providerStatus || null,
        hasMessageId: Boolean(messageId),
      })
    );

    if (
      response?.acknowledge === 'success' &&
      messageId &&
      !rejectedStatuses.has(providerStatus)
    ) {
      return { success: true, messageId };
    }

    const error =
      response?.error ||
      (rejectedStatuses.has(providerStatus)
        ? `AfroMessage rejected the SMS with status "${providerStatus}"`
        : `AfroMessage did not confirm the send: ${JSON.stringify(response)}`);
    console.error('[SMS] AfroMessage did not accept the SMS:', error);
    return { success: false, error };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[SMS] AfroMessage request failed:', message);
    return { success: false, error: message || 'Unknown SMS provider error' };
  }
}
