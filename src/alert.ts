import type { AlertConfig } from './types.js';

export interface AlertPayload {
  title: string;
  message: string;
  url: string;
  urlTitle: string;
  emergency: boolean;
}

export async function sendAlert(config: AlertConfig, payload: AlertPayload): Promise<void> {
  const emergency = config.priority === 'emergency' && payload.emergency;
  if (config.provider === 'pushover') {
    await sendPushover({ ...payload, emergency });
  } else {
    await sendNtfy({ ...payload, emergency });
  }
}

async function sendPushover(payload: AlertPayload): Promise<void> {
  const token = process.env.PUSHOVER_TOKEN;
  const user = process.env.PUSHOVER_USER;
  if (!token || !user) throw new Error('PUSHOVER_TOKEN / PUSHOVER_USER not set');

  const body = new URLSearchParams({
    token,
    user,
    title: payload.title,
    message: payload.message,
    url: payload.url,
    url_title: payload.urlTitle,
    priority: payload.emergency ? '2' : '0',
    sound: 'persistent',
  });
  // Emergency priority requires retry/expire: Pushover repeats the
  // notification every `retry` seconds until acknowledged or `expire` runs out.
  if (payload.emergency) {
    body.set('retry', '60');
    body.set('expire', '3600');
  }

  const res = await fetch('https://api.pushover.net/1/messages.json', { method: 'POST', body });
  if (!res.ok) throw new Error(`Pushover ${res.status}: ${await res.text().catch(() => '')}`);
}

// HTTP header values reject control characters/newlines — strip them so a
// showtime label with odd punctuation can't crash the fetch call outright.
function headerSafe(s: string): string {
  return s.replace(/[\r\n\x00-\x08\x0b\x0c\x0e-\x1f]/g, ' ').trim();
}

async function sendNtfy(payload: AlertPayload): Promise<void> {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) throw new Error('NTFY_TOPIC not set');
  const server = process.env.NTFY_SERVER ?? 'https://ntfy.sh';

  const res = await fetch(`${server}/${encodeURIComponent(topic)}`, {
    method: 'POST',
    headers: {
      Title: headerSafe(payload.title),
      Priority: payload.emergency ? 'urgent' : 'default',
      Click: headerSafe(payload.url),
      Tags: 'rotating_light',
    },
    body: payload.message,
  });
  if (!res.ok) throw new Error(`ntfy ${res.status}: ${await res.text().catch(() => '')}`);
}
