// Every word a claimant reads while claiming an author profile (oxjob #1466).
// Plain English for readers whose first language isn't English: short
// sentences, one idea each. The same texts are in users-api's reply emails
// (templates/_claim_reason.*) and the MCP connector; change them together.

// Public client id of the OpenAlex ORCID app (/authenticate scope, oxjob #1471).
// The ORCID option stays hidden while this is empty.
export const ORCID_CLIENT_ID = 'APP-GRFFQ9KH4BY82LCV';
export const ORCID_AUTHORIZE_URL = 'https://orcid.org/oauth/authorize';

// "Link" is the one word for this everywhere: claim window, Settings, callback (#1475).
const LINK_ORCID = 'Link your ORCID';

export const copy = {
  title: 'Claim this profile',
  instant: {
    body: (email) =>
      `Your account has a university email (${email}), so we approve your claim right away.`,
    button: 'Claim this profile',
  },
  universityEmail: {
    title: 'Fastest: add your university email',
    body: 'Do you have an email address from a university or research institute? '
      + 'Add it to your account. You can keep your current email too. '
      + 'When your account has a university email, we approve your claim right away.',
    button: 'Add a university email',
  },
  orcid: {
    title: 'Or link your ORCID',
    body: (orcid) =>
      `This profile has the ORCID iD ${orcid}. If this is your ORCID iD, link your ORCID to your OpenAlex account. `
      + 'Then we approve your claim right away.',
    button: LINK_ORCID,
  },
  // The account's linked ORCID iD is on this profile (#1475): one click.
  orcidLinked: {
    body: (orcid) =>
      `Your linked ORCID iD (${orcid}) is on this profile, so we approve your claim right away.`,
    button: 'Claim this profile',
  },
  checkingOrcid: 'Checking your ORCID iD…',
  link: {
    title: 'Or send a link that shows your email',
    intro: 'Send a link to a page that shows this email address:',
    good: [
      "Your page on your university's or institute's website",
      (email) => `A paper or preprint that lists ${email} as your email`,
    ],
    bad: [
      'A page that shows your name but not your email',
      'A page you made yourself, like a personal website, LinkedIn or ResearchGate',
    ],
    whyTitle: 'Why your email?',
    why: 'Anyone can type any name into an OpenAlex account. '
      + 'Your email is the only thing we have checked. So the page must show it.',
    placeholder: 'Link to the page',
    button: 'Check my link',
    after: 'We check your link automatically. You get an answer in a few minutes.',
  },
  checking: 'Checking your link…',
  stillChecking: 'We are still checking. We will email you the answer, usually within a few minutes.',
  approved: 'Your claim is approved. This profile is now yours. '
    + 'You can now add your missing works, remove works that are not yours, and fix your name.',
  notYet: 'We could not approve your claim yet.',
  fastestFix: 'The fastest fix: add your university email to your OpenAlex account. '
    + 'You can keep your current email. When your account has a university email, '
    + 'we approve your claim right away.',
  sendNewLink: 'Or send us a new link:',
  orcidCallback: {
    linking: 'Linking your ORCID…',
    failed: 'We could not link your ORCID. Please try again.',
    linked: 'Your ORCID is linked.',
    linkedAndClaiming: (authorId) => `Your ORCID is linked. We are claiming your author profile, ${authorId}.`,
    claimFailed: (message) => `Your ORCID is linked, but we could not claim your author profile. ${message}`,
    backToSettings: 'Back to Settings',
  },
  // Settings → Profile (#1475). Unset, a row says what it does; set, its
  // description is the value (the iD, the author id) and the button undoes it.
  orcidSettings: {
    label: 'ORCID',
    notLinked: 'Link your ORCID iD to your OpenAlex account.',
    linkButton: LINK_ORCID,
    unlinkButton: 'Unlink',
    unlinkConfirm: 'Unlink your ORCID iD?',
    unlinked: 'Your ORCID is unlinked.',
  },
  profileSettings: {
    label: 'Author profile',
    notClaimed: 'Claim your author profile to add missing works, remove works that are not yours, and fix your name.',
    findButton: 'Find your author profile',
    pending: (authorId) => `${authorId}: we are checking your claim.`,
    unclaimButton: 'Unclaim',
    unclaimConfirm: 'Unclaim this profile?',
    cancel: 'Cancel',
  },
};

