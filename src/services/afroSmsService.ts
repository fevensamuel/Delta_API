// src/services/afroSmsService.ts
import * as AfromessageModule from 'afromessage';

// ✅ Handle both CommonJS and ES Module interop
// This prevents the "getInstance is not a function" error
const Afromessage = (AfromessageModule as any).default || AfromessageModule;

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
  // AfroMessage expects local Ethiopian format (09XXXXXXXX)
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
  
  // Log the attempt so we can verify the env vars are loaded
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
    
    // ✅ Log the raw response with indentation so we can see exactly what Afro returns
    console.log('📱 Afro raw response:', JSON.stringify(response, null, 2));

    const providerResponse = response.response || {};
    const messageId = providerResponse?.message_id?.trim();
    const providerStatus = providerResponse?.status?.trim().toLowerCase();
    
    // Reject explicit error states from the provider
    const rejectedStatuses = new Set(['failure', 'failed', 'error', 'rejected', 'denied', 'invalid']);

    console.warn(
      '[SMS] AfroMessage response parsed',
      JSON.stringify({
        acknowledge: response.acknowledge,
        providerStatus: providerStatus || null,
        hasMessageId: Boolean(messageId),
      })
    );

    // ✅ Strict success check: must have acknowledge: success AND a message ID AND not be rejected
    if (
      response.acknowledge === 'success' &&
      messageId &&
      !rejectedStatuses.has(providerStatus || '')
    ) {
      return { success: true, messageId };
    }

    // Extract the best possible error message
    const error =
      response.error ||
      response.message ||
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