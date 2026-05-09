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
  useEffect(() => {
    if (!carePlanId) return;
    const ch = supabase
      .channel(`tasks-${carePlanId}`)
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
  }, [supabase, tasks]);

  const insertMany = useCallback(async (rows: Omit<Task, 'id' | 'created_at'>[]) => {
    if (rows.length === 0) return;
    await supabase.from('tasks').insert(rows);
    refresh();
  }, [supabase, refresh]);

  return { tasks, loading, toggleDone, refresh, insertMany };
}
