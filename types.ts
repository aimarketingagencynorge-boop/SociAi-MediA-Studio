
export enum View {
  LANDING = 'LANDING',
  AUTH = 'AUTH',
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  PLANNER = 'PLANNER',
  ACADEMY = 'ACADEMY',
  SUBSCRIPTIONS = 'SUBSCRIPTIONS',
  CRM = 'CRM',
  DOCKING_BAY = 'DOCKING_BAY',
  SETTINGS = 'SETTINGS'
}

export interface SocialAsset {
  id: string;
  externalId: string;
  name: string;
  type: string;
  thumbnail?: string;
}

export interface Integration {
  id: string;
  provider: 'facebook' | 'instagram' | 'linkedin' | 'tiktok';
  connected: boolean;
  status: 'active' | 'expired' | 'none';
  assets: SocialAsset[];
  selectedAssetId?: string;
  expiresAt?: string;
}

export interface BrandProfile {
  name: string;
  industry: string;
  website?: string;
  email?: string;
  password?: string; 
  phone?: string;
  address?: string;
  targetAudience: string;
  tone: 'professional' | 'funny' | 'inspirational' | 'edgy';
  primaryColor: string;
  secondaryColor?: string;
  logoUrl?: string;
  styleReferenceUrls?: string[];
  analysisSummary?: string;
  autoAppendSignature: boolean;
  isAdmin?: boolean;
  // New knowledge base fields
  brandVoice?: string;
  businessDescription?: string;
  valueProposition?: string;
  // Added postIdeas to store AI-generated content suggestions from brand analysis
  postIdeas?: string[];
}

export type PostStatus = 'draft' | 'needs_review' | 'approved' | 'scheduled' | 'published';
export type MediaSource = 'ai_generated' | 'client_upload';

export interface ContentFormat {
  id: string;
  name: string;
  keyword: string;
  postsPerWeek: number;
  color: string;
}

export interface SocialPost {
  id: string;
  platform: 'facebook' | 'instagram' | 'linkedin' | 'tiktok';
  date: string;
  content: string;
  hashtags: string[];
  imageUrl?: string;
  videoUrl?: string; 
  status: PostStatus;
  mediaSource: MediaSource;
  format?: string; 
  // Fields for AI Image Pipeline traceability
  creativeBrief?: any;
  aiPrompt?: string;
}

export interface AnalyticsData {
  engagement: number;
  growth: number;
  reach: number;
  date: string;
}

export interface Notification {
  id: string;
  type: 'insight' | 'trend' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
