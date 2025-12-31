// API functions for profile recommendations
import { pb } from '@/lib/pocketbase';
import { MOCK_PROFILES } from '../mock-data';

export interface RecommendedProfile {
    id: string;
    display_name: string | null;
    category?: string | null;
    city?: string | null;
    state?: string | null;
    price?: number | null;
    verified?: boolean | null;
    views?: number;
    services?: string[];
    media?: Array<{ url: string; type: string }>;
}

/**
 * Get recommended profiles based on a reference profile
 */
export async function getRecommendedProfiles(
    profileId: string,
    limit = 8
): Promise<RecommendedProfile[]> {
    try {
        const referenceProfile = await pb.collection('profiles').getOne(profileId);

        let filter = `id != "${profileId}" && is_banned = false`;
        if (referenceProfile.category) {
            filter += ` && category = "${referenceProfile.category}"`;
        }

        const result = await pb.collection('profiles').getList(1, limit * 2, {
            filter,
        });

        if (result.items.length > 0) {
            const scoredProfiles = result.items
                .map(profile => ({
                    ...profile,
                    score: calculateRecommendationScore(referenceProfile, profile),
                    views: (profile as any).views || 0,
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);

            return scoredProfiles as unknown as RecommendedProfile[];
        }

        return getRecommendedFromMocks(profileId, limit);
    } catch (err: any) {
        console.warn('Error getting recommendations from PocketBase, using mocks:', err);
        return getRecommendedFromMocks(profileId, limit);
    }
}

/**
 * Calculate recommendation score based on similarity
 */
function calculateRecommendationScore(
    reference: any,
    candidate: any
): number {
    let score = 0;

    // Same category (high priority)
    if (reference.category && candidate.category === reference.category) {
        score += 50;
    }

    // Same city (high priority)
    if (reference.city && candidate.city === reference.city) {
        score += 30;
    }

    // Same state
    if (reference.state && candidate.state === reference.state) {
        score += 10;
    }

    // Verified profiles get bonus
    if (candidate.verified) {
        score += 20;
    }

    // Similar services (if both have services)
    if (reference.services && candidate.services) {
        const refServices = Array.isArray(reference.services) ? reference.services : [];
        const candServices = Array.isArray(candidate.services) ? candidate.services : [];
        const commonServices = refServices.filter((s: string) => candServices.includes(s));
        score += commonServices.length * 5;
    }

    // Popularity boost (based on views)
    const views = (candidate.views || 0) as number;
    if (views > 1000) score += 10;
    else if (views > 500) score += 5;
    else if (views > 100) score += 2;

    // Similar price range (±20%)
    if (reference.price && candidate.price) {
        const priceDiff = Math.abs(reference.price - candidate.price);
        const priceRange = reference.price * 0.2;
        if (priceDiff <= priceRange) {
            score += 5;
        }
    }

    return score;
}

/**
 * Get recommendations from mock data
 */
function getRecommendedFromMocks(profileId: string, limit: number): RecommendedProfile[] {
    const referenceProfile = MOCK_PROFILES.find(p => p.id === profileId);
    if (!referenceProfile) {
        // If reference not found, return random profiles
        return MOCK_PROFILES
            .filter(p => p.id !== profileId)
            .slice(0, limit)
            .map(p => ({
                id: p.id,
                display_name: p.display_name,
                category: p.category,
                city: p.city,
                state: p.state,
                price: p.price,
                verified: p.verified,
                views: p.views,
                services: p.services,
                media: p.media,
            }));
    }

    // Score and sort mock profiles
    const scored = MOCK_PROFILES
        .filter(p => p.id !== profileId)
        .map(profile => ({
            ...profile,
            score: calculateRecommendationScore(referenceProfile, profile),
        }))
        .sort((a, b) => (b as any).score - (a as any).score)
        .slice(0, limit)
        .map(p => ({
            id: p.id,
            display_name: p.display_name,
            category: p.category,
            city: p.city,
            state: p.state,
            price: p.price,
            verified: p.verified,
            views: p.views,
            services: p.services,
            media: p.media,
        }));

    return scored;
}
