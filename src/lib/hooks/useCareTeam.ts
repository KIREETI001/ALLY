'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CareTeamMember, CareTeamInvite } from '@/lib/types';

interface MemberWithProfile extends CareTeamMember {
  full_name: string | null;
  email: string | null;
}

export function useCareTeam(carePlanId: string | null) {
  const supabase = createClient();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [invites, setInvites] = useState<CareTeamInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!carePlanId) {
      setMembers([]);
      setInvites([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: rows } = await supabase
      .from('care_team')
      .select('*, profiles:user_id(full_name, email)')
      .eq('care_plan_id', carePlanId);

    setMembers(
      ((rows ?? []) as Array<CareTeamMember & { profiles: { full_name: string | null; email: string | null } | null }>).map(
        (r) => ({
          ...r,
          full_name: r.profiles?.full_name ?? null,
          email: r.profiles?.email ?? null,
        })
      )
    );

    const { data: invs } = await supabase
      .from('care_team_invites')
      .select('*')
      .eq('care_plan_id', carePlanId)
      .is('accepted_at', null)
      .order('created_at', { ascending: false });
    setInvites((invs as CareTeamInvite[]) ?? []);

    setLoading(false);
  }, [supabase, carePlanId]);

  useEffect(() => { refresh(); }, [refresh]);

  const invite = useCallback(async (email: string, role: 'primary' | 'secondary' | 'fdw' | 'observer') => {
    if (!carePlanId) return { error: 'No active care plan' };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not signed in' };
    const { error } = await supabase.from('care_team_invites').insert({
      care_plan_id: carePlanId,
      email: email.trim().toLowerCase(),
      role,
      invited_by: user.id,
    });
    if (error) return { error: error.message };
    refresh();
    return {};
  }, [supabase, carePlanId, refresh]);

  return { members, invites, loading, invite, refresh };
}
