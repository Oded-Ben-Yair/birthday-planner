export interface UserInput {
    age: number;
    theme: string;
    guestCount: number;
    budget: 'budget-friendly' | 'moderate' | 'premium' | 'luxury';
    location: {
        city: string;
        setting: 'indoor' | 'outdoor' | 'both';
    };
    activities: string[];
    additionalPreferences?: string;
}

export interface VenueRecommendation {
    name: string;
    description: string;
    costRange: string;
    amenities: string[];
    suitability: string;
}

export interface ActivitySchedule {
    time: string;
    activity: string; // Correct definition
    description: string; // Correct definition
}

export interface CateringSuggestion {
    menu: {
        appetizers: string[];
        mainCourses: string[];
        // Type for desserts should likely be string[] if multiple, or string if single based on guide example [cite: 69]
        // Guide shows usage as map in PlanCard, but definition doesn't match. Assuming array based on appetizers/mainCourses.
        // If errors persist related to desserts, check PlanCard component usage vs definition.
        // Let's stick to the guide's type definition for now:
        desserts: string; // Guide [cite: 21] defines as string, usage might differ
        beverages: string[];
    };
    estimatedCost: string;
    servingStyle: string;
}

export interface GuestEngagement {
    icebreakers: string[];
    interactiveElements: string[];
    photoOpportunities: string[];
    partyFavors: string[];
    techIntegration?: string[];
}

export interface BirthdayPlan {
    id: string;
    name: string;
    description: string;
    venue: VenueRecommendation;
    schedule: ActivitySchedule[];
    catering: CateringSuggestion;
    guestEngagement: GuestEngagement;
}

export interface SmartInvitation {
    text: string;
    imageUrl: string;
    template: 'classic' | 'playful' | 'themed' | 'minimalist';
}

export interface BudgetPriorities {
    venue: number;
    food: number;
    activities: number;
    decorations: number;
    partyFavors: number;
}
