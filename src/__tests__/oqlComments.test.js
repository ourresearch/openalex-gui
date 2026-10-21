import { describe, it, expect } from 'vitest';
import { commentRanges, maskComments, splitComments, inComment } from '@/components/OqlPlayground/oqlComments';

describe('OQL comments: `#` notes to the chat (#1744)', () => {
  it('finds a comment at the end of a line and on its own line', () => {
    const s = 'get works about kelp # only open access\n# and since 2020';
    expect(commentRanges(s)).toEqual([
      { from: 21, to: 39 },
      { from: 40, to: s.length },
    ]);
  });

  it('ignores # inside quotes and entity names', () => {
    expect(commentRanges('get works about "C# programming"')).toEqual([]);
    expect(commentRanges('get works from [Lab #5](I123)')).toEqual([]);
    expect(commentRanges('get works about "C#" # only articles')).toEqual([{ from: 21, to: 36 }]);
  });

  it('masks comments to spaces, keeping offsets', () => {
    const s = 'get works about kelp # only OA';
    const m = maskComments(s);
    expect(m.length).toBe(s.length);
    expect(m.trimEnd()).toBe('get works about kelp');
    expect(maskComments('get works')).toBe('get works');
  });

  it('splits the query from the note', () => {
    expect(splitComments('get works about kelp\n# only open access')).toEqual({
      oql: 'get works about kelp',
      note: 'only open access',
    });
    expect(splitComments('get works about kelp # only OA\n# since 2020')).toEqual({
      oql: 'get works about kelp',
      note: 'only OA since 2020',
    });
    expect(splitComments('# kelp papers by country')).toEqual({ oql: '', note: 'kelp papers by country' });
    expect(splitComments('get works about kelp')).toEqual({ oql: 'get works about kelp', note: '' });
    expect(splitComments('get works about kelp #')).toEqual({ oql: 'get works about kelp', note: '' });
  });

  it('knows when the cursor is in a comment', () => {
    const s = 'get works # only OA';
    expect(inComment(s, 5)).toBe(false);
    expect(inComment(s, 10)).toBe(false); // just before the #
    expect(inComment(s, 11)).toBe(true);
    expect(inComment(s, s.length)).toBe(true);
  });
});
