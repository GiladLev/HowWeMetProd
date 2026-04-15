import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function DELETE() {
  const cookieStore = await cookies();

  // Regular client to verify the session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  // Admin client (service role) for privileged operations
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: 'Service role key not configured. Set SUPABASE_SERVICE_ROLE_KEY in environment variables.' },
      { status: 500 }
    );
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Hard-delete all user data in dependency order
  // First, get all match IDs involving this user
  const { data: userMatches } = await admin
    .from('matches')
    .select('id')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

  const matchIds = (userMatches ?? []).map(m => m.id);

  // Delete messages for those matches
  if (matchIds.length > 0) {
    await admin.from('messages').delete().in('match_id', matchIds);
  }

  // Delete the matches themselves
  await admin.from('matches').delete().or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
  await admin.from('likes').delete().or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);
  await admin.from('blocked_users').delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
  await admin.from('reported_users').delete().or(`reporter_id.eq.${userId},reported_id.eq.${userId}`);
  await admin.from('profiles').delete().eq('id', userId);

  // Delete the auth user itself
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
