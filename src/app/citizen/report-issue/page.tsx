'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, logout, AuthUser } from '../../../lib/auth';
import { addCitizenReport, ReportCategory, CivicReport } from '../../../lib/reports';
import NoticeModal from '../../../components/ui/NoticeModal';
import styles from './report-issue.module.css';

// 8 Defined Issue Categories with tailored SVG icons
interface CategoryDef {
  id: ReportCategory;
  name: string;
  icon: (props: { className?: string; color?: string }) => React.JSX.Element;
}

const CATEGORIES: CategoryDef[] = [
  {
    id: 'roads',
    name: 'Roads',
    icon: ({ color = '#f59e0b' }) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <polygon points="5 21 8 3 16 3 19 21" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        <line x1="12" y1="5" x2="12" y2="8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="11" x2="12" y2="14" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="17" x2="12" y2="19" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'water',
    name: 'Water',
    icon: ({ color = 'currentColor' }) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
  },
  {
    id: 'waste',
    name: 'Waste',
    icon: ({ color = 'currentColor' }) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    ),
  },
  {
    id: 'streetlights',
    name: 'Streetlights',
    icon: ({ color = 'currentColor' }) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
      </svg>
    ),
  },
  {
    id: 'drainage',
    name: 'Drainage',
    icon: ({ color = 'currentColor' }) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      </svg>
    ),
  },
  {
    id: 'parks',
    name: 'Parks & Public Spaces',
    icon: ({ color = 'currentColor' }) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5" />
        <path d="M7 10a5 5 0 0 1 10 0 5 5 0 0 1 1 5H6a5 5 0 0 1 1-5z" />
      </svg>
    ),
  },
  {
    id: 'transport',
    name: 'Public Transport',
    icon: ({ color = 'currentColor' }) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="15" rx="2" />
        <path d="M3 9h18" />
        <circle cx="7.5" cy="14.5" r="1.5" />
        <circle cx="16.5" cy="14.5" r="1.5" />
        <path d="M5 18l-2 3" />
        <path d="M19 18l2 3" />
      </svg>
    ),
  },
  {
    id: 'other',
    name: 'Other',
    icon: ({ color = 'currentColor' }) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
];

interface UploadedPhoto {
  id: string;
  name: string;
  sizeStr: string;
  url: string;
}

const PRESET_LOCATIONS = [
  { name: 'Station Road, Bhayandar (W)', lat: 19.2952, lng: 72.8544 },
  { name: 'Kanakia Road, Mira Road (E)', lat: 19.2812, lng: 72.8685 },
  { name: 'Maxus Mall Rd, Bhayandar (W)', lat: 19.3014, lng: 72.8491 },
  { name: 'Shanti Nagar, Sector 4, Mira Road', lat: 19.2884, lng: 72.8631 },
];

export default function ReportIssuePage() {
  const router = useRouter();

  // ── Authentication State ──
  const [user, setUser] = useState<AuthUser | null>(() => getCurrentUser());
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    router.push('/');
  };

  // ── 4-Step Workflow State ──
  // 1: Issue Details | 2: Location | 3: Photos | 4: Review & Submit
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // ── Form State ──
  const [category, setCategory] = useState<ReportCategory | ''>('roads');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Location State (Default: Station Road, Bhayandar West)
  const [addressSearch, setAddressSearch] = useState('Station Road, Bhayandar (W)');
  const [selectedAddress, setSelectedAddress] = useState('Station Road, Near Railway Platform 1, Bhayandar (W), Mira Bhayandar, Maharashtra 401101');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 19.2952, lng: 72.8544 });
  const [pinPercent, setPinPercent] = useState<{ x: number; y: number }>({ x: 48, y: 52 });
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(true);

  // Photos State (Up to 5)
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation Errors
  const [errors, setErrors] = useState<{
    category?: string;
    title?: string;
    description?: string;
    location?: string;
    photos?: string;
  }>({});

  // Review confirmation checkbox
  const [isConfirmedAccurate, setIsConfirmedAccurate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Confirmation State
  const [submittedReport, setSubmittedReport] = useState<CivicReport | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  // Cancel Confirmation Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Notice Modal for informational items
  const [noticeModal, setNoticeModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    badge?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    badge: 'CivicPulse',
  });

  const openNotice = (title: string, message: string, badge = 'CivicPulse') => {
    setNoticeModal({ isOpen: true, title, message, badge });
  };

  // Determine if form has entered data
  const isDirty = useMemo(() => {
    return Boolean(title.trim() || description.trim() || photos.length > 0);
  }, [title, description, photos]);

  // Initials for avatar
  const initials = useMemo(() => {
    if (!user?.name) return 'C';
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }, [user]);

  // ── Validation Helpers ──
  const validateStep1 = () => {
    const errs: typeof errors = {};
    if (!category) {
      errs.category = 'Please select an issue category';
    }
    if (!title.trim()) {
      errs.title = 'Please enter an issue title';
    } else if (title.trim().length < 5) {
      errs.title = 'Title must be at least 5 characters';
    } else if (title.trim().length > 100) {
      errs.title = 'Title must be less than 100 characters';
    }

    if (!description.trim()) {
      errs.description = 'Please describe the issue in detail';
    } else if (description.trim().length < 15) {
      errs.description = 'Description must be at least 15 characters';
    } else if (description.trim().length > 500) {
      errs.description = 'Description exceeds 500 characters limit';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: typeof errors = {};
    if (!selectedAddress.trim() || !isLocationConfirmed) {
      errs.location = 'Please select and confirm the issue location on the map';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Navigation Between Steps ──
  const handleNextFromStep1 = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      // Smooth scroll to top of form
      window.scrollTo({ top: 180, behavior: 'smooth' });
    }
  };

  const handleNextFromStep2 = () => {
    if (validateStep2()) {
      setCurrentStep(3);
      window.scrollTo({ top: 180, behavior: 'smooth' });
    }
  };

  const handleNextFromStep3 = () => {
    // Photos are optional, but if valid proceed to review
    setCurrentStep(4);
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  // ── Cancel Handler with Dirty Check ──
  const handleCancelClick = () => {
    if (isDirty) {
      setShowCancelModal(true);
    } else {
      router.push('/citizen');
    }
  };

  // ── Location Interactive Map Actions ──
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const xPct = Math.max(8, Math.min(92, Math.round((clickX / rect.width) * 100)));
    const yPct = Math.max(12, Math.min(88, Math.round((clickY / rect.height) * 100)));

    setPinPercent({ x: xPct, y: yPct });

    // Calculate realistic Mira Bhayandar coordinates based on pin position
    const lat = Number((19.2800 + ((100 - yPct) / 100) * 0.0300).toFixed(4));
    const lng = Number((72.8400 + (xPct / 100) * 0.0400).toFixed(4));
    setCoords({ lat, lng });

    // Derive approximate street address based on quadrant
    let street = 'Station Road Area';
    if (yPct < 40 && xPct < 50) street = 'Bhayandar West Sector 2, Maxus Mall Junction';
    else if (yPct < 40 && xPct >= 50) street = 'Bhayandar East, Navghar Road';
    else if (yPct >= 40 && xPct < 50) street = 'Station Road, Platform 1 Vicinity, Bhayandar West';
    else street = 'Kanakia Road, Sector 3, Mira Road East';

    setSelectedAddress(`${street}, Mira Bhayandar, Maharashtra (${lat}° N, ${lng}° E)`);
    setIsLocationConfirmed(true);
    setErrors((prev) => ({ ...prev, location: undefined }));
  };

  const handlePresetSelect = (preset: typeof PRESET_LOCATIONS[0]) => {
    setAddressSearch(preset.name);
    setSelectedAddress(`${preset.name}, Mira Bhayandar, Maharashtra 401101`);
    setCoords({ lat: preset.lat, lng: preset.lng });
    setIsLocationConfirmed(true);
    setErrors((prev) => ({ ...prev, location: undefined }));
  };

  const handleLocateMe = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(4));
          const lng = Number(pos.coords.longitude.toFixed(4));
          setCoords({ lat, lng });
          setSelectedAddress(`Current GPS Location (${lat}° N, ${lng}° E), Mira Bhayandar`);
          setIsLocationConfirmed(true);
          setErrors((prev) => ({ ...prev, location: undefined }));
        },
        () => {
          openNotice(
            'Location Access',
            'Browser location was denied or unavailable. Using default Mira Bhayandar municipal location marker.',
            'GPS Info'
          );
        }
      );
    } else {
      openNotice('GPS Unavailable', 'Geolocation is not supported by your browser.', 'Device Info');
    }
  };

  // ── Photo Upload Actions ──
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newPhotos: UploadedPhoto[] = [];
    const maxPhotos = 5;
    const currentCount = photos.length;

    for (let i = 0; i < files.length; i++) {
      if (currentCount + newPhotos.length >= maxPhotos) {
        openNotice('Upload Limit', 'You can upload up to 5 photos per issue report.', 'Max 5 Photos');
        break;
      }

      const file = files[i];
      // Type validation
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setErrors((prev) => ({ ...prev, photos: 'Only JPEG, PNG, or WebP image files are supported.' }));
        continue;
      }

      // Size validation: 5MB
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, photos: `File "${file.name}" exceeds the 5MB size limit.` }));
        continue;
      }

      const url = URL.createObjectURL(file);
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      newPhotos.push({
        id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        sizeStr,
        url,
      });
    }

    if (newPhotos.length > 0) {
      setPhotos((prev) => [...prev, ...newPhotos]);
      setErrors((prev) => ({ ...prev, photos: undefined }));
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // ── Final Report Submission ──
  const handleSubmitReport = () => {
    if (!validateStep1() || !validateStep2()) {
      openNotice('Incomplete Details', 'Please review required fields before submitting.', 'Validation');
      return;
    }

    if (!user) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const created = addCitizenReport({
        title,
        category: category as ReportCategory,
        location: selectedAddress,
        description,
        userId: user.id,
        photos: photos.map((p) => p.url),
        lat: coords.lat,
        lng: coords.lng,
      });

      setIsSubmitting(false);
      setSubmittedReport(created);
    }, 600);
  };

  const handleCopyTicket = () => {
    if (submittedReport?.ticketId) {
      navigator.clipboard.writeText(submittedReport.ticketId);
      setCopiedTicket(true);
      setTimeout(() => setCopiedTicket(false), 2000);
    }
  };

  const handleResetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('roads');
    setPhotos([]);
    setCurrentStep(1);
    setSubmittedReport(null);
    setErrors({});
  };

  // ── Auth Guard Screen ──
  if (!user || (user.role !== 'citizen' && user.role !== 'super_admin')) {
    return (
      <div className={styles.authRequiredWrap}>
        <div className={styles.authCard}>
          <div className={styles.lockIconWrap}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5cebaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className={styles.authTitle}>Authentication Required</h1>
          <p className={styles.authMessage}>
            Please sign in with a verified citizen account to submit community issue reports.
          </p>
          <div className={styles.authActions}>
            <button
              type="button"
              className={styles.authPrimaryBtn}
              onClick={() => router.push('/auth/login?destination=/citizen/report-issue')}
            >
              Sign In to Continue
            </button>
            <button
              type="button"
              className={styles.authSecondaryBtn}
              onClick={() => router.push('/')}
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* ── Left Sidebar Navigation (Matching Citizen Portal) ── */}
      <aside className={styles.sidebar} aria-label="Citizen portal navigation">
        <Link href="/" className={styles.sidebarBrand}>
          <div className={styles.brandLogo}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5cebaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <span className={styles.brandText}>CivicPulse</span>
        </Link>

        <div className={styles.sidebarSectionLabel}>CITIZEN PORTAL</div>

        <nav className={styles.sidebarNav}>
          {/* 1. Dashboard */}
          <Link href="/citizen" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            <span className={styles.navLabel}>Dashboard</span>
          </Link>

          {/* 2. Report an Issue (Active) */}
          <Link
            href="/citizen/report-issue"
            className={`${styles.navItem} ${styles.navItemActive}`}
            aria-current="page"
          >
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </span>
            <span className={styles.navLabel}>Report an Issue</span>
          </Link>

          {/* 3. My Reports */}
          <Link href="/citizen/my-reports" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </span>
            <span className={styles.navLabel}>My Reports</span>
          </Link>

          {/* 4. Notifications */}
          <Link href="/citizen/notifications" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>
            <span className={styles.navLabel}>Notifications</span>
            <span className={styles.navBadge}>3</span>
          </Link>

          {/* 5. Community */}
          <Link href="/citizen/community" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className={styles.navLabel}>Community</span>
          </Link>

          {/* 6. Help & Support */}
          <Link href="/citizen/help-support" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
            <span className={styles.navLabel}>Help & Support</span>
          </Link>
        </nav>

        {/* Sidebar Bottom Promo Card */}
        <div className={styles.sidebarPromoCard}>
          <img
            src="/images/dashboard/sidebar-promo-iso.png"
            alt="Cleaner neighbourhood artwork"
            className={styles.sidebarPromoImg}
          />
          <h4 className={styles.sidebarPromoTitle}>
            A cleaner neighbourhood starts with you.
          </h4>
          <p className={styles.sidebarPromoSub}>Report. Track. See change.</p>
        </div>
      </aside>

      {/* ── Main Viewport Area ── */}
      <div className={styles.mainViewport}>
        {/* Top Header matching Dashboard */}
        <header className={styles.topbar}>
          {/* Global Search field */}
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search reports or municipal wards..."
              aria-label="Search reports"
            />
          </div>

          {/* Right Controls */}
          <div className={styles.topbarRight}>
            {/* Location Selector */}
            <button
              type="button"
              className={styles.locationBadge}
              onClick={() =>
                openNotice(
                  'Municipal Ward Location',
                  'Your current active jurisdiction is Mira Bhayandar Municipal Corporation (MBMC).',
                  'Active Ward'
                )
              }
              aria-label="Current jurisdiction: Mira Bhayandar"
            >
              <span className={styles.locationIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <span>{user.location || 'Mira Bhayandar'}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Notification Bell */}
            <Link
              href="/citizen/notifications"
              className={styles.iconButton}
              aria-label="View notifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className={styles.notifDot} />
            </Link>

            {/* User Profile Trigger & Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={styles.userProfileTrigger}
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                aria-expanded={profileMenuOpen}
                aria-label="User account menu"
                suppressHydrationWarning
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className={styles.userAvatar} />
                ) : (
                  <div className={styles.initialsAvatar} suppressHydrationWarning>{initials}</div>
                )}
                <div className={styles.userInfo} suppressHydrationWarning>
                  <span className={styles.userName} suppressHydrationWarning>{user.name}</span>
                  <span className={styles.userRole}>Citizen</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {profileMenuOpen && (
                <div className={styles.profileMenuDropdown} role="menu">
                  <div style={{ padding: '8px 12px' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#ffffff' }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#7b8fae' }}>
                      {user.email}
                    </div>
                  </div>
                  <div className={styles.menuDivider} />
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      openNotice('Profile Settings', 'Manage your contact details and registered ward.');
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>My Profile</span>
                  </button>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      openNotice('Preferences', 'Configure municipal notifications and language options.');
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    <span>Preferences</span>
                  </button>
                  <div className={styles.menuDivider} />
                  <button
                    type="button"
                    className={`${styles.menuItem} ${styles.menuItemDanger}`}
                    onClick={handleLogout}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Scrollable Content Area ── */}
        <main className={styles.contentScroll}>
          {/* Panoramic Hero Heading Banner matching IMAGE 1 */}
          <section className={styles.headingBanner} aria-label="Page header">
            <div className={styles.bannerBreadcrumb}>
              <Link href="/citizen" className={styles.crumbLink}>
                Dashboard
              </Link>
              <span className={styles.crumbSep} aria-hidden="true">&gt;</span>
              <span className={styles.crumbActive}>Report an Issue</span>
            </div>
            <h1 className={styles.bannerHeading}>Report an Issue</h1>
            <p className={styles.bannerSubtitle}>
              Help us build a cleaner, safer and stronger city. Share the details below and we&apos;ll get it to the right team.
            </p>
          </section>

          {/* 4-Step Progress Indicator matching IMAGE 1 */}
          <section className={styles.progressCard} aria-label="Reporting progress">
            <div className={styles.progressTrack}>
              {/* Step 1: Issue Details */}
              <button
                type="button"
                className={`${styles.stepItem} ${currentStep === 1 ? styles.stepActive : ''} ${currentStep > 1 ? styles.stepCompleted : ''}`}
                onClick={() => setCurrentStep(1)}
              >
                <div className={styles.stepNumberCircle}>
                  {currentStep > 1 ? '✓' : '1'}
                </div>
                <div className={styles.stepText}>
                  <span className={styles.stepTitle}>Issue Details</span>
                  <span className={styles.stepSubtitle}>Tell us what&apos;s wrong</span>
                </div>
              </button>

              <div className={`${styles.connectorLine} ${currentStep > 1 ? styles.connectorCompleted : ''}`} />

              {/* Step 2: Location */}
              <button
                type="button"
                className={`${styles.stepItem} ${currentStep === 2 ? styles.stepActive : ''} ${currentStep > 2 ? styles.stepCompleted : ''}`}
                onClick={() => {
                  if (validateStep1()) setCurrentStep(2);
                }}
              >
                <div className={styles.stepNumberCircle}>
                  {currentStep > 2 ? '✓' : '2'}
                </div>
                <div className={styles.stepText}>
                  <span className={styles.stepTitle}>Location</span>
                  <span className={styles.stepSubtitle}>Pin the exact spot</span>
                </div>
              </button>

              <div className={`${styles.connectorLine} ${currentStep > 2 ? styles.connectorCompleted : ''}`} />

              {/* Step 3: Photos */}
              <button
                type="button"
                className={`${styles.stepItem} ${currentStep === 3 ? styles.stepActive : ''} ${currentStep > 3 ? styles.stepCompleted : ''}`}
                onClick={() => {
                  if (validateStep1() && validateStep2()) setCurrentStep(3);
                }}
              >
                <div className={styles.stepNumberCircle}>
                  {currentStep > 3 ? '✓' : '3'}
                </div>
                <div className={styles.stepText}>
                  <span className={styles.stepTitle}>Photos</span>
                  <span className={styles.stepSubtitle}>Add supporting images</span>
                </div>
              </button>

              <div className={`${styles.connectorLine} ${currentStep > 3 ? styles.connectorCompleted : ''}`} />

              {/* Step 4: Review & Submit */}
              <button
                type="button"
                className={`${styles.stepItem} ${currentStep === 4 ? styles.stepActive : ''}`}
                onClick={() => {
                  if (validateStep1() && validateStep2()) setCurrentStep(4);
                }}
              >
                <div className={styles.stepNumberCircle}>4</div>
                <div className={styles.stepText}>
                  <span className={styles.stepTitle}>Review &amp; Submit</span>
                  <span className={styles.stepSubtitle}>Check and send</span>
                </div>
              </button>
            </div>
          </section>

          {/* ── Steps 1-3: Two-Column Form Layout ── */}
          {currentStep < 4 ? (
            <div className={styles.formGrid}>
              {/* ── Left Column: Panel 1 - Issue Details ── */}
              <div className={`${styles.panelCard} ${currentStep === 1 ? styles.panelCardActive : ''}`}>
                <div className={styles.panelHeader}>
                  <h2 className={styles.panelTitle}>1. Issue Details</h2>
                  <p className={styles.panelSubtitle}>Provide basic information about the issue.</p>
                </div>

                {/* A. 8 Category Selection Tiles */}
                <div className={styles.formGroup}>
                  <label className={styles.categoryLabel}>Issue Category *</label>
                  <div className={styles.categoryGrid} role="radiogroup" aria-label="Issue category">
                    {CATEGORIES.map((cat) => {
                      const isSelected = category === cat.id;
                      const IconComponent = cat.icon;
                      return (
                        <div
                          key={cat.id}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          className={`${styles.categoryTile} ${isSelected ? styles.categoryTileSelected : ''}`}
                          onClick={() => {
                            setCategory(cat.id);
                            setErrors((prev) => ({ ...prev, category: undefined }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                              e.preventDefault();
                              setCategory(cat.id);
                              setErrors((prev) => ({ ...prev, category: undefined }));
                            }
                          }}
                        >
                          {isSelected && <span className={styles.categoryCheck}>✓</span>}
                          <div className={styles.categoryIconWrap}>
                            <IconComponent color={isSelected ? '#5cebaa' : '#8da2c0'} />
                          </div>
                          <span className={styles.categoryTileName}>{cat.name}</span>
                        </div>
                      );
                    })}
                  </div>
                  {errors.category && <p className={styles.errorText}>⚠ {errors.category}</p>}
                </div>

                {/* B. Issue Title */}
                <div className={styles.formGroup}>
                  <div className={styles.formLabelRow}>
                    <label htmlFor="issue-title">Issue Title *</label>
                    <span className={styles.titleCounter}>{title.length}/100</span>
                  </div>
                  <input
                    id="issue-title"
                    type="text"
                    maxLength={100}
                    placeholder="E.g. Pothole on main road"
                    className={`${styles.inputField} ${errors.title ? styles.inputFieldError : ''}`}
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                    }}
                    aria-required="true"
                    aria-invalid={Boolean(errors.title)}
                  />
                  {errors.title && <p className={styles.errorText}>⚠ {errors.title}</p>}
                </div>

                {/* C. Issue Description */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="issue-description">Description *</label>
                  <div className={styles.textareaWrap}>
                    <textarea
                      id="issue-description"
                      maxLength={500}
                      placeholder="Describe the issue in detail... Include any additional information that might help."
                      className={`${styles.textareaField} ${errors.description ? styles.inputFieldError : ''}`}
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
                      }}
                      aria-required="true"
                      aria-invalid={Boolean(errors.description)}
                    />
                    <span className={styles.counterText}>{description.length} / 500</span>
                  </div>
                  {errors.description && <p className={styles.errorText}>⚠ {errors.description}</p>}
                </div>

                {/* Workflow Buttons at bottom of Step 1 */}
                <div className={styles.actionBar}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={handleCancelClick}
                  >
                    Cancel
                  </button>

                  {currentStep === 1 ? (
                    <button
                      type="button"
                      className={styles.primaryNextBtn}
                      onClick={handleNextFromStep1}
                    >
                      <span>Next: Add Location</span>
                      <span>→</span>
                    </button>
                  ) : currentStep === 2 ? (
                    <button
                      type="button"
                      className={styles.primaryNextBtn}
                      onClick={handleNextFromStep2}
                    >
                      <span>Next: Add Photos</span>
                      <span>→</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.primaryNextBtn}
                      onClick={handleNextFromStep3}
                    >
                      <span>Next: Review &amp; Submit</span>
                      <span>→</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ── Right Column: Panels 2 (Location) & 3 (Photos) ── */}
              <div className={styles.rightColumn}>
                {/* ── Panel 2: Pin the Exact Location ── */}
                <div className={`${styles.panelCard} ${currentStep === 2 ? styles.panelCardActive : ''}`}>
                  <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>2. Pin the Exact Location</h2>
                    <p className={styles.panelSubtitle}>
                      Move the map or search for an address to mark the issue location.
                    </p>
                  </div>

                  {/* Address Search Bar */}
                  <div className={styles.mapSearchWrap}>
                    <span className={styles.mapSearchIcon}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      className={styles.mapSearchInput}
                      placeholder="Search for an address or landmark..."
                      value={addressSearch}
                      onChange={(e) => setAddressSearch(e.target.value)}
                    />
                  </div>

                  {/* Realistic Street Map Container */}
                  <div
                    className={styles.mapBox}
                    onClick={handleMapClick}
                    role="region"
                    aria-label="Interactive street map of Mira Bhayandar"
                  >
                    <img
                      src="/images/dashboard/mira-bhayandar-map.png"
                      alt="Mira Bhayandar Detailed Street Map"
                      className={styles.mapImageBg}
                    />

                    {/* Interactive Dynamic Pin Marker */}
                    <div
                      className={styles.mapPinMarker}
                      style={{ left: `${pinPercent.x}%`, top: `${pinPercent.y}%` }}
                    >
                      <div className={styles.pinHalo} />
                      <svg
                        className={styles.pinSvg}
                        width="26"
                        height="34"
                        viewBox="0 0 24 32"
                        fill="none"
                      >
                        <path
                          d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z"
                          fill="#ef4444"
                        />
                        <circle cx="12" cy="11" r="4.5" fill="#ffffff" />
                      </svg>
                    </div>

                    {/* Recenter / Geolocation Button */}
                    <button
                      type="button"
                      className={styles.mapRecenterBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLocateMe();
                      }}
                      title="Locate me or recenter map"
                      aria-label="Recenter location"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="3 11 22 2 13 21 11 13 3 11" />
                      </svg>
                    </button>
                  </div>

                  {/* Selected Location Summary Bar below Map */}
                  <div className={styles.selectedLocationBar}>
                    <div className={styles.selectedLocationLeft}>
                      <div className={styles.locationPinCircle}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <div className={styles.selectedLocationText}>
                        <span className={styles.selectedLocationLabel}>Selected Location</span>
                        <span className={styles.selectedLocationAddress}>
                          {selectedAddress}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.changeLocationBtn}
                      onClick={() => {
                        const input = document.querySelector(`.${styles.mapSearchInput}`) as HTMLInputElement;
                        input?.focus();
                      }}
                    >
                      <span>Change</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                  {errors.location && <p className={styles.errorText}>⚠ {errors.location}</p>}
                </div>

                {/* ── Panel 3: Upload Photos ── */}
                <div className={`${styles.panelCard} ${currentStep === 3 ? styles.panelCardActive : ''}`}>
                  <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>3. Upload Photos</h2>
                    <p className={styles.panelSubtitle}>Add clear photos to help us understand the issue.</p>
                  </div>

                  {/* Horizontal Photos Row matching IMAGE 1 */}
                  <div className={styles.photosRow}>
                    {/* Drag and Drop Dropzone */}
                    <div
                      className={`${styles.uploadDropzone} ${isDragOver ? styles.uploadDropzoneDrag : ''}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        handleFileSelect(e.dataTransfer.files);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        className={styles.fileInputHidden}
                        onChange={(e) => handleFileSelect(e.target.files)}
                        aria-label="Upload photos"
                      />
                      <div className={styles.uploadIcon}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                      <div className={styles.uploadTitle}>Click to upload photos</div>
                      <div className={styles.uploadSub}>or drag and drop</div>
                      <div className={styles.uploadFormats}>JPEG, PNG, WebP up to 5MB each (Max 5 photos)</div>
                    </div>

                    {/* Uploaded Thumbnails */}
                    {photos.map((item) => (
                      <div key={item.id} className={styles.photoThumbItem}>
                        <img src={item.url} alt={item.name} className={styles.photoThumbImg} />
                        <button
                          type="button"
                          className={styles.photoRemoveBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePhoto(item.id);
                          }}
                          aria-label={`Remove photo ${item.name}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}

                    {/* Add More Control */}
                    {photos.length < 5 && (
                      <button
                        type="button"
                        className={styles.addMoreBtn}
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Add more photos"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span>Add More</span>
                      </button>
                    )}
                  </div>
                  {errors.photos && <p className={styles.errorText}>⚠ {errors.photos}</p>}
                </div>
              </div>
            </div>
          ) : (
            /* ── Step 4: Review & Submit Card ── */
            <div className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <h2 className={styles.reviewTitle}>4. Review &amp; Submit Issue Report</h2>
                <p className={styles.reviewSubtitle}>
                  Please inspect the details below before dispatching this report to the municipal response team.
                </p>
              </div>

              <div className={styles.reviewGrid}>
                {/* Category & Title */}
                <div className={styles.reviewBlock}>
                  <div className={styles.reviewBlockLabel}>Issue Category</div>
                  <div className={styles.categoryBadgeReview}>
                    <span>
                      {CATEGORIES.find((c) => c.id === category)?.name || 'General Municipal'}
                    </span>
                  </div>
                </div>

                <div className={styles.reviewBlock}>
                  <div className={styles.reviewBlockLabel}>Urgency Priority</div>
                  <div className={styles.reviewBlockValue}>
                    {category === 'water' || category === 'drainage' ? 'High Priority' : 'Standard Priority'}
                  </div>
                </div>

                <div className={styles.reviewBlockFull}>
                  <div className={styles.reviewBlockLabel}>Issue Title</div>
                  <div className={styles.reviewBlockValue}>{title}</div>
                </div>

                <div className={styles.reviewBlockFull}>
                  <div className={styles.reviewBlockLabel}>Detailed Description</div>
                  <div className={styles.reviewBlockDesc}>{description}</div>
                </div>

                {/* Location */}
                <div className={styles.reviewBlockFull}>
                  <div className={styles.reviewBlockLabel}>Location Pin &amp; Address</div>
                  <div className={styles.reviewBlockValue}>{selectedAddress}</div>
                  <div style={{ fontSize: '0.78rem', color: '#5cebaa', marginTop: 4 }}>
                    Coordinates: {coords.lat}° N, {coords.lng}° E · Ward 3 Jurisdiction
                  </div>
                </div>

                {/* Photos */}
                <div className={styles.reviewBlockFull}>
                  <div className={styles.reviewBlockLabel}>Attached Photos ({photos.length})</div>
                  {photos.length > 0 ? (
                    <div className={styles.reviewPhotosGrid}>
                      {photos.map((p) => (
                        <img key={p.id} src={p.url} alt={p.name} className={styles.reviewPhotoThumb} />
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.82rem', color: '#64748b' }}>No photos attached.</p>
                  )}
                </div>

                {/* Reporter Profile */}
                <div className={styles.reviewBlockFull}>
                  <div className={styles.reviewBlockLabel}>Reporting Citizen</div>
                  <div style={{ fontSize: '0.88rem', color: '#f1f5f9' }}>
                    <strong>{user.name}</strong> · {user.email} · Registered Citizen
                  </div>
                </div>
              </div>

              {/* Accuracy Checkbox */}
              <div className={styles.reviewConfirmRow}>
                <input
                  id="confirm-accurate"
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={isConfirmedAccurate}
                  onChange={(e) => setIsConfirmedAccurate(e.target.checked)}
                />
                <label htmlFor="confirm-accurate">
                  I confirm the above details are accurate to the best of my knowledge for municipal response.
                </label>
              </div>

              {/* Action Buttons */}
              <div className={styles.actionBar}>
                <button
                  type="button"
                  className={styles.secondaryBackBtn}
                  onClick={() => setCurrentStep(1)}
                >
                  <span>←</span>
                  <span>Edit Details</span>
                </button>

                <button
                  type="button"
                  className={styles.primaryNextBtn}
                  disabled={!isConfirmedAccurate || isSubmitting}
                  onClick={handleSubmitReport}
                >
                  {isSubmitting ? (
                    <span>Submitting Report...</span>
                  ) : (
                    <>
                      <span>Submit Issue Report</span>
                      <span>✓</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Success Modal / Dialog ── */}
      {submittedReport && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.successModalCard}>
            <div className={styles.successIconWrap}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h2 className={styles.successTitle}>Report Submitted!</h2>
            <p className={styles.successSubtitle}>
              Thank you for contributing to your city. Your issue report has been logged and forwarded to the local MBMC Ward team.
            </p>

            <div className={styles.ticketBadgeBox}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Ticket Reference</div>
                <div className={styles.ticketIdText}>{submittedReport.ticketId}</div>
              </div>
              <button
                type="button"
                className={styles.copyTicketBtn}
                onClick={handleCopyTicket}
              >
                {copiedTicket ? 'Copied! ✓' : 'Copy Ticket ID'}
              </button>
            </div>

            <div className={styles.metaInfoList}>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Issue:</span>
                <span className={styles.metaVal}>{submittedReport.title}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Status:</span>
                <span className={styles.metaVal} style={{ color: '#5cebaa' }}>Awaiting Triage</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Est. Response:</span>
                <span className={styles.metaVal}>Within 24–48 hours</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Jurisdiction:</span>
                <span className={styles.metaVal}>MBMC Ward 3</span>
              </div>
            </div>

            <div className={styles.successActions}>
              <button
                type="button"
                className={styles.trackReportBtn}
                onClick={() => router.push('/citizen#recent-reports-panel')}
              >
                Track My Report →
              </button>
              <button
                type="button"
                className={styles.backHomeBtn}
                onClick={handleResetForm}
              >
                Submit Another Issue
              </button>
              <button
                type="button"
                className={styles.backHomeBtn}
                onClick={() => router.push('/citizen')}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel / Dirty Confirmation Modal ── */}
      {showCancelModal && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.confirmModalCard}>
            <div className={styles.warnIconWrap}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className={styles.confirmModalTitle}>Discard Report?</h3>
            <p className={styles.confirmModalText}>
              You have unsaved changes in your issue report. If you leave now, your entered details and photos will be discarded.
            </p>
            <div className={styles.confirmModalActions}>
              <button
                type="button"
                className={styles.confirmKeepBtn}
                onClick={() => setShowCancelModal(false)}
              >
                Continue Editing
              </button>
              <button
                type="button"
                className={styles.confirmDiscardBtn}
                onClick={() => router.push('/citizen')}
              >
                Discard &amp; Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Notification / Info Modal ── */}
      <NoticeModal
        isOpen={noticeModal.isOpen}
        title={noticeModal.title}
        message={noticeModal.message}
        badge={noticeModal.badge}
        onClose={() => setNoticeModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
