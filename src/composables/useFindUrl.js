import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export function useFindUrl() {
    const route = useRoute();
    const router = useRouter();

    // Reactive state derived from URL
    const query = computed(() => route.query.q || '');
    const page = computed(() => parseInt(route.query.page) || 1);

    // Parse filters from URL query params
    const filters = computed(() => {
        const result = {};
        const filterKeys = [
            'since',
            'is_oa',
            'has_abstract',
            'has_pdf',
        ];
        filterKeys.forEach(key => {
            const value = route.query[key];
            if (value !== undefined && value !== '') {
                if (key === 'is_oa' || key === 'has_abstract' || key === 'has_pdf') {
                    result[key] = value === 'true';
                } else {
                    result[key] = value;
                }
            }
        });
        return result;
    });

    // Build API filters object from URL params
    const apiFilters = computed(() => {
        const result = {};
        const f = filters.value;

        // Since year filter (converts to publication_year range)
        if (f.since) {
            result.publication_year = `${f.since}-${new Date().getFullYear()}`;
        }

        // Boolean filters
        if (f.is_oa === true) result.is_oa = true;
        if (f.has_abstract === true) result.has_abstract = true;
        if (f.has_pdf === true) result['has_content.pdf'] = true;

        return result;
    });

    // Methods to update URL
    function setQuery(newQuery) {
        const newRouteQuery = { ...route.query, q: newQuery || undefined };
        // Reset page when query changes
        delete newRouteQuery.page;
        router.push({ query: newRouteQuery });
    }

    function setPage(newPage) {
        const newRouteQuery = { ...route.query, page: newPage > 1 ? newPage : undefined };
        router.push({ query: newRouteQuery });
    }

    function setFilter(key, value) {
        const newRouteQuery = { ...route.query };
        if (value === undefined || value === '' || value === false) {
            delete newRouteQuery[key];
        } else {
            newRouteQuery[key] = String(value);
        }
        // Reset page when filters change
        delete newRouteQuery.page;
        router.push({ query: newRouteQuery });
    }

    function setFilters(newFilters) {
        const newRouteQuery = { q: route.query.q };
        Object.entries(newFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== '' && value !== false) {
                newRouteQuery[key] = String(value);
            }
        });
        router.push({ query: newRouteQuery });
    }

    function clearFilters() {
        router.push({ query: { q: route.query.q } });
    }

    // Check if we have an active search
    const hasQuery = computed(() => !!query.value && query.value.trim().length > 0);

    return {
        query,
        page,
        filters,
        apiFilters,
        hasQuery,
        setQuery,
        setPage,
        setFilter,
        setFilters,
        clearFilters,
    };
}
