import { describe, it, expect } from 'vitest';
import { drawerCloseKey } from '@/drawerCloseKey';

// oxjob #1086, ZD 6021: a link inside the work drawer on /works ("Cited by",
// "Cites", "Related to") only changed ?filter=, the drawer's close watcher keyed
// on name + params, so the drawer stayed open over the new results.
describe('work drawer closes when a link in it re-filters the page', () => {
    const serp = (query) => ({ name: 'Serp', params: { entityType: 'works' }, query });

    it('a new ?filter= changes the key (drawer closes)', () => {
        expect(drawerCloseKey(serp({ search: 'kelp', page: 1 })))
            .not.toBe(drawerCloseKey(serp({ filter: 'cites:W2741809807', page: 1 })));
    });

    it('paging, a search edit and the ?zoom= strip keep it (drawer stays)', () => {
        const base = drawerCloseKey(serp({ filter: 'type:article', page: 1, zoom: 'W1' }));
        expect(drawerCloseKey(serp({ filter: 'type:article', page: 2 }))).toBe(base);
        expect(drawerCloseKey(serp({ filter: 'type:article', page: 1, search: 'x' }))).toBe(base);
    });

    it('a real navigation still changes it', () => {
        expect(drawerCloseKey({ name: 'EntityPage', params: { entityType: 'authors', entityId: 'A1' }, query: {} }))
            .not.toBe(drawerCloseKey(serp({})));
    });
});
