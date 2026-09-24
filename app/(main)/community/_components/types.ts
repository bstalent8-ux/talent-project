import type { Question } from "./CommunityClient";

export interface CommunityAuthor {
  id: string;
  full_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  city: string | null;
  role?: string;
}

export interface JobPostLite {
  id: string;
  brand_id: string;
  title: string;
  description: string | null;
  category: string | null;
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  slots: number;
  status: string;
  created_at: string;
  brand: CommunityAuthor | null;
}

export interface CommunityOfferPost {
  id: string;
  user_id: string;
  post_type: "offer";
  title: string;
  content: string | null;
  price: number | null;
  category: string | null;
  media_url: string | null;
  status: string;
  expires_at: string | null;
  created_at: string;
  author: CommunityAuthor | null;
}

// A single merged, sortable feed — questions stay in their own shape
// (CommunityFeed's existing question-card JSX is untouched), jobs/offers get
// a shared lighter card. Stories are deliberately NOT part of this feed —
// they live only in the story bar, same as every other story UI.
export type FeedItem =
  | { kind: "question"; id: string; created_at: string; question: Question }
  | { kind: "job"; id: string; created_at: string; job: JobPostLite }
  | { kind: "offer"; id: string; created_at: string; offer: CommunityOfferPost };
