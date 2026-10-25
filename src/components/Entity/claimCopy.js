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
  // Since oxjob #1762 (2026-10-24) only a paper on this profile passes as a link: a web page
  // alone shows whose email it is, not whose profile this is.
  link: {
    title: 'Or send one of your papers that shows your email',
    intro: 'Send a link to one of your papers on this profile that shows this email address (its DOI is enough):',
    good: [
      (email) => `A paper or preprint on this profile that lists ${email} as your email`,
    ],
    bad: [
      "A web page alone, even your page on a university's website: anyone who can edit a page can put any name on it",
      'A page that shows your name but not your email',
      'A paper that is not on this profile',
    ],
    whyTitle: 'Why your email?',
    why: 'Anyone can type any name into an OpenAlex account. '
      + 'Your email is the only thing we have checked. So the page must show it.',
    placeholder: 'Link to the paper, or its DOI',
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
    linkButton: 'Link ORCID',   // short: the right side of the row has one fixed width
    linkedBadge: 'Linked',
    copy: 'Copy iD',
    open: 'Open on ORCID',
    unlinkButton: 'Unlink',
    unlinkConfirm: 'Unlink your ORCID iD?',
    unlinkBody: 'Your ORCID iD will no longer be linked to your OpenAlex account. You can link it again at any time.',
    unlinked: 'Your ORCID is unlinked.',
  },
  profileSettings: {
    label: 'Author profile',
    notClaimed: 'Claim your author profile to add missing works, remove works that are not yours, and fix your name.',
    findButton: 'Claim profile',
    pending: (authorId) => `${authorId}: we are checking your claim.`,
    claimedBadge: 'Claimed',
    copy: 'Copy ID',
    open: 'Open profile',
    unclaimButton: 'Unclaim',
    unclaimConfirm: 'Unclaim this profile?',
    unclaimBody: 'You will no longer be able to fix its works or its name. You can claim it again later.',
  },
};

// The middle paragraph of a "not yet" answer, by users-api feedback_code. Same text as
// users-api templates/_claim_reason.txt. Since oxjob #1762 (2026-10-24) nothing waits for a
// person: a web page alone never passes, so every answer names what does pass on its own.
export function reasonText(code, { email, link } = {}) {
  const page = link || 'your link';
  const works = `What works on its own: a link to one of your papers that lists ${email}. `
    + 'The paper must be on this profile. Its DOI is enough. '
    + 'Or sign in with ORCID, if this profile shows your ORCID iD.';
  switch (code) {
    case 'no_link':
      return `We did not find a link in what you sent. ${works}`;
    case 'unreachable':
      return `We could not open this page: ${page}. It may need a login, or the site may be down. `
        + 'Please send a link that anyone can open.';
    case 'email_not_found':
      return `We opened ${page}, but your email, ${email}, is not on that page. The page must show this exact email.\n\n`
        + 'A page with only your name is not enough. Anyone can type any name into an OpenAlex account. '
        + 'Your email is the only thing we can check.';
    case 'self_made':
      return `${page} is a kind of page that anyone can make for themselves, for example a personal website, `
        + `LinkedIn or ResearchGate. ${works}`;
    case 'email_not_contact':
      return `We found ${email} on ${page}, but not as a researcher's email. ${works}`;
    case 'profile_gone':
      return 'That profile is no longer in OpenAlex: it was merged into another profile or removed after you claimed it. '
        + 'Search for your name, open the profile with your works, and claim that one. Your new claim replaces this one.';
    case 'page_only':
      return `We found ${email} on ${page}. But a web page alone is not enough, even a page on a university's website. `
        + `Anyone who can edit a page can put any name on it. ${works}`;
    case 'not_on_profile':
      return `The paper you sent, ${page}, is not on this profile, or the email on it belongs to another author. ${works}`;
    case 'merged_profile':
      return 'This profile seems to mix the works of more than one person. So a link or an email cannot show that it is yours. '
        + 'If this profile shows your ORCID iD, sign in with ORCID: that still works.';
    case 'already_owned':
      return 'Another OpenAlex account already owns this profile. If that is your other account, sign in with that account.';
    case 'institution_email_unclear':
      return `Your institution email alone does not show that this profile is yours. ${works}`;
    case 'could_not_check':
      return `For several days, we could not open or check ${page}. The problem may be on our side or on the site's side. `
        + 'Please send the link again, or send a different link.';
    default:
      return `We could not confirm that ${page} connects ${email} to this profile. ${works} `
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
