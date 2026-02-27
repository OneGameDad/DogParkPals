import api from './api';
import type { Amenity, OrgRole, EventPrivacy } from '../types';

// ─── Entity Types ─────────────────────────────────────────────────────────────

export type SearchEntityType = 'PARK' | 'USER' | 'DOG' | 'ORGANIZATION' | 'EVENT';

export interface SearchFilters {
    type?: SearchEntityType;
    limit?: number;
    offset?: number;
}

// ─── Result Shapes (mirrors backend SearchService interfaces) ─────────────────

export interface ParkSearchResult {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    description: string | null;
    amenities: Amenity[];
    profilePictureUrl: string | null;
    entityType: 'PARK';
}

export interface UserSearchResult {
    id: number;
    username: string;
    first_name: string | null;
    last_name: string | null;
    profilePictureUrl: string | null;
    entityType: 'USER';
}

export interface DogSearchResult {
    id: number;
    name: string;
    breed: string;
    gender: string;
    size: string | null;
    playstyle: string | null;
    profilePictureUrl: string | null;
    entityType: 'DOG';
}

export interface OrganizationSearchResult {
    id: number;
    name: string;
    description: string | null;
    profilePictureUrl: string | null;
    websiteUrl: string | null;
    ownerId?: number;
    memberRole?: OrgRole;
    entityType: 'ORGANIZATION';
}

export interface EventSearchResult {
    id: number;
    title: string;
    description: string | null;
    date: string;
    startTime: string | null;
    endTime: string | null;
    private: EventPrivacy;
    parkId: number;
    organizerId: number;
    organizationId: number | null;
    park: { id: number; name: string };
    organizer: { id: number; username: string; profilePictureUrl: string | null };
    entityType: 'EVENT';
}

export type AnySearchResult =
    | ParkSearchResult
    | UserSearchResult
    | DogSearchResult
    | OrganizationSearchResult
    | EventSearchResult;

// ─── Response Shapes ──────────────────────────────────────────────────────────

/** Response from GET /api/search (multi-type) */
export interface AdvancedSearchResponse {
    parks: ParkSearchResult[];
    users: UserSearchResult[];
    dogs: DogSearchResult[];
    organizations: OrganizationSearchResult[];
    events: EventSearchResult[];
    total: number;
}

/** Response from GET /api/search/:type (single-type) */
export interface TypedSearchResponse<T extends AnySearchResult = AnySearchResult> {
    type: SearchEntityType;
    query: string;
    results: T[];
    count: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

const searchService = {
    /**
     * GET /api/search — search all entity types at once.
     * Returns up to `limit` results per type (default 10, max 50).
     */
    async searchAll(query: string, filters: SearchFilters = {}): Promise<AdvancedSearchResponse> {
        const params = new URLSearchParams({ q: query });
        if (filters.type) params.set('type', filters.type);
        if (filters.limit != null) params.set('limit', String(filters.limit));
        if (filters.offset != null) params.set('offset', String(filters.offset));
        return api.get<AdvancedSearchResponse>(`/api/search?${params.toString()}`);
    },

    /**
     * GET /api/search/:type — search a single entity type.
     * Returns typed results array with count and pagination info.
     */
    async searchByType<T extends AnySearchResult = AnySearchResult>(
        type: SearchEntityType,
        query: string,
        filters: Omit<SearchFilters, 'type'> = {}
    ): Promise<TypedSearchResponse<T>> {
        const params = new URLSearchParams({ q: query });
        if (filters.limit != null) params.set('limit', String(filters.limit));
        if (filters.offset != null) params.set('offset', String(filters.offset));
        return api.get<TypedSearchResponse<T>>(`/api/search/${type}?${params.toString()}`);
    },
};

export default searchService;
