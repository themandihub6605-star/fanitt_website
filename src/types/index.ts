export interface NavLink {
  label: string;
  href: string;
}

export interface Category {
  label: string;
  icon: string; // lucide-react icon name, resolved in the component
}

export interface Creator {
  name: string;
  specialty: string;
  seed: string;
  followers: string;
  slug?: string;
  bio?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  location?: string;
  socials?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    youtube?: string;
  };
}

export interface Campaign {
  id: string;
  title: string;
  brandName: string;
  brandSeed: string;
  category: string;
  budget: string;
  duration: string;
  location: string;
  creatorType: string;
  description: string;
  postedDaysAgo: number;
  applicants: number;
}

export interface LiveSession {
  title: string;
  hook: string;
  creatorSeed: string;
  creatorName: string;
  creatorTag: string;
  category: string;
  day: string;
  time: string;
  duration: string;
  price: string;
  free: boolean;
  stat: string;
  formatBadge: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  seed: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}
