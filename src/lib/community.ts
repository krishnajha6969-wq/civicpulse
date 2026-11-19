/**
 * CivicPulse — Community Service & Data Models
 *
 * Provides persistent client storage, CRUD operations, reaction toggles,
 * comments, event registrations, and metrics for the Citizen Community Portal.
 */

export type PostType = 'all' | 'discussion' | 'suggestion' | 'success_story';

export type CivicTopic =
  | 'all'
  | 'roads'
  | 'water'
  | 'waste'
  | 'streetlights'
  | 'drainage'
  | 'parks'
  | 'transport'
  | 'other';

export interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  type: 'discussion' | 'suggestion' | 'success_story';
  category: CivicTopic;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  location: string;
  imageUrl?: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  likedBy: string[];
  savedBy: string[];
  comments: CommunityComment[];
}

export interface CommunityEvent {
  id: string;
  title: string;
  subtitle: string;
  dateLabel: { month: string; day: string };
  dateIso: string;
  time: string;
  location: string;
  registeredUsers: string[];
  capacity?: number;
}

export interface Contributor {
  id: string;
  name: string;
  avatarUrl?: string;
  postsCount: number;
  badge?: string;
  rank: number;
}

const POSTS_KEY = 'civicpulse_community_posts';
const EVENTS_KEY = 'civicpulse_community_events';

// Default seed data accurately reflecting the approved CivicPulse reference design
const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 'post-waterlogging',
    title: 'Frequent waterlogging near Kanakia Road during monsoon',
    content:
      'Every year the same stretch near Kanakia Road gets waterlogged. Traffic comes to a halt and it becomes very difficult for residents. Has anyone found a long-term solution for this? Would love to hear suggestions from the community.',
    type: 'discussion',
    category: 'drainage',
    authorId: 'usr_aarav_sharma',
    authorName: 'Aarav Sharma',
    location: 'Near Kanakia Road',
    imageUrl: '/images/community/waterlogging.png',
    createdAt: '2 hours ago',
    likesCount: 12,
    commentsCount: 8,
    likedBy: [],
    savedBy: [],
    comments: [
      {
        id: 'c-1',
        postId: 'post-waterlogging',
        authorId: 'usr_priya_nair',
        authorName: 'Priya Nair',
        content:
          'We raised this during the Ward 4 grievance review. The municipal contractor has marked the culvert clearing for next week.',
        createdAt: '1 hour ago',
      },
      {
        id: 'c-2',
        postId: 'post-waterlogging',
        authorId: 'usr_rahul_verma',
        authorName: 'Rahul Verma',
        content:
          'Good to know! Let’s make sure we track the ticket number on CivicPulse so the status is public.',
        createdAt: '45 minutes ago',
      },
    ],
  },
  {
    id: 'post-dustbins',
    title: 'More dustbins required in Vardhaman Park',
    content:
      'There are not enough dustbins inside Vardhaman Park. During weekends the park gets very crowded and garbage is often seen on the ground. Requesting the civic authorities to install more dustbins.',
    type: 'suggestion',
    category: 'waste',
    authorId: 'usr_priya_nair',
    authorName: 'Priya Nair',
    location: 'Near Mira Road (E)',
    imageUrl: '/images/community/dustbins.png',
    createdAt: '5 hours ago',
    likesCount: 18,
    commentsCount: 6,
    likedBy: [],
    savedBy: [],
    comments: [
      {
        id: 'c-3',
        postId: 'post-dustbins',
        authorId: 'usr_rohan_mehta',
        authorName: 'Rohan Mehta',
        content:
          'Strongly agree! We also need separate organic and dry segregation bins near the children’s playground area.',
        createdAt: '3 hours ago',
      },
      {
        id: 'c-4',
        postId: 'post-dustbins',
        authorId: 'usr_aarav_sharma',
        authorName: 'Aarav Sharma',
        content:
          'Upvoted! Cleanliness drives on Sunday mornings would also help raise visitor awareness.',
        createdAt: '2 hours ago',
      },
    ],
  },
  {
    id: 'post-streetlight',
    title: 'Streetlight issue resolved within 3 days!',
    content:
      'I had reported a non-working streetlight near Station Road and it was fixed within 3 days. Really appreciate the quick action by the ward team. CivicPulse is making a real difference!',
    type: 'success_story',
    category: 'streetlights',
    authorId: 'usr_rahul_verma',
    authorName: 'Rahul Verma',
    location: 'Near Station Road',
    imageUrl: '/images/community/streetlight.png',
    createdAt: '1 day ago',
    likesCount: 25,
    commentsCount: 4,
    likedBy: [],
    savedBy: [],
    comments: [
      {
        id: 'c-5',
        postId: 'post-streetlight',
        authorId: 'usr_priya_nair',
        authorName: 'Priya Nair',
        content:
          'Excellent! Great to see MBMC responding so swiftly through the portal verification process.',
        createdAt: '18 hours ago',
      },
    ],
  },
];

