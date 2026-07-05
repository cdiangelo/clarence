'use client';
import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { AppShell } from '@/components/layout/AppShell';
import { ChatInterface } from '@/components/chat/ChatInterface';

function ChatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) router.replace('/auth');
  }, [user, router]);

  if (!user) return null;

  const initialMessage = searchParams.get('q') ?? undefined;

  return (
    <AppShell>
      <div className="h-full">
        <ChatInterface initialMessage={initialMessage} />
      </div>
    </AppShell>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageInner />
    </Suspense>
  );
}
