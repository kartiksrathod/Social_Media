export const USERS = [
  {
    id: "user_1",
    name: "Sarah Wilson",
    handle: "@sarahw",
    avatar: "https://images.unsplash.com/photo-1701615004837-40d8573b6652?auto=format&fit=crop&w=150&h=150",
    bio: "Digital Artist & coffee enthusiast ☕ | Creating dreams one pixel at a time.",
    followers: "12.5K",
    following: "842",
    posts: 142
  },
  {
    id: "user_2",
    name: "Alex Chen",
    handle: "@alexc",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&h=150",
    bio: "Tech Writer @DailyTech | 📸 Photography on weekends",
    followers: "8.2K",
    following: "420",
    posts: 89
  },
  {
    id: "user_3",
    name: "Jordan Lee",
    handle: "@jlee_design",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150",
    bio: "Product Designer building the future of social.",
    followers: "24K",
    following: "1.2K",
    posts: 356
  }
];

export const POSTS = [
  {
    id: 1,
    user: USERS[0],
    content: "Just finished the new design system for our upcoming project! 🎨 It's amazing how much a consistent color palette changes the vibe. #design #uiux",
    image: "https://images.unsplash.com/photo-1690029670784-155329105e58?auto=format&fit=crop&w=800&q=80",
    likes: 245,
    comments: 42,
    shares: 12,
    timestamp: "2h ago"
  },
  {
    id: 2,
    user: USERS[1],
    content: "Coffee shop vibes this morning. ☕ writing the next big article on AI trends for 2025. Stay tuned!",
    image: null,
    likes: 89,
    comments: 15,
    shares: 4,
    timestamp: "5h ago"
  },
  {
    id: 3,
    user: USERS[2],
    content: "Exploring the city today. The architecture here is mind-blowing. 🏙️",
    image: "https://images.unsplash.com/photo-1644088379091-d574269d422f?auto=format&fit=crop&w=800&q=80",
    likes: 1204,
    comments: 156,
    shares: 89,
    timestamp: "1d ago"
  }
];

export const NOTIFICATIONS = [
  {
    id: 1,
    type: "like",
    user: USERS[1],
    content: "liked your post",
    timestamp: "10m ago"
  },
  {
    id: 2,
    type: "follow",
    user: USERS[2],
    content: "started following you",
    timestamp: "1h ago"
  },
  {
    id: 3,
    type: "comment",
    user: USERS[0],
    content: "commented: 'This looks amazing! 🔥'",
    timestamp: "3h ago"
  }
];
