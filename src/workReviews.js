// A work's reviews on its page (oxjob #2540). Reviews are links between works
// (link type `review`, #2481): the review is the link's origin, the reviewed work its
// target. No field on the work lists them, so the page reads /links and then the
// review works by id. The page says "N reviews", never "reviewed", and shows no
// rating, score or summary: a count is not a verdict (charter decoupled-journal § 2).
import { bareId, idsOpenAlexFilter } from "@/utils/selectionExport";

// One /links page (100 rows) and one ids.openalex lookup (100 ids, checked live
// 2026-11-22). shortcut: a work with more than 100 linked reviews lists its first 100.
const MAX_REVIEWS = 100;
// The list shows this many before "show all".
export const REVIEWS_SHOWN = 10;

export function reviewsHeading(count) {
    return `${count.toLocaleString("en-US")} ${count === 1 ? "review" : "reviews"}`;
}

// Only works with reviews ask /links: reviewed_by_count is filled nightly, so a
// work with none skips the call.
export function hasReviews(work) {
    return work?.reviewed_by_count > 0;
}

export function linksParams(workId) {
    return { filter: `target:${bareId(workId)},link_type:review`, "per-page": MAX_REVIEWS };
}

export function reviewWorkIds(linksResponse) {
    return [...new Set((linksResponse?.results || []).map((link) => link?.origin).filter(Boolean).map(bareId))];
}

// Reviews can be xpac works (book reviews), so the lookup includes them; the
// default view would drop them silently.
export function reviewWorksParams(ids) {
    return {
        filter: idsOpenAlexFilter(ids),
        "per-page": MAX_REVIEWS,
        include_xpac: "true",
        select: "id,display_name,publication_date,publication_year,primary_location",
    };
}

// One row per review link, in date order (then title, so "Reviewer #2" follows
// "Reviewer #1"). A review the lookup did not return keeps its row, by id.
export function reviewRows(ids, worksResponse) {
    const byId = new Map((worksResponse?.results || []).map((w) => [bareId(w.id), w]));
    const rows = ids.map((id) => {
        const w = byId.get(id);
        return {
            id,
            title: w?.display_name || id,
            date: w?.publication_date,
            meta: [w?.primary_location?.source?.display_name, w?.publication_year].filter(Boolean).join(", "),
        };
    });
    return rows.sort((a, b) =>
        (a.date || "9999").localeCompare(b.date || "9999")
        || a.title.localeCompare(b.title, "en", { numeric: true, sensitivity: "base" }));
}
