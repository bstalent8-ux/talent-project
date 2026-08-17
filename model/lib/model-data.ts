export interface ModelData {
  id: string;
  name: string;
  nameEn: string;
  title: string;
  titleEn: string;
  location: string;
  locationEn: string;
  isVerified: boolean;
  isGoldModel: boolean;
  isTopRated: boolean;
  rating: number;
  reviewsCount: number;
  cancellationRate: string;
  responseTime: string;
  responseRate: string;
  projectsCount: number;
  avgProjectPrice: number;
  currency: string;
  bio: string;
  social: {
    instagram: string;
    tiktok: string;
    facebook: string;
    website: string;
  };
  tags: string[];
  mainImage: string;
  portfolio: {
    id: string;
    title: string;
    category: string;
    image: string;
    badge?: string;
    aspect: string;
  }[];
  shoots: {
    brand: string;
    type: string;
    date: string;
    verified: boolean;
    logoText: string;
  }[];
  verifiedWork: {
    brand: string;
    type: string;
    date: string;
    verified: boolean;
  }[];
  packages: {
    id: string;
    name: string;
    price: number;
    popular?: boolean;
    features: string[];
  }[];
  reviews: {
    author: string;
    brand: string;
    date: string;
    rating: number;
    comment: string;
    tags: string[];
  }[];
  timeline: {
    title: string;
    date: string;
    highlight?: boolean;
  }[];
  performance: {
    label: string;
    value: string;
    pct: number;
    color?: string;
  }[];
  matchScore: {
    score: number;
    factors: {
      name: string;
      pct: string;
      matched: boolean;
    }[];
  };
  aiInsights: string[];
  weeklyAvailability: {
    day: string;
    date: number;
    available: boolean;
  }[];
  quickBio: {
    label: string;
    value: string;
  }[];
  recentActivity: {
    title: string;
    time: string;
    type: 'photo' | 'calendar' | 'review';
    images?: string[];
  }[];
}

