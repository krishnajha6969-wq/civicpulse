'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import SuperAdminLogin from '../../../components/auth/SuperAdminLogin';

export default function AdminPage() {
  const router = useRouter();

  return (
    <SuperAdminLogin
      onBackToHome={() => router.push('/')}
      onGoToCitizenLogin={() => router.push('/auth/login')}
    />
  );
}
