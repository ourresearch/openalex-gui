// Every word a claimant reads while claiming an author profile (oxjob #1466).
// Plain English for readers whose first language isn't English: short
// sentences, one idea each. The same texts are in users-api's reply emails
// (templates/_claim_reason.*) and the MCP connector; change them together.

// Public client id of the OpenAlex ORCID app (/authenticate scope). Empty
// until the app is registered; the ORCID option stays hidden while empty.
export const ORCID_CLIENT_ID = '';
export const ORCID_AUTHORIZE_URL = 'https://orcid.org/oauth/authorize';

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
    title: 'Or prove it with ORCID',
    body: (orcid) =>
      `This profile has the ORCID iD ${orcid}. If this is your ORCID iD, sign in to ORCID. `
      + 'We approve your claim right away.',
    button: 'Sign in with ORCID',
  },
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
    linking: 'Signing you in with ORCID…',
    failed: 'We could not finish the ORCID sign-in. Please try again from the profile page.',
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

const shortId = (x) => (x || '').split('/').pop().toLowerCase();

// Which screen the claim window shows for this user and this profile.
//   instant | form | checking | approved | needs_evidence
export function claimView({ claim, eligibility, authorId }) {
  const here = claim && shortId(claim.author_id) === shortId(authorId);
  if (here && claim.decision === 'approved') return 'approved';
  if (here && claim.decision === 'pending') return 'checking';
  if (here && claim.decision === 'needs_evidence') return 'needs_evidence';
  return eligibility === 'instant' ? 'instant' : 'form';
}

export function orcidAuthorizeUrl({ clientId = ORCID_CLIENT_ID, origin, authorId }) {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: '/authenticate',
    redirect_uri: `${origin}/orcid-callback`,
    state: shortId(authorId).toUpperCase(),
  });
  return `${ORCID_AUTHORIZE_URL}?${params.toString()}`;
}
