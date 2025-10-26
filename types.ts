
import type { GroundingChunk } from '@google/genai';

export type Tab = 'plan' | 'calendar' | 'multi-post' | 'writer' | 'image' | 'generate' | 'video' | 'local' | 'upscale';

export type Platform = 'Facebook' | 'Instagram' | 'LinkedIn' | 'Google Business Profile';

export interface PostIdea {
  platform: 'Instagram' | 'TikTok' | 'X' | 'Facebook' | 'LinkedIn';
  prompt: string;
  visualIdea: string;
}

export interface CompetitorStrategy {
    competitorName: string;
    contentThemes: string[];
    commonPostTypes: string[];
    platformStrategies: {
        platform: string;
        strategy: string;
        postingFrequency?: string;
    }[];
}

export interface MarketingPlanResponse {
    brandSummary: {
        mission: string;
        targetAudience: string;
        toneOfVoice: string;
    };
    competitorStrategies: CompetitorStrategy[];
    trendingTopics: {
        topic: string;
        relevance: string;
    }[];
    postIdeas: PostIdea[];
}

export interface Task {
  id: string;
  postIdea: PostIdea;
  completed: boolean;
}

export interface PostingRecommendation {
    platform: Platform;
    optimalTime: string;
    formatSuggestion: string;
}

export type AspectRatio = '16:9' | '9:16' | '1:1';

export type ImageFilter = 'none' | 'grayscale' | 'sepia' | 'invert' | 'vintage';

export interface GroundingSource {
    title: string;
    uri: string;
}

export interface MapGroundingSource extends GroundingSource {
    placeId?: string;
}

export interface GroundingMetadata {
    web: GroundingSource[];
    maps: MapGroundingSource[];
}

// Fix: Moved AIStudio interface into the global scope to resolve redeclaration conflicts.
// This ensures a single definition for the AIStudio type used on the window object.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // Fix: Made the 'aistudio' property optional to resolve modifier conflicts with other global declarations.
    aistudio?: AIStudio;
  }
}
