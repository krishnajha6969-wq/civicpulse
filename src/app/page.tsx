'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginWardStaff } from '../lib/auth';
import LoadingScreen from '../components/loading/LoadingScreen';
import Navbar from '../components/layout/Navbar';
import HeroSection from '../components/landing/HeroSection';
import CategoriesSection from '../components/landing/CategoriesSection';
import SourcesSection from '../components/landing/SourcesSection';
import WorkflowSection from '../components/landing/WorkflowSection';
import DecisionsSection from '../components/landing/DecisionsSection';
import ClosingCta from '../components/landing/ClosingCta';
import Footer from '../components/layout/Footer';
import NoticeModal from '../components/ui/NoticeModal';

// Authentication Components
import CitizenLogin from '../components/auth/CitizenLogin';
import CitizenRegister from '../components/auth/CitizenRegister';
import SuperAdminLogin from '../components/auth/SuperAdminLogin';

// Portal Selection Screen
import PortalSelectScreen from '../components/portals/PortalSelectScreen';

type AuthView = 'portals' | 'login' | 'register' | 'admin' | null;

export default function Home() {
  const router = useRouter();
  // Loading screen runs strictly first
  const [isLoading, setIsLoading] = useState(true);

  // Authentication Views
  const [authView, setAuthView] = useState<AuthView>(null);
  const [intendedDestination, setIntendedDestination] = useState<string>('');

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    stageNote?: string;
    badge?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    stageNote: '',
    badge: 'Upcoming Feature',
  });

  const openNotice = (
    title: string,
    message: string,
    stageNote: string = '',
    badge: string = 'Upcoming Feature'
  ) => {
    setModalState({
      isOpen: true,
      title,
      message,
      stageNote,
      badge,
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // ── Action handlers ────────────────────────────────────────────────────────

  /** Opens portal selector; remembers where the user wanted to go */
  const openPortalSelect = (dest: string = '') => {
    setIntendedDestination(dest);
    setAuthView('portals');
  };

  const handleReportIssue = () => openPortalSelect('report');
  const handleTrackTicket = () => openPortalSelect('track');

  const handleWardPerformance = () => {
    loginWardStaff('Ward 3');
    router.push('/staff/ward-reports');
  };

  /** Navbar "Citizen sign in" goes directly to portal selector */
  const handleCitizenSignIn = () => openPortalSelect('');

  /** From portal selector → citizen login */
  const handlePortalCitizenLogin = () => setAuthView('login');

  /** From portal selector → citizen register */
  const handlePortalCitizenRegister = () => setAuthView('register');

  /** Ward staff portal directs to Ward Staff Dashboard */
  const handlePortalWardLogin = () => {
    loginWardStaff('Ward 3');
    router.push('/staff/dashboard');
  };

  /** From portal selector → super-admin login */
  const handlePortalAdminLogin = () => setAuthView('admin');

  /** Whether the landing page should be rendered (hidden while auth screens are shown) */
  const showLanding = authView === null || authView === 'portals';

  return (
    <>
      {/* Loading Screen */}
      <LoadingScreen onComplete={() => setIsLoading(false)} />

      {/* ── Portal Selection Screen ── */}
      {authView === 'portals' && (
        <PortalSelectScreen
          destination={intendedDestination}
          onClose={() => setAuthView(null)}
          onCitizenLogin={handlePortalCitizenLogin}
          onCitizenRegister={handlePortalCitizenRegister}
          onWardLogin={handlePortalWardLogin}
          onAdminLogin={handlePortalAdminLogin}
        />
      )}

      {/* ── Auth Screen Overlays ── */}
      {authView === 'login' && (
        <CitizenLogin
          onBackToHome={() => setAuthView(null)}
          onGoToRegister={() => setAuthView('register')}
          onGoToSuperAdmin={() => setAuthView('admin')}
          intendedDestination={intendedDestination}
        />
      )}

      {authView === 'register' && (
        <CitizenRegister
          onBackToHome={() => setAuthView(null)}
          onGoToLogin={() => setAuthView('login')}
          intendedDestination={intendedDestination}
        />
      )}

      {authView === 'admin' && (
        <SuperAdminLogin
          onBackToHome={() => setAuthView(null)}
          onGoToCitizenLogin={() => setAuthView('login')}
        />
      )}

      {/* ── Main Landing Page Layout ── */}
      <div
        style={{
          minHeight: '100vh',
          display: showLanding ? 'flex' : 'none',
          flexDirection: 'column',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.5s ease-out',
          pointerEvents: isLoading ? 'none' : 'auto',
        }}
      >
        {/* Navigation */}
        <Navbar
          onOpenNotice={openNotice}
          onWardPerformanceClick={handleWardPerformance}
          onTrackTicketClick={handleTrackTicket}
          onCitizenSignInClick={handleCitizenSignIn}
        />

        <main id="main-content" style={{ flex: 1 }}>
          {/* Hero Section */}
          <HeroSection
            onReportClick={handleReportIssue}
            onExploreClick={handleWardPerformance}
          />

          {/* Issue Categories Strip */}
          <CategoriesSection />

          {/* Three Connected Portals Section */}
          <SourcesSection />

          {/* Four-Step Workflow */}
          <WorkflowSection />

          {/* Capabilities Section */}
          <DecisionsSection />

          {/* Closing Call to Action */}
          <ClosingCta
            onReportClick={handleReportIssue}
            onTrackClick={handleTrackTicket}
          />
        </main>

        {/* Footer */}
        <Footer
          onOpenNotice={openNotice}
          onReportClick={handleReportIssue}
          onWardPerformanceClick={handleWardPerformance}
          onTrackTicketClick={handleTrackTicket}
          onCitizenSignInClick={handleCitizenSignIn}
          onSuperAdminClick={handlePortalAdminLogin}
        />
      </div>

      {/* Availability / Notice Modal */}
      <NoticeModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        stageNote={modalState.stageNote}
        badge={modalState.badge}
      />
    </>
  );
}

