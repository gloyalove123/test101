export type AnalyticsEventName =
  | 'landing_view'
  | 'practice_mode_selected'
  | 'practice_started'
  | 'question_answered'
  | 'question_timeout'
  | 'practice_completed'
  | 'result_viewed'
  | 'reward_received'
  | 'weak_topic_clicked'
  | 'next_practice_clicked';

export interface AnalyticsEventRecord {
  id: string;
  event: AnalyticsEventName;
  timestamp: string;
  payload: Record<string, unknown>;
}

const ANALYTICS_STORAGE_KEY = 'doe_tgat2_analytics_events_v1';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Central Analytics Tracker (Section 20)
 * Persists locally and automatically forwards to Supabase REST endpoint if env vars are set.
 */
export function trackEvent(
  event: AnalyticsEventName,
  payload: Record<string, unknown> = {}
): void {
  const record: AnalyticsEventRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    event,
    timestamp: new Date().toISOString(),
    payload,
  };

  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    const existing: AnalyticsEventRecord[] = raw ? JSON.parse(raw) : [];
    const updated = [record, ...existing].slice(0, 200);
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }

  // Optional non-blocking Supabase sync when environment variables are configured
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    fetch(`${SUPABASE_URL}/rest/v1/analytics_events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(record),
    }).catch(() => {
      // Fallback silently to local mode
    });
  }
}

export function getAnalyticsHistory(): AnalyticsEventRecord[] {
  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
