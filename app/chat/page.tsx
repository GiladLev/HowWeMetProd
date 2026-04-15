'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** /chat (without an ID) is unused — redirect to the matches/conversations list */
export default function ChatIndexPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/matches'); }, [router]);
  return null;
}
