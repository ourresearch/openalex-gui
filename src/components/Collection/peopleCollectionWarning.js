// One warning, shown wherever someone makes or shares a collection of people
// (entity_type "authors"): creating one, copying one, sharing one, or copying a
// search link that uses one. Jason, 2 Oct 2026 (oxjob #646). Other types hold no
// people, so they never show it.
export const PEOPLE_COLLECTION_WARNING =
  "Lists of people say something about them. Sharing one drawn from HR or personnel " +
  "records may cause a data breach or break privacy laws such as GDPR. Make sure " +
  "you're allowed to before you share it.";

export function isPeopleCollectionType(entityType) {
  return entityType === "authors";
}
