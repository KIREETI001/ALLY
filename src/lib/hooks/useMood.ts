'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { MoodLog } from '@/lib/types';

export function useMood(userId: string | null) {
  const supabase = createClient();
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('recorded_at', sevenDaysAgo)
      .order('recorded_at', { ascending: false });
    setLogs((data as MoodLog[]) ?? []);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const todayMood: number | null = (() => {
    const today = new Date().toDateString();
    const todays = logs.find((l) => new Date(l.recorded_at).toDateString() === today);
    return todays?.mood ?? null;
  })();

  const log = useCallback(async (mood: 1 | 2 | 3 | 4 | 5, note?: string) => {
    if (!userId) return;
    await supabase.from('mood_logs').insert({ user_id: userId, mood, note: note ?? null });
    refresh();
  }, [supabase, userId, refresh]);

  return { logs, todayMood, loading, log, refresh };
}
