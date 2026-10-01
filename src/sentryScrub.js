// Keep credentials out of what Sentry records (oxjob #1479). Some requests still carry the
// user's API key in the query string (e.g. the export button's /rate-limit check), and Sentry's
// XHR/fetch/navigation breadcrumbs store full URLs.
const SECRET_PARAMS = /([?&](?:api_key|api-key)=)[^&#]*/gi;

export const scrubUrl = (url) =>
  typeof url === "string" ? url.replace(SECRET_PARAMS, "$1[Filtered]") : url;

export const scrubBreadcrumb = (breadcrumb) => {
  const data = breadcrumb?.data;
  if (data) {
    for (const key of ["url", "from", "to"]) {
      if (key in data) data[key] = scrubUrl(data[key]);
    }
  }
  return breadcrumb;
};

export const scrubEvent = (event) => {
  if (event?.request?.url) event.request.url = scrubUrl(event.request.url);
  if (Array.isArray(event?.breadcrumbs)) event.breadcrumbs.forEach(scrubBreadcrumb);
  return event;
};
