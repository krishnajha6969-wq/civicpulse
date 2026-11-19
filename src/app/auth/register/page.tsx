'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CitizenRegister from '../../../components/auth/CitizenRegister';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destination = searchParams.get('destination') || undefined;

  return (
    <CitizenRegister
      onBackToHome={() => router.push('/')}
      onGoToLogin={() =>
        router.push(destination ? `/auth/login?destination=${destination}` : '/auth/login')
      }
      intendedDestination={destination}
    />
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#070e1b' }} />}>
      <RegisterContent />
    </Suspense>
  );
}