export const MAYA_DATA: ModelData = {
  id: 'maya-khaled-01',
  name: 'مايا خالد',
  nameEn: 'Maya Khaled',
  title: 'موديل احترافي',
  titleEn: 'Professional Model',
  location: 'القاهرة، مصر',
  locationEn: 'Cairo, Egypt',
  isVerified: true,
  isGoldModel: true,
  isTopRated: true,
  rating: 4.9,
  reviewsCount: 128,
  cancellationRate: '0%',
  responseTime: '~1.8 ساعة',
  responseRate: '95%',
  projectsCount: 42,
  avgProjectPrice: 5200,
  currency: 'EGP',
  bio: 'موديل احترافي بخبرة في التصوير التجاري والأزياء والإعلانات. أعمل مع براندات راقية وأسلم دائماً في الوقت المحدد.',
  social: {
    instagram: '24.8K',
    tiktok: '8.2K',
    facebook: '12K',
    website: 'maya-khaled.talents.me',
  },
  tags: ['Fashion', 'Commercial', 'Beauty', 'TVC', 'Runway'],
  mainImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
  portfolio: [
    {
      id: 'p1',
      title: 'Editorial +',
      category: 'Editorial',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
      badge: 'Editorial +',
      aspect: 'tall',
    },
    {
      id: 'p2',
      title: 'Beauty',
      category: 'Beauty',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80',
      badge: 'Beauty',
      aspect: 'wide',
    },
    {
      id: 'p3',
      title: 'Commercial',
      category: 'Commercial',
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=80',
      badge: 'Commercial',
      aspect: 'square',
    },
    {
      id: 'p4',
      title: 'Runway',
      category: 'Runway',
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
      badge: 'Runway',
      aspect: 'square',
    },
    {
      id: 'p5',
      title: 'Campaign',
      category: 'Campaign',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
      badge: 'Campaign',
      aspect: 'square',
    },
    {
      id: 'p6',
      title: 'Lifestyle',
      category: 'Lifestyle',
      image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
      badge: 'Lifestyle',
      aspect: 'square',
    },
    {
      id: 'p7',
      title: 'Street Style',
      category: 'Street Style',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
      badge: 'Street Style',
      aspect: 'square',
    },
  ],
  shoots: [
    {
      brand: 'ZARA',
      type: 'Fashion Campaign',
      date: 'يونيو 2026',
      verified: true,
      logoText: 'ZARA',
    },
    {
      brand: "L'ORÉAL",
      type: 'TVC Commercial',
      date: 'مايو 2026',
      verified: true,
      logoText: "L'ORÉAL",
    },
    {
      brand: 'GLOW',
      type: 'Beauty Campaign',
      date: 'أبريل 2026',
      verified: true,
      logoText: 'GLOW',
    },
    {
      brand: 'Fashion Shoot',
      type: 'Studio Series',
      date: 'مارس 2026',
      verified: true,
      logoText: 'TALENTS',
    },
  ],
  verifiedWork: [
    {
      brand: "L'AZUR",
      type: 'Beachwear Campaign',
      date: 'يونيو 2026',
      verified: true,
    },
    {
      brand: 'TechStore',
      type: 'UGC Content',
      date: 'مايو 2026',
      verified: true,
    },
    {
      brand: 'BeBold',
      type: 'Fitness Wear',
      date: 'أبريل 2026',
      verified: true,
    },
  ],
  packages: [
    {
      id: 'starter',
      name: 'Starter',
      price: 2500,
      popular: false,
      features: [
        '3 ساعات تصوير',
        'Look واحد',
        '10 صور معدلة',
        'استخدام تجاري أساسي',
      ],
    },
    {
      id: 'growth',
      name: 'Growth',
      price: 5500,
      popular: true,
      features: [
        '6 ساعات تصوير',
        '3 Looks',
        '20 صورة معدلة',
        'فيديو قصير (15 ثانية)',
        'استخدام تجاري كامل',
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 9000,
      popular: false,
      features: [
        'يوم كامل تصوير',
        '5 Looks',
        '40 صورة معدلة',
        'فيديو قصير + BTS',
        'استخدام تجاري كامل',
      ],
    },
  ],
  reviews: [
    {
      author: 'سارة المهدي',
      brand: 'GLOW Beauty',
      date: '15 مايو 2026',
      rating: 5.0,
      comment: 'مايا رائعة جداً احترافية، ملتزمة بالمواعيد، والتعامل كان رائع',
      tags: ['جودة العمل', 'الالتزام بالمواعيد', 'احترافية عالية'],
    },
    {
      author: 'كريم الشريف',
      brand: 'TechStore Egypt',
      date: '28 أبريل 2026',
      rating: 5.0,
      comment: 'أداء مبهر أمام الكاميرا وسرعة في استيعاب التوجيهات الإخراجية. نوصي بها بشدة!',
      tags: ['سرعة استجابة', 'تفاعل ممتاز', 'حضور سينمائي'],
    },
    {
      author: 'مها زيدان',
      brand: "L'AZUR Studios",
      date: '10 أبريل 2026',
      rating: 4.9,
      comment: 'من أفضل الموديلات اللي اشتغلنا معاهم في حملة الصيف. مرونة وطاقة إيجابية عالية.',
      tags: ['مرونة تصوير', 'أزياء راقية'],
    },
  ],
  timeline: [
    { title: 'تم الانضمام إلى Talents', date: 'يونيو 2026', highlight: true },
    { title: '8 مشاريع مع TechStore', date: 'مايو 2026', highlight: false },
    { title: 'Glow Beauty Campaign', date: 'أبريل 2026', highlight: false },
    { title: 'الحصول على Gold Model', date: 'مارس 2026', highlight: true },
    { title: 'Top Rated Model', date: 'فبراير 2026', highlight: true },
  ],
  performance: [
    { label: 'Repeat Clients', value: '82%', pct: 82, color: '#10b981' },
    { label: 'Cancellation Rate', value: '0%', pct: 0, color: '#10b981' },
    { label: 'On-time Delivery', value: '100%', pct: 100, color: '#10b981' },
    { label: 'No Show Rate', value: '0%', pct: 0, color: '#10b981' },
    { label: 'Late Arrival Rate', value: '1%', pct: 1, color: '#e5a93c' },
    { label: 'Response Rate', value: '98%', pct: 98, color: '#10b981' },
  ],
  matchScore: {
    score: 92,
    factors: [
      { name: 'Fashion Model', pct: '+30%', matched: true },
      { name: 'القاهرة', pct: '+15%', matched: true },
      { name: 'خبرة في التصوير التجاري', pct: '+20%', matched: true },
      { name: 'متاحة في التاريخ المطلوب', pct: '+15%', matched: true },
      { name: 'تقييمات ممتازة', pct: '+10%', matched: true },
      { name: 'سرعة الرد عالية', pct: '+5%', matched: true },
      { name: 'ملف شخصي مكتمل', pct: '+5%', matched: true },
    ],
  },
  aiInsights: [
    'أنت ضمن أفضل 7% من الموديلات في فئة Fashion Model في مصر',
    'نوصيك بإضافة محتوى خارجي (Outdoor) لزيادة فرصك في الحملات الخارجية',
    'أوقاتك المتاحة في نهاية هذا الأسبوع عالية الطلب. فكّر في تعديل توافرك',
  ],
  weeklyAvailability: [
    { day: 'الأحد', date: 11, available: true },
    { day: 'الإثنين', date: 12, available: false },
    { day: 'الثلاثاء', date: 13, available: true },
    { day: 'الأربعاء', date: 14, available: true },
    { day: 'الخميس', date: 15, available: true },
    { day: 'الجمعة', date: 16, available: false },
    { day: 'السبت', date: 17, available: true },
  ],
  quickBio: [
    { label: 'اللغة العربية', value: 'أصيل' },
    { label: 'اللغة الإنجليزية', value: 'جيد جداً' },
    { label: 'الطول', value: '174 سم' },
    { label: 'المقاسات', value: '90 / 60 / 90' },
    { label: 'لون الشعر', value: 'بني غامق' },
    { label: 'لون العين', value: 'بني' },
  ],
  recentActivity: [
    {
      title: 'تم إضافة 5 صور جديدة',
      time: 'منذ ساعتين',
      type: 'photo',
      images: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
      ],
    },
    {
      title: 'تم تحديث التوفر',
      time: 'منذ 5 ساعات',
      type: 'calendar',
    },
    {
      title: "تم تقييم مشروع L'Oréal Paris",
      time: 'منذ يومين',
      type: 'review',
    },
  ],
};
