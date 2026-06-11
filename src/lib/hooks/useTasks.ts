'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Task } from '@/lib/types';

export function useTasks(carePlanId: string | null) {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!carePlanId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('care_plan_id', carePlanId)
      .order('scheduled_time', { ascending: true });
    setTasks((data as Task[]) ?? []);
    setLoading(false);
  }, [supabase, carePlanId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Real-time subscription so care-team members see updates instantly.
  //
  // The channel name is unique per mount: supabase.channel(name) returns the
  // EXISTING channel object when the name is already taken, and React 18
  // StrictMode's mount→cleanup→mount cycle races the async removeChannel —
  // so the remount got back a channel that was already subscribed, and
  // calling .on() on it throws "cannot add postgres_changes callbacks
  // after subscribe()". A unique suffix gives every mount its own channel;
  // cleanup still removes it. The postgres_changes filter (not the channel
  // name) is what scopes the events, so the suffix changes nothing else.
  useEffect(() => {
    if (!carePlanId) return;
    const ch = supabase
      .channel(`tasks-${carePlanId}-${Math.random().toString(36).slice(2, 9)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `care_plan_id=eq.${carePlanId}` },
        () => { refresh(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [supabase, carePlanId, refresh]);

  const toggleDone = useCallback(async (id: string) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, done: !t.done, done_at: !t.done ? new Date().toISOString() : null } : t
      )
    );
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    await supabase
      .from('tasks')
      .update({ done: !target.done, done_at: !target.done ? new Date().toISOString() : null })
      .eq('id', id);

    // Proof-of-work care log (append-only). For the MDW this is protection:
    // a timestamped record of what she did and when (council verdict — her
    // engagement driver). Best-effort: never block care on logging.
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && carePlanId) {
        await supabase.from('care_log').insert({
          care_plan_id: carePlanId,
          task_id: id,
          actor_id: user.id,
          action: !target.done ? 'done' : 'undone',
          note: target.title,
        });
      }
    } catch { /* care_log may not exist pre-migration; logging is non-critical */ }
  }, [supabase, tasks, carePlanId]);

  const insertMany = useCallback(async (rows: Omit<Task, 'id' | 'created_at'>[]) => {
    if (rows.length === 0) return;
    await supabase.from('tasks').insert(rows);
    refresh();
  }, [supabase, refresh]);

  return { tasks, loading, toggleDone, refresh, insertMany };
}