const INITIAL_EVENTS: CommunityEvent[] = [
  {
    id: 'event-clean-drive',
    title: 'Clean Mira Bhayandar Drive',
    subtitle: 'Ward 5 Community Event',
    dateLabel: { month: 'DEC', day: '20' },
    dateIso: '2026-12-20T09:00:00.000Z',
    time: '9:00 AM – 12:00 PM',
    location: 'Vardhaman Park',
    registeredUsers: [],
  },
  {
    id: 'event-feedback-meeting',
    title: 'Citizen Feedback Meeting',
    subtitle: 'Ward 3 Open Discussion',
    dateLabel: { month: 'JAN', day: '12' },
    dateIso: '2027-01-12T17:00:00.000Z',
    time: '5:00 PM – 7:00 PM',
    location: 'Mira Road (E) Community Hall',
    registeredUsers: [],
  },
];

export const TOPIC_METADATA: {
  id: CivicTopic;
  label: string;
  icon: string;
  defaultCount: number;
}[] = [
  { id: 'roads', label: 'Roads', icon: 'roads', defaultCount: 124 },
  { id: 'water', label: 'Water Supply', icon: 'water', defaultCount: 98 },
  { id: 'waste', label: 'Waste Management', icon: 'waste', defaultCount: 76 },
  { id: 'streetlights', label: 'Streetlights', icon: 'streetlights', defaultCount: 64 },
  { id: 'drainage', label: 'Drainage', icon: 'drainage', defaultCount: 52 },
  { id: 'parks', label: 'Parks & Public Spaces', icon: 'parks', defaultCount: 48 },
  { id: 'transport', label: 'Public Transport', icon: 'transport', defaultCount: 36 },
  { id: 'other', label: 'Other', icon: 'other', defaultCount: 21 },
];

function notifyCommunityUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('civicpulse_community_updated'));
  }
}

export function getCommunityPosts(
  categoryFilter?: CivicTopic,
  typeFilter?: PostType,
  searchQuery?: string
): CommunityPost[] {
  if (typeof window === 'undefined') {
    return INITIAL_POSTS;
  }

  let posts: CommunityPost[] = [];
  try {
    const raw = localStorage.getItem(POSTS_KEY);
    if (!raw) {
      localStorage.setItem(POSTS_KEY, JSON.stringify(INITIAL_POSTS));
      posts = INITIAL_POSTS;
    } else {
      posts = JSON.parse(raw);
    }
  } catch {
    posts = INITIAL_POSTS;
  }

  // Filter by post type tab
  if (typeFilter && typeFilter !== 'all') {
    posts = posts.filter((p) => p.type === typeFilter);
  }

  // Filter by civic topic category
  if (categoryFilter && categoryFilter !== 'all') {
    posts = posts.filter((p) => p.category === categoryFilter);
  }

  // Filter by search query
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
    );
  }

  return posts;
}

export function createCommunityPost(
  postData: Omit<
    CommunityPost,
    'id' | 'createdAt' | 'likesCount' | 'commentsCount' | 'likedBy' | 'savedBy' | 'comments'
  >
): CommunityPost {
  const currentPosts = getCommunityPosts();
  const newPost: CommunityPost = {
    ...postData,
    id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: 'Just now',
    likesCount: 0,
    commentsCount: 0,
    likedBy: [],
    savedBy: [],
    comments: [],
  };

  const updated = [newPost, ...currentPosts];
  if (typeof window !== 'undefined') {
    localStorage.setItem(POSTS_KEY, JSON.stringify(updated));
    notifyCommunityUpdated();
  }

  return newPost;
}

