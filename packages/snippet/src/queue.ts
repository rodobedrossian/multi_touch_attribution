const QUEUE_KEY = '__attr_queue';
const MAX_QUEUE_SIZE = 50;
const MAX_ATTEMPTS = 3;

interface QueuedItem {
  url: string;
  body: string;
  attempt: number;
  ts: number;
}

function readQueue(): QueuedItem[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
}

function writeQueue(q: QueuedItem[]): void {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch {}
}

export function enqueue(url: string, body: string): void {
  const q = readQueue();
  if (q.length >= MAX_QUEUE_SIZE) q.shift();
  q.push({ url, body, attempt: 0, ts: Date.now() });
  writeQueue(q);
}

export function flushQueue(send: (url: string, body: string) => Promise<void>): void {
  const q = readQueue();
  if (q.length === 0) return;

  const remaining: QueuedItem[] = [];
  writeQueue([]); // optimistically clear

  for (const item of q) {
    send(item.url, item.body).catch(() => {
      if (item.attempt < MAX_ATTEMPTS) {
        remaining.push({ ...item, attempt: item.attempt + 1 });
      }
    });
  }

  if (remaining.length > 0) {
    const current = readQueue();
    writeQueue([...remaining, ...current].slice(0, MAX_QUEUE_SIZE));
  }
}
