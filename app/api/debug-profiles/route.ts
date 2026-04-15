import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') ?? 'status';

  if (action === 'fix-lobby') {
    // Fix any matches stuck in lobby phase → transition to playing
    const { data: stuckMatches } = await supabase
      .from('matches')
      .select('id, trivia_state')
      .not('trivia_state', 'is', null);

    let fixed = 0;
    for (const m of stuckMatches ?? []) {
      const gs = m.trivia_state as { phase?: string; games?: Record<string, { status: string }> };
      if (gs?.phase === 'lobby') {
        const updated = {
          ...gs,
          phase: 'playing',
          games: { ...gs.games, '1': { ...(gs.games?.['1'] ?? {}), status: 'playing' } },
        };
        await supabase.from('matches').update({ trivia_state: updated }).eq('id', m.id);
        fixed++;
      }
    }
    return NextResponse.json({ message: `Fixed ${fixed} matches stuck in lobby`, total: stuckMatches?.length ?? 0 });
  }

  if (action === 'run-migration') {
    // Execute raw SQL via Supabase SQL API (requires service role key)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0];

    const sqlStatements = [
      // Add columns to profiles
      `ALTER TABLE public.profiles
        ADD COLUMN IF NOT EXISTS meet_cute_activity text DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS meet_cute_mindset text DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS meet_cute_availability_vibe text DEFAULT NULL;`,
      // Add columns to matches
      `ALTER TABLE public.matches
        ADD COLUMN IF NOT EXISTS game_completed boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS date_plan jsonb DEFAULT NULL;`,
    ];

    // Read the RPC functions migration
    const fs = await import('fs/promises');
    const path = await import('path');
    const rpcSql = await fs.readFile(
      path.join(process.cwd(), 'supabase/migrations/20260414000000_atomic_game_merge.sql'),
      'utf-8',
    );
    sqlStatements.push(rpcSql);

    const results: { sql: string; ok: boolean; error?: string }[] = [];

    for (const sql of sqlStatements) {
      const pgResp = await fetch(`https://${projectRef}.supabase.co/pg/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ query: sql }),
      });

      if (pgResp.ok) {
        results.push({ sql: sql.slice(0, 80) + '...', ok: true });
      } else {
        const errText = await pgResp.text();
        results.push({ sql: sql.slice(0, 80) + '...', ok: false, error: errText });
      }
    }

    // Verify RPC exists
    const testRpc = await supabase.rpc('merge_game_data', {
      p_match_id: '00000000-0000-0000-0000-000000000000',
      p_game_key: '1',
      p_partial: {},
      p_replace_player_data: false,
    });
    const rpcExists = testRpc.error?.message !== 'Could not find the function public.merge_game_data(p_game_key, p_match_id, p_partial, p_replace_player_data) in the schema cache';

    return NextResponse.json({ results, rpcExists, rpcTestError: testRpc.error?.message ?? null });
  }

  if (action === 'check-columns') {
    // Try inserting a dummy match to see which columns exist
    const r1 = await supabase.from('matches').select('trivia_state').limit(0);
    const r2 = await supabase.from('matches').select('game_state').limit(0);
    const r3 = await supabase.from('matches').select('game_completed').limit(0);
    const r4 = await supabase.from('matches').select('date_plan').limit(0);
    return NextResponse.json({
      trivia_state: r1.error ? r1.error.message : 'exists',
      game_state: r2.error ? r2.error.message : 'exists',
      game_completed: r3.error ? r3.error.message : 'exists',
      date_plan: r4.error ? r4.error.message : 'exists',
    });
  }

  if (action === 'reset') {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name')
      .eq('is_onboarding_complete', true);

    if (!profiles || profiles.length < 2) {
      return NextResponse.json({ error: 'Need at least 2 profiles' }, { status: 400 });
    }

    const [u1, u2] = profiles;

    await supabase.from('matches')
      .delete()
      .or(`and(user1_id.eq.${u1.id},user2_id.eq.${u2.id}),and(user1_id.eq.${u2.id},user2_id.eq.${u1.id})`);

    await supabase.from('likes')
      .delete()
      .or(`and(from_user_id.eq.${u1.id},to_user_id.eq.${u2.id}),and(from_user_id.eq.${u2.id},to_user_id.eq.${u1.id})`);

    const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    await supabase.from('profiles')
      .update({ is_available: true, available_until: expiresAt, daily_likes_used: 0 })
      .in('id', [u1.id, u2.id]);

    return NextResponse.json({ message: `Reset done. ${u1.first_name} & ${u2.first_name} ready.` });
  }

  // Default: status
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, gender, gender_preference, is_available, available_until');

  const { data: matches } = await supabase
    .from('matches')
    .select('id, user1_id, user2_id, trivia_state, is_confirmed, created_at');

  const { data: likes } = await supabase
    .from('likes')
    .select('id, from_user_id, to_user_id');

  return NextResponse.json({ profiles, matches, likes, now: new Date().toISOString() });
}
