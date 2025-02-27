
export interface UserStory {
  name: string;
  description: string;
  userStories: string[];
  estimation?: {
    hours: number;
    cost: number;
    details: string;
  };
}

export interface Breakdown {
  features: UserStory[];
  technicalComponents: string[];
}
