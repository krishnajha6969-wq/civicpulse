'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser, logout, AuthUser } from '../../../lib/auth';
import {
  CommunityPost,
  CommunityEvent,
  PostType,
  CivicTopic,
  TOPIC_METADATA,
  getCommunityPosts,
  createCommunityPost,
  toggleLikePost,
  toggleSavePost,
  addCommentToPost,
  getCommunityEvents,
  toggleEventRegistration,
  getTopContributors,
} from '../../../lib/community';
import NoticeModal from '../../../components/ui/NoticeModal';
import styles from './community.module.css';

export default function CommunityPage() {
  const router = useRouter();

  // Authentication State
  const [user, setUser] = useState<AuthUser | null>(() => getCurrentUser());
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Notice Modal for general dialogs
  const [notice, setNotice] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    stageNote?: string;
    badge?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const openNotice = (
    title: string,
    message: string,
    stageNote?: string,
    badge?: string
  ) => {
    setNotice({
      isOpen: true,
      title,
      message,
      stageNote,
      badge,
    });
  };

  const closeNotice = () => {
    setNotice((prev) => ({ ...prev, isOpen: false }));
  };

  // Toast notification for actions like Share
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Community Data States
  const [posts, setPosts] = useState<CommunityPost[]>(() => getCommunityPosts());
  const [events, setEvents] = useState<CommunityEvent[]>(() => getCommunityEvents());
  const [activeTab, setActiveTab] = useState<PostType>('all');
  const [activeTopic, setActiveTopic] = useState<CivicTopic>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [commentModalPost, setCommentModalPost] = useState<CommunityPost | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // New Post Form state
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState<'discussion' | 'suggestion' | 'success_story'>('discussion');
  const [newPostCategory, setNewPostCategory] = useState<CivicTopic>('roads');
  const [newPostLocation, setNewPostLocation] = useState('Near Kanakia Road');
  const [newPostImageUrl, setNewPostImageUrl] = useState('');
  const [formError, setFormError] = useState('');

  // Load and sync community data
  const loadCommunityData = useCallback(() => {
    setPosts(getCommunityPosts());
    setEvents(getCommunityEvents());
  }, []);

  useEffect(() => {
    loadCommunityData();

    const handleSync = () => loadCommunityData();
    window.addEventListener('civicpulse_community_updated', handleSync);
    return () => window.removeEventListener('civicpulse_community_updated', handleSync);
  }, [loadCommunityData]);

  // User initials helper
  const initials = useMemo(() => {
    if (!user?.name) return 'C';
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }, [user]);

  // Filtered and searched posts
  const filteredPosts = useMemo(() => {
    return getCommunityPosts(activeTopic, activeTab, searchQuery);
  }, [activeTopic, activeTab, searchQuery, posts]);

  // Top contributors list
  const contributors = useMemo(() => getTopContributors(user?.id), [user]);

  // Post Actions
  const handleLike = (postId: string) => {
    if (!user) {
      router.push('/auth/login?destination=/citizen/community');
      return;
    }
    const updated = toggleLikePost(postId, user.id);
    setPosts(updated);
  };

  const handleSave = (postId: string) => {
    if (!user) {
      router.push('/auth/login?destination=/citizen/community');
      return;
    }
    const updated = toggleSavePost(postId, user.id);
    setPosts(updated);
    const post = updated.find((p) => p.id === postId);
    if (post?.savedBy.includes(user.id)) {
      showToast('Post bookmarked to your saved collection.');
    } else {
      showToast('Post removed from saved collection.');
    }
  };

  const handleShare = (post: CommunityPost) => {
    const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/citizen/community#${post.id}` : '';
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.content,
        url: postUrl,
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard?.writeText(postUrl);
        showToast('Post link copied to clipboard!');
      });
    } else {
      navigator.clipboard?.writeText(postUrl);
      showToast('Post link copied to clipboard!');
    }
  };

  // Open comments modal for post
  const openComments = (post: CommunityPost) => {
    setCommentModalPost(post);
    setNewCommentText('');
  };

  // Submit comment
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth/login?destination=/citizen/community');
      return;
    }
    if (!commentModalPost || !newCommentText.trim()) return;

    const updatedPost = addCommentToPost(
      commentModalPost.id,
      { id: user.id, name: user.name, avatarUrl: user.avatarUrl },
      newCommentText
    );

    if (updatedPost) {
      setCommentModalPost(updatedPost);
      setNewCommentText('');
      setPosts(getCommunityPosts());
      showToast('Comment submitted successfully!');
    }
  };

  // Event Registration toggle
  const handleJoinEvent = (eventId: string) => {
    if (!user) {
      router.push('/auth/login?destination=/citizen/community');
      return;
    }
    const updated = toggleEventRegistration(eventId, user.id);
    setEvents(updated);
    const ev = updated.find((e) => e.id === eventId);
    if (ev?.registeredUsers.includes(user.id)) {
      showToast(`Registered for ${ev.title}! You will receive SMS alerts.`);
    } else {
      showToast(`Registration cancelled for ${ev?.title}.`);
    }
  };

  // Create Post Submit
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth/login?destination=/citizen/community');
      return;
    }

    if (!newPostTitle.trim()) {
      setFormError('Please provide a post title.');
      return;
    }
    if (!newPostContent.trim()) {
      setFormError('Please provide detailed post content.');
      return;
    }

    createCommunityPost({
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
      type: newPostType,
      category: newPostCategory,
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatarUrl,
      location: newPostLocation.trim() || 'Mira Bhayandar',
      imageUrl: newPostImageUrl.trim() || undefined,
    });

    // Reset and close
    setNewPostTitle('');
    setNewPostContent('');
    setNewPostType('discussion');
    setNewPostCategory('roads');
    setNewPostLocation('Near Kanakia Road');
    setNewPostImageUrl('');
    setFormError('');
    setCreateModalOpen(false);
    setPosts(getCommunityPosts());
    showToast('Your community post has been published!');
  };

  // Guard: Protect citizen workspace for authenticated citizen accounts
  if (!user || (user.role !== 'citizen' && user.role !== 'super_admin')) {
    return (
      <div className={styles.authRequiredWrap}>
        <div className={styles.authCard}>
          <div className={styles.lockIconWrap}>
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5cebaa"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className={styles.authTitle}>Authentication Required</h1>
          <p className={styles.authMessage}>
            You must be signed in with a verified citizen account to access the CivicPulse Community portal.
          </p>
          <div className={styles.authActions}>
            <button
              type="button"
              className={styles.authPrimaryBtn}
              onClick={() => router.push('/auth/login?destination=/citizen/community')}
            >
              Citizen Sign In
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
    <div className={styles.container}>
      {/* ============================================================
          SIDEBAR NAVIGATION
          ============================================================ */}
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brandLink}>
          <div className={styles.logoPulseIcon} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

          {/* 2. Report an Issue */}
          <Link href="/citizen/report-issue" className={styles.navItem}>
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

          {/* 5. Community (Active) */}
          <Link
            href="/citizen/community"
            className={`${styles.navItem} ${styles.navItemActive}`}
            aria-current="page"
          >
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

        {/* Sidebar Promo Card */}
        <div className={styles.sidebarPromoCard}>
          <div className={styles.promoImageWrapper}>
            <Image
              src="/images/dashboard/sidebar-promo-iso.png"
              alt="Community Neighbourhood"
              fill
              sizes="220px"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div>
            <div className={styles.promoTitle}>A cleaner neighbourhood starts with you.</div>
            <div className={styles.promoSubtitle}>Report. Track. See change.</div>
          </div>
        </div>
      </aside>

      {/* ============================================================
          MAIN WRAPPER & TOPBAR
          ============================================================ */}
      <div className={styles.mainWrapper}>
        <header className={styles.topbar}>
          {/* Global Search Bar */}
          <div className={styles.globalSearchForm}>
            <span className={styles.searchIcon} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className={styles.globalSearchInput}
              placeholder="Search for discussions, topics, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search community discussions and topics"
            />
          </div>

          {/* Topbar Actions: Location, Notification Bell, User Avatar */}
          <div className={styles.topbarActions}>
            <button
              type="button"
              className={styles.locationSelector}
              onClick={() =>
                openNotice(
                  'Municipal Boundary',
                  'Active Zone: Mira Bhayandar Municipal Corporation (MBMC), Ward 3 & 4.',
                  'Geo-verified Ward Coverage',
                  'Jurisdiction'
                )
              }
            >
              <span className={styles.locationIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <span>Mira Bhayandar</span>
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
              <span className={styles.notifBadgeSmall}>3</span>
            </Link>

            {/* User Profile */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={styles.userProfileTrigger}
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                aria-expanded={profileMenuOpen}
                aria-label="Toggle user profile menu"
                suppressHydrationWarning
              >
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.name}
                    width={36}
                    height={36}
                    className={styles.userAvatar}
                  />
                ) : (
                  <div className={styles.initialsAvatar} suppressHydrationWarning>{initials}</div>
                )}
                <div className={styles.userInfo} suppressHydrationWarning>
                  <span className={styles.userName} suppressHydrationWarning>{user?.name || 'Citizen'}</span>
                  <span className={styles.userRole}>Citizen</span>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {profileMenuOpen && (
                <div className={styles.profileMenuDropdown}>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      openNotice(
                        'Verified Profile',
                        `Logged in as ${user?.name} (${user?.email}). Location: Mira Bhayandar.`
                      );
                    }}
                  >
                    Citizen Profile
                  </button>
                  <button
                    type="button"
                    className={`${styles.menuItem} ${styles.menuItemDanger}`}
                    onClick={() => {
                      logout();
                      router.push('/auth/login');
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ============================================================
            PAGE BODY
            ============================================================ */}
        <main className={styles.pageBody}>
          {/* City Banner Header */}
          <div className={styles.communityBannerCard}>
            <div className={styles.bannerContent}>
              <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                <Link href="/citizen" className={styles.crumbLink}>
                  Dashboard
                </Link>
                <span className={styles.crumbSep}>&gt;</span>
                <span className={styles.crumbActive}>Community</span>
              </nav>
              <h1 className={styles.bannerTitle}>Community</h1>
              <p className={styles.bannerSubtitle}>
                Discuss local issues, share suggestions and work together for a better Mira Bhayandar.
              </p>
            </div>

            <div className={styles.bannerImageContainer}>
              <Image
                src="/images/community/banner.png"
                alt="Stronger Communities Cleaner Cities"
                width={518}
                height={80}
                className={styles.bannerImg}
                priority
              />
            </div>
          </div>

          {/* Category Tabs & Create Post Action */}
          <div className={styles.tabActionBar}>
            <div className={styles.tabList} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'all'}
                className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Posts
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'discussion'}
                className={`${styles.tabBtn} ${activeTab === 'discussion' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('discussion')}
              >
                Discussions
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'suggestion'}
                className={`${styles.tabBtn} ${activeTab === 'suggestion' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('suggestion')}
              >
                Suggestions
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'success_story'}
                className={`${styles.tabBtn} ${activeTab === 'success_story' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('success_story')}
              >
                Success Stories
              </button>
            </div>

            <button
              type="button"
              className={styles.createPostBtn}
              onClick={() => setCreateModalOpen(true)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Create a Post</span>
            </button>
          </div>

          {/* Filter Feedback Bar if a topic filter or search is active */}
          {(activeTopic !== 'all' || searchQuery.trim()) && (
            <div className={styles.filterActiveBar}>
              <div>
                Showing results for{' '}
                {activeTopic !== 'all' && (
                  <strong>Topic: {TOPIC_METADATA.find((t) => t.id === activeTopic)?.label || activeTopic} </strong>
                )}
                {searchQuery.trim() && (
                  <span>Search: &ldquo;{searchQuery}&rdquo;</span>
                )}
              </div>
              <button
                type="button"
                className={styles.clearFilterBtn}
                onClick={() => {
                  setActiveTopic('all');
                  setSearchQuery('');
                }}
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Two-Column Grid: Left Feed vs Right Panels */}
          <div className={styles.communityGrid}>
            {/* ========================================================
                LEFT COLUMN: COMMUNITY FEED
                ======================================================== */}
            <section className={styles.feedColumn} aria-label="Community Posts Feed">
              {filteredPosts.length === 0 ? (
                <div className={styles.emptyFeedCard}>
                  <div className={styles.emptyFeedIcon}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <h3 className={styles.emptyFeedHeading}>Be the first to start a conversation.</h3>
                  <p className={styles.emptyFeedText}>
                    Share a local issue, suggest an improvement, or celebrate a positive change in your neighbourhood.
                  </p>
                  <button
                    type="button"
                    className={styles.createPostBtn}
                    onClick={() => setCreateModalOpen(true)}
                  >
                    Create a Post +
                  </button>
                </div>
              ) : (
                filteredPosts.map((post) => {
                  const isLiked = user ? post.likedBy.includes(user.id) : false;
                  const isSaved = user ? post.savedBy.includes(user.id) : false;

                  return (
                    <article key={post.id} className={styles.postCard} id={post.id}>
                      {/* Post Header */}
                      <div className={styles.postHeader}>
                        <div className={styles.postAuthorGroup}>
                          <div
                            className={`${styles.postAuthorAvatar} ${
                              post.type === 'discussion'
                                ? styles.authorBlue
                                : post.type === 'suggestion'
                                ? styles.authorPurple
                                : styles.authorTeal
                            }`}
                          >
                            {post.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div className={styles.postAuthorMeta}>
                            <span className={styles.authorName}>{post.authorName}</span>
                            <span className={styles.postSubmeta}>
                              {post.createdAt} &bull; {post.location}
                            </span>
                          </div>
                        </div>

                        <div className={styles.postHeaderActions}>
                          {post.type === 'discussion' && (
                            <span className={styles.badgeDiscussion}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                              </svg>
                              Discussion
                            </span>
                          )}
                          {post.type === 'suggestion' && (
                            <span className={styles.badgeSuggestion}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 18h6" />
                                <path d="M10 22h4" />
                                <path d="M12 2v1" />
                                <path d="M12 6a5 5 0 0 1 5 5c0 2-1 3-2 4a2 2 0 0 0-1 2H10a2 2 0 0 0-1-2c-1-1-2-2-2-4a5 5 0 0 1 5-5z" />
                              </svg>
                              Suggestion
                            </span>
                          )}
                          {post.type === 'success_story' && (
                            <span className={styles.badgeSuccessStory}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                              Success Story
                            </span>
                          )}

                          <button
                            type="button"
                            className={styles.moreBtn}
                            onClick={() =>
                              openNotice(
                                'Post Options',
                                `Post #${post.id} by ${post.authorName}. Category: ${post.category}.`
                              )
                            }
                            aria-label="More post options"
                          >
                            &bull;&bull;&bull;
                          </button>
                        </div>
                      </div>

                      {/* Post Body: Text + Optional Thumbnail */}
                      <div className={styles.postBody}>
                        <div className={styles.postTextColumn}>
                          <h2 className={styles.postTitle}>{post.title}</h2>
                          <p className={styles.postDescription}>{post.content}</p>
                        </div>

                        {post.imageUrl && (
                          <div className={styles.postThumbWrapper}>
                            <Image
                              src={post.imageUrl}
                              alt={post.title}
                              fill
                              sizes="150px"
                              className={styles.postThumb}
                            />
                          </div>
                        )}
                      </div>

                      {/* Post Actions Footer */}
                      <div className={styles.postFooter}>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${isLiked ? styles.actionBtnLiked : ''}`}
                          onClick={() => handleLike(post.id)}
                          aria-label={`Like this post, currently ${post.likesCount} likes`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                          </svg>
                          <span>{post.likesCount}</span>
                        </button>

                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => openComments(post)}
                          aria-label={`View comments, currently ${post.commentsCount} comments`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          <span>{post.commentsCount}</span>
                        </button>

                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => handleShare(post)}
                          aria-label="Share post link"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                          </svg>
                          <span>Share</span>
                        </button>

                        <button
                          type="button"
                          className={`${styles.actionBtn} ${isSaved ? styles.actionBtnSaved : ''}`}
                          onClick={() => handleSave(post.id)}
                          aria-label={isSaved ? 'Saved to bookmarks' : 'Save post'}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                          <span>Save</span>
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </section>

            {/* ========================================================
                RIGHT COLUMN: TOPICS, EVENTS & CONTRIBUTORS
                ======================================================== */}
            <aside className={styles.rightColumn}>
              {/* 1. Community Topics Card */}
              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitleGroup}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#00e599" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                    <h2 className={styles.panelTitle}>Community Topics</h2>
                  </div>
                  <button
                    type="button"
                    className={styles.viewAllBtn}
                    onClick={() => setActiveTopic('all')}
                  >
                    View all &rarr;
                  </button>
                </div>

                <div className={styles.topicsGrid}>
                  {TOPIC_METADATA.map((topic) => {
                    const isSelected = activeTopic === topic.id;
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        className={`${styles.topicItemBtn} ${isSelected ? styles.topicItemBtnActive : ''}`}
                        onClick={() => setActiveTopic(isSelected ? 'all' : topic.id)}
                        aria-pressed={isSelected}
                      >
                        <div className={styles.topicItemLeft}>
                          <span className={styles.topicIconBadge}>
                            {topic.id === 'roads' && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 19L8 5h8l4 14" />
                                <line x1="12" y1="9" x2="12" y2="15" />
                              </svg>
                            )}
                            {topic.id === 'water' && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                              </svg>
                            )}
                            {topic.id === 'waste' && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            )}
                            {topic.id === 'streetlights' && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="2" x2="12" y2="6" />
                                <circle cx="12" cy="14" r="4" />
                              </svg>
                            )}
                            {topic.id === 'drainage' && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <line x1="3" y1="9" x2="21" y2="9" />
                                <line x1="3" y1="15" x2="21" y2="15" />
                                <line x1="9" y1="3" x2="9" y2="21" />
                                <line x1="15" y1="3" x2="15" y2="21" />
                              </svg>
                            )}
                            {topic.id === 'parks' && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L7 10h3l-4 7h6v5h2v-5h6l-4-7h3z" />
                              </svg>
                            )}
                            {topic.id === 'transport' && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="16" rx="2" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                            )}
                            {topic.id === 'other' && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="19" cy="12" r="1" />
                                <circle cx="5" cy="12" r="1" />
                              </svg>
                            )}
                          </span>
                          <span className={styles.topicLabel}>{topic.label}</span>
                        </div>
                        <div className={styles.topicItemRight}>
                          <span className={styles.topicCount}>{topic.defaultCount}</span>
                          <span>&gt;</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Upcoming Community Events Card */}
              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitleGroup}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#00e599" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <h2 className={styles.panelTitle}>Upcoming Community Events</h2>
                  </div>
                  <button
                    type="button"
                    className={styles.viewAllBtn}
                    onClick={() =>
                      openNotice(
                        'Mira Bhayandar Civic Events',
                        'MBMC Ward Volunteer Schedule and Public Consultation Calendar.'
                      )
                    }
                  >
                    View all &rarr;
                  </button>
                </div>

                <div className={styles.eventsList}>
                  {events.map((ev) => {
                    const isJoined = user ? ev.registeredUsers.includes(user.id) : false;
                    return (
                      <div key={ev.id} className={styles.eventCard}>
                        <div className={styles.eventLeft}>
                          <div className={styles.eventDateBadge}>
                            <span className={styles.eventMonth}>{ev.dateLabel.month}</span>
                            <span className={styles.eventDay}>{ev.dateLabel.day}</span>
                          </div>

                          <div className={styles.eventInfo}>
                            <span className={styles.eventTitle}>{ev.title}</span>
                            <span className={styles.eventSubtitle}>&bull; {ev.subtitle}</span>
                            <div className={styles.eventMetaLine}>
                              <span className={styles.eventMetaItem}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                                {ev.time}
                              </span>
                              <span className={styles.eventMetaItem}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                  <circle cx="12" cy="10" r="3" />
                                </svg>
                                {ev.location}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`${styles.joinEventBtn} ${isJoined ? styles.joinedEventBtn : ''}`}
                          onClick={() => handleJoinEvent(ev.id)}
                        >
                          {isJoined ? 'Joined \u2713' : 'Join'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Top Contributors Card */}
              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitleGroup}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#00e599" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <h2 className={styles.panelTitle}>Top Contributors</h2>
                  </div>
                  <button
                    type="button"
                    className={styles.viewAllBtn}
                    onClick={() =>
                      openNotice(
                        'Community Leaderboard',
                        'Top citizen contributors are recognized each quarter for verifying civic issues and coordinating local cleanup efforts.'
                      )
                    }
                  >
                    View all &rarr;
                  </button>
                </div>

                <div className={styles.contributorsList}>
                  {contributors.map((contrib) => (
                    <div
                      key={contrib.id}
                      className={styles.contributorRow}
                      onClick={() =>
                        openNotice(
                          `${contrib.name} — Civic Profile`,
                          `Active citizen in Mira Bhayandar with ${contrib.postsCount} verified community contributions.`
                        )
                      }
                    >
                      <div className={styles.contributorLeft}>
                        <div className={styles.rankIconWrapper}>
                          {contrib.rank === 1 && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5">
                              <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
                            </svg>
                          )}
                          {contrib.rank === 2 && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#94a3b8" stroke="#64748b" strokeWidth="1.5">
                              <polygon points="12 2 19 21 12 17 5 21 12 2" />
                            </svg>
                          )}
                          {contrib.rank === 3 && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#d97706" stroke="#b45309" strokeWidth="1.5">
                              <polygon points="12 2 19 21 12 17 5 21 12 2" />
                            </svg>
                          )}
                        </div>

                        <Image
                          src={contrib.avatarUrl || '/images/dashboard/user-avatar@2x.jpg'}
                          alt={contrib.name}
                          width={32}
                          height={32}
                          className={styles.contributorAvatar}
                        />

                        <div className={styles.contributorMeta}>
                          <span className={styles.contributorName}>{contrib.name}</span>
                          <span className={styles.contributorPosts}>{contrib.postsCount} posts</span>
                        </div>
                      </div>

                      <div className={styles.contributorRight}>
                        {contrib.badge && (
                          <span className={styles.topContributorBadge}>{contrib.badge}</span>
                        )}
                        <span style={{ color: '#64748b', fontSize: 13 }}>&gt;</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>

      {/* ============================================================
          CREATE POST MODAL
          ============================================================ */}
      {createModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setCreateModalOpen(false)}>
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-post-title"
          >
            <div className={styles.modalHeader}>
              <h2 id="create-post-title" className={styles.modalTitle}>Create Community Post</h2>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setCreateModalOpen(false)}
                aria-label="Close modal"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreatePost}>
              <div className={styles.modalBody}>
                {formError && (
                  <div style={{ color: '#f87171', fontSize: 13, background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: 8 }}>
                    {formError}
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Post Type</label>
                  <div className={styles.typeRadioGroup}>
                    <button
                      type="button"
                      className={`${styles.typeRadioBtn} ${newPostType === 'discussion' ? styles.typeRadioBtnActive : ''}`}
                      onClick={() => setNewPostType('discussion')}
                    >
                      Discussion
                    </button>
                    <button
                      type="button"
                      className={`${styles.typeRadioBtn} ${newPostType === 'suggestion' ? styles.typeRadioBtnActive : ''}`}
                      onClick={() => setNewPostType('suggestion')}
                    >
                      Suggestion
                    </button>
                    <button
                      type="button"
                      className={`${styles.typeRadioBtn} ${newPostType === 'success_story' ? styles.typeRadioBtnActive : ''}`}
                      onClick={() => setNewPostType('success_story')}
                    >
                      Success Story
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="post-title" className={styles.formLabel}>Title</label>
                  <input
                    id="post-title"
                    type="text"
                    className={styles.formInput}
                    placeholder="E.g., Frequent waterlogging near Kanakia Road during monsoon"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    maxLength={120}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className={styles.formGroup}>
                    <label htmlFor="post-category" className={styles.formLabel}>Civic Category</label>
                    <select
                      id="post-category"
                      className={styles.formSelect}
                      value={newPostCategory}
                      onChange={(e) => setNewPostCategory(e.target.value as CivicTopic)}
                    >
                      {TOPIC_METADATA.map((topic) => (
                        <option key={topic.id} value={topic.id}>
                          {topic.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="post-location" className={styles.formLabel}>Location / Ward</label>
                    <input
                      id="post-location"
                      type="text"
                      className={styles.formInput}
                      placeholder="E.g. Near Kanakia Road"
                      value={newPostLocation}
                      onChange={(e) => setNewPostLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="post-content" className={styles.formLabel}>Description</label>
                  <textarea
                    id="post-content"
                    className={styles.formTextarea}
                    placeholder="Describe the issue, improvement proposal, or positive change..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="post-image" className={styles.formLabel}>Optional Image URL</label>
                  <input
                    id="post-image"
                    type="text"
                    className={styles.formInput}
                    placeholder="/images/community/waterlogging.png or public image URL"
                    value={newPostImageUrl}
                    onChange={(e) => setNewPostImageUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Publish Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          COMMENTS MODAL / DRAWER
          ============================================================ */}
      {commentModalPost && (
        <div className={styles.modalBackdrop} onClick={() => setCommentModalPost(null)}>
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="comments-title"
          >
            <div className={styles.modalHeader}>
              <h2 id="comments-title" className={styles.modalTitle}>
                Comments ({commentModalPost.comments?.length || 0})
              </h2>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setCommentModalPost(null)}
                aria-label="Close comments"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className={styles.modalBody}>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                  {commentModalPost.title}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  By {commentModalPost.authorName} &bull; {commentModalPost.location}
                </div>
              </div>

              <div className={styles.commentsContainer}>
                {(!commentModalPost.comments || commentModalPost.comments.length === 0) ? (
                  <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                    No comments yet. Start the conversation.
                  </p>
                ) : (
                  commentModalPost.comments.map((comment) => (
                    <div key={comment.id} className={styles.commentItem}>
                      <div className={`${styles.postAuthorAvatar} ${styles.authorBlue}`} style={{ width: 30, height: 30, fontSize: 12 }}>
                        {comment.authorName.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.commentBody}>
                        <div className={styles.commentAuthorLine}>
                          <span className={styles.commentAuthorName}>{comment.authorName}</span>
                          <span className={styles.commentTime}>{comment.createdAt}</span>
                        </div>
                        <p className={styles.commentText}>{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSubmitComment} className={styles.addCommentForm}>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Write a constructive response or suggestion..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  rows={2}
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className={styles.submitBtn}>
                    Post Comment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className={styles.toastNotification} role="status">
          {toastMessage}
        </div>
      )}

      {/* Shared Notice Modal */}
      <NoticeModal
        isOpen={notice.isOpen}
        title={notice.title}
        message={notice.message}
        stageNote={notice.stageNote}
        badge={notice.badge}
        onClose={closeNotice}
      />
    </div>
  );
}