// The middle paragraph of a "not yet" answer, by users-api feedback_code.
export function reasonText(code, { email, link } = {}) {
  const page = link || 'your link';
  switch (code) {
    case 'no_link':
      return `We did not find a link in what you sent. Please send a link to a web page or a paper that shows your email, ${email}.`;
    case 'unreachable':
      return `We could not open this page: ${page}. It may need a login, or the site may be down. Please send a page that anyone can open.`;
    case 'email_not_found':
      return `We opened ${page}, but your email, ${email}, is not on that page. The page must show this exact email.\n\n`
        + 'A page with only your name is not enough. Anyone can type any name into an OpenAlex account. '
        + 'Your email is the only thing we can check.';
    case 'self_made':
      return `${page} is a kind of page that anyone can make for themselves, for example a personal website, LinkedIn or ResearchGate. `
        + `Please send your page on your university's or institute's website, or a paper that shows ${email}.`;
    case 'email_not_contact':
      return `We found ${email} on ${page}, but not as a researcher's email. Please send a page that lists it as your email, `
        + "for example your page on your university's website, or the author details in one of your papers.";
    default:
      return `We could not confirm that ${page} connects ${email} to a university, an institute or a published paper. `
        + "Please send a different page: your page on your university's website, or a paper that lists your email. "
        + 'If none of these is possible for you, write to support@openalex.org.';
  }
}

// A123 from any OpenAlex author id shape, lowercased for comparing.
export const shortId = (x) => (x || '').split('/').pop().toLowerCase();

// Which screen the claim window shows for this user and this profile.
//   instant | orcid | form | checking | approved | needs_evidence
// `orcidMatch`: the account's linked ORCID iD is this profile's iD.
export function claimView({ claim, eligibility, authorId, orcidMatch = false }) {
  const here = claim && shortId(claim.author_id) === shortId(authorId);
  if (here && claim.decision === 'approved') return 'approved';
  if (here && claim.decision === 'pending') return 'checking';
  if (here && claim.decision === 'needs_evidence') return 'needs_evidence';
  if (eligibility === 'instant') return 'instant';
  return orcidMatch ? 'orcid' : 'form';
}

// The bare iD (0000-0002-1825-0097) from an iD or an orcid.org URL; '' if none.
export function bareOrcid(x) {
  return (x || '').trim().split('/').pop().toUpperCase();
}

export function sameOrcid(a, b) {
  return !!bareOrcid(a) && bareOrcid(a) === bareOrcid(b);
}

// ORCID accepts one registered redirect (/orcid-callback), so `state` says where
// the user started: 'settings' (link only) or an author id (link, then claim).
export const ORCID_STATE_SETTINGS = 'settings';

export function orcidAuthorizeUrl({ clientId = ORCID_CLIENT_ID, origin, authorId, state }) {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: '/authenticate',
    redirect_uri: `${origin}/orcid-callback`,
    state: state || shortId(authorId).toUpperCase(),
  });
  return `${ORCID_AUTHORIZE_URL}?${params.toString()}`;
}

// After linking from Settings (#1475): the profile to claim for the user, or
// null. `profileIds` carry the linked iD, most works first; splinters can share
// an iD, so the biggest wins. Never touches a claimed profile, nor a pending
// claim on that same profile (the verifier approves it by the iD anyway).
export function orcidAutoClaim({ authorId, claim, profileIds }) {
  const target = (profileIds || [])[0];
  if (!target || authorId) return null;
  if (claim && claim.decision === 'pending' && shortId(claim.author_id) === shortId(target)) return null;
  return shortId(target).toUpperCase();
}

// Where /orcid-callback goes after linking, from the `state` ORCID sends back.
//   {flow: 'claim', authorId: 'A123'} | {flow: 'settings'}
// Anything that isn't an author id links the iD and returns to Settings.
export function orcidCallbackFlow(state) {
  const s = String(state || '').trim();
  if (/^A\d+$/i.test(s)) return { flow: 'claim', authorId: s.toUpperCase() };
  return { flow: 'settings' };
}
