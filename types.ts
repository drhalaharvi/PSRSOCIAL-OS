import type { GroundingChunk } from '@google/genai';

export type Tab = 'plan' | 'calendar' | 'image' | 'generate' | 'video' | 'local' | 'upscale';

export interface PostIdea {
  platform: 'Instagram' | 'TikTok' | 'X' | 'Facebook' | 'LinkedIn';
  prompt: string;
  visualIdea: string;
}

export interface MarketingPlanResponse {
  competitorAnalysis: {
    competitorName: string;
    strengths: string[];
    weaknesses: string[];
  }[];
  contentPillars: {
    pillar: string;
    description: string;
  }[];
  postIdeas: PostIdea[];
}

export interface Task {
  id: string;
  postIdea: PostIdea;
  completed: boolean;
}

export type AspectRatio = '16:9' | '9:16' | '1:1';

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
