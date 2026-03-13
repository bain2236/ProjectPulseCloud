export interface Profile {
  slug: string;
  displayName: string;
  public: boolean;
  theme: 'neon-dark' | 'clean-light';
  createdAt: string;
  bio?: string;
  avatar?: string;
  location?: string;
  website?: string;
  links?: {
    label: string;
    url: string;
  }[];
}

export interface Tab {
  id: string;
  title: string;
  order: number;
}

export interface Evidence {
  id: string;
  tabId: string;
  source: string;
  author: string;
  authorRole: string;
  date: string;
  text: string;
  imageUrl: string | null;
  externalUrl: string | null;
  createdAt: string;
  highlights?: string[];
}

export interface Concept {
  id: string;
  label: string;
  tabId: string;
  weight: number;
  confidence: number;
  sourceEvidenceIds: string[];
  createdByLLM: boolean;
  createdAt: string;
}

export interface ProfileData {
  profile: Profile;
  tabs: Tab[];
  evidence: Evidence[];
  concepts: Concept[];
  aboutMe?: string;
  settings: {
    recencyDecayDays: number;
    llm: {
      enabled: boolean;
      provider: string;
      model: string;
    };
    publish: {
      autoPublishOnCreate: boolean;
    };
  };
}

export interface VoronoiCell {
  concept: Concept;
  polygon: number[][];
  centerX: number;
  centerY: number;
  fontSize: number;
  area: number;
}