import { useFetch } from '../useFetch';
import type { Park, CheckIn } from '../../types';

export function useParkDetails(parkId: string | undefined) {
    const {
        data: park,
        loading: loadingPark,
        error: errorPark,
        refetch: refetchPark
    } = useFetch<Park>(parkId ? `/api/parks/${parkId}` : null);

    const {
        data: checkIns,
        loading: loadingCheckIns,
        refetch: refetchCheckIns
    } = useFetch<CheckIn[]>(parkId ? `/api/parks/${parkId}/check-ins` : null);

    return {
        park,
        checkIns: checkIns || [],
        loading: loadingPark || loadingCheckIns,
        error: errorPark,
        refetch: () => {
            refetchPark();
            refetchCheckIns();
        }
    };
}
