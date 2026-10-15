// src/services/afroSmsService.ts
import Afromessage from 'afromessage';

const smsApi = Afromessage.getInstance({
  apiKey: process.env.AFROMESSAGE_TOKEN || '',
  senderName: process.env.AFROMESSAGE_SENDER_NAMES || '',
  identifierId: process.env.AFROMESSAGE_IDENTIFIER_ID || '',
});

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  raw?: any;
}

export async function sendSingleSms(phone: string, message: string): Promise<SendResult> {
  if (!phone) {
    return { success: false, error: 'Missing phone number' };
  }

  if (!process.env.AFROMESSAGE_TOKEN) {
    return { success: false, error: 'AFROMESSAGE_TOKEN not configured' };
  }

  const to = phone.trim();

  try {
    const response: any = await smsApi.sendSms({ to, message });
    console.log('📱 Afro response:', JSON.stringify(response));

    const acknowledged =
      response?.acknowledge === 'success' ||
      response?.status === 'success' ||
      response?.response?.message_id ||
      response?.message_id;

    if (acknowledged) {
      return {
        success: true,
        messageId:
          response?.response?.message_id ||
          response?.message_id ||
          undefined,
        raw: response,
      };
    }

    return { success: false, error: JSON.stringify(response), raw: response };
  } catch (error: any) {
    const errMsg =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Unknown SMS provider error';
    console.error('📱 Afro send failed:', errMsg, error?.response?.data);
    return { success: false, error: errMsg, raw: error?.response?.data };
  }
}