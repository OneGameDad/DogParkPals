import { useFetch } from '../useFetch';
import type { Park, CheckIn } from '../../types';

export function useParkDetails(parkId: string | undefined) {
    const {
        data: park,
        loading: loadingPark,
        error: errorPark,
        refetch: refetchPark
    } = useFetch<Park>(`/api/parks/${parkId}`, { skip: !parkId });

    const {
        data: checkIns,
        loading: loadingCheckIns,
        refetch: refetchCheckIns
    } = useFetch<CheckIn[]>(`/api/parks/${parkId}/check-ins`);

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
