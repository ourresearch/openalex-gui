// The route signature whose change closes the work drawer (EntityDrawer.vue).
// name + params: a real navigation (Back, a click through to another page).
// ?filter=: a link inside the drawer ("Cited by", "Cites", "Related to", child
// works) re-filtering the same /works page under it. Without it the drawer stayed
// open over the new results and the click looked dead (ZD 6021, oxjob #1086).
// Paging, a search edit and the drawer's own ?zoom= strip leave it unchanged.
export const drawerCloseKey = (route) =>
  `${String(route?.name)}|${JSON.stringify(route?.params ?? {})}|${route?.query?.filter ?? ''}`;