export function toggleLikePost(postId: string, userId: string): CommunityPost[] {
  const posts = getCommunityPosts();
  const updated = posts.map((post) => {
    if (post.id === postId) {
      const alreadyLiked = post.likedBy.includes(userId);
      const newLikedBy = alreadyLiked
        ? post.likedBy.filter((id) => id !== userId)
        : [...post.likedBy, userId];

      const newLikesCount = Math.max(0, post.likesCount + (alreadyLiked ? -1 : 1));

      return {
        ...post,
        likedBy: newLikedBy,
        likesCount: newLikesCount,
      };
    }
    return post;
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(POSTS_KEY, JSON.stringify(updated));
    notifyCommunityUpdated();
  }

  return updated;
}

export function toggleSavePost(postId: string, userId: string): CommunityPost[] {
  const posts = getCommunityPosts();
  const updated = posts.map((post) => {
    if (post.id === postId) {
      const alreadySaved = post.savedBy.includes(userId);
      const newSavedBy = alreadySaved
        ? post.savedBy.filter((id) => id !== userId)
        : [...post.savedBy, userId];

      return {
        ...post,
        savedBy: newSavedBy,
      };
    }
    return post;
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(POSTS_KEY, JSON.stringify(updated));
    notifyCommunityUpdated();
  }

  return updated;
}

export function addCommentToPost(
  postId: string,
  author: { id: string; name: string; avatarUrl?: string },
  content: string
): CommunityPost | null {
  const posts = getCommunityPosts();
  let updatedPost: CommunityPost | null = null;

  const updated = posts.map((post) => {
    if (post.id === postId) {
      const newComment: CommunityComment = {
        id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        postId,
        authorId: author.id,
        authorName: author.name,
        authorAvatar: author.avatarUrl,
        content: content.trim(),
        createdAt: 'Just now',
      };

      const newComments = [...(post.comments || []), newComment];
      updatedPost = {
        ...post,
        comments: newComments,
        commentsCount: newComments.length,
      };
      return updatedPost;
    }
    return post;
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(POSTS_KEY, JSON.stringify(updated));
    notifyCommunityUpdated();
  }

  return updatedPost;
}

export function getCommunityEvents(): CommunityEvent[] {
  if (typeof window === 'undefined') {
    return INITIAL_EVENTS;
  }

  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) {
      localStorage.setItem(EVENTS_KEY, JSON.stringify(INITIAL_EVENTS));
      return INITIAL_EVENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EVENTS;
  }
}

export function toggleEventRegistration(eventId: string, userId: string): CommunityEvent[] {
  const events = getCommunityEvents();
  const updated = events.map((ev) => {
    if (ev.id === eventId) {
      const isRegistered = ev.registeredUsers.includes(userId);
      const newRegistered = isRegistered
        ? ev.registeredUsers.filter((id) => id !== userId)
        : [...ev.registeredUsers, userId];

      return {
        ...ev,
        registeredUsers: newRegistered,
      };
    }
    return ev;
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(updated));
    notifyCommunityUpdated();
  }

  return updated;
}

export function getTopContributors(currentUserId?: string): Contributor[] {
  // Base contributors matching the approved reference design
  return [
    {
      id: 'usr_priya_nair',
      name: 'Priya Nair',
      avatarUrl: '/images/dashboard/user-avatar@2x.jpg',
      postsCount: 32,
      badge: 'Top Contributor',
      rank: 1,
    },
    {
      id: 'usr_aarav_sharma',
      name: 'Aarav Sharma',
      avatarUrl: '/images/dashboard/user-avatar@2x.jpg',
      postsCount: 28,
      rank: 2,
    },
    {
      id: 'usr_rahul_verma',
      name: 'Rahul Verma',
      avatarUrl: '/images/dashboard/user-avatar@2x.jpg',
      postsCount: 25,
      rank: 3,
    },
  ];
}
