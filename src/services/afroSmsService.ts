// src/services/afroSmsService.ts
import Afromessage from 'afromessage';

let smsApi: ReturnType<typeof Afromessage.getInstance> | undefined;

const getSmsApi = () => {
  if (!smsApi) {
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
    const response = await getSmsApi().sendSms({ to, message });
    const providerResponse = response.response;
    const messageId = providerResponse?.message_id?.trim();
    const providerStatus = providerResponse?.status?.trim().toLowerCase();
    const rejectedStatuses = new Set(['failure', 'failed', 'error', 'rejected', 'denied']);

    console.warn(
      '[SMS] AfroMessage response',
      JSON.stringify({
        acknowledge: response.acknowledge,
        providerStatus: providerStatus || null,
        hasMessageId: Boolean(messageId),
      })
    );

    if (
      response.acknowledge === 'success' &&
      messageId &&
      !rejectedStatuses.has(providerStatus || '')
    ) {
      return { success: true, messageId };
    }

    const error =
      response.error ||
      (rejectedStatuses.has(providerStatus || '')
        ? `AfroMessage rejected the SMS with status "${providerStatus}"`
        : 'AfroMessage returned no message ID; send was not confirmed');
    console.error('[SMS] AfroMessage did not accept the SMS:', error);
    return { success: false, error };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[SMS] AfroMessage request failed:', message);
    return { success: false, error: message || 'Unknown SMS provider error' };
  }
}