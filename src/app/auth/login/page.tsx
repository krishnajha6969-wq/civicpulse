'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CitizenLogin from '../../../components/auth/CitizenLogin';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destination = searchParams.get('destination') || undefined;

  return (
    <CitizenLogin
      onBackToHome={() => router.push('/')}
      onGoToRegister={() =>
        router.push(destination ? `/auth/register?destination=${destination}` : '/auth/register')
      }
      onGoToSuperAdmin={() => router.push('/auth/admin')}
      intendedDestination={destination}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#070e1b' }} />}>
      <LoginContent />
    </Suspense>
  );
}
