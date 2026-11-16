// Ctrl+F-style marks for the searched words in the affiliation editor (oxjob #1364, ZD 24627).
import { describe, it, expect } from 'vitest';
import { fold, parseSearchTerms, highlightSegments } from '@/utils/highlightTerms';

const marked = (text, q) =>
  highlightSegments(text, parseSearchTerms(q)).filter((s) => s.hit).map((s) => s.text);
const rejoined = (text, q) => highlightSegments(text, parseSearchTerms(q)).map((s) => s.text).join('');

// Live rows from /raw-affiliation-strings?q=École normale supérieure de Lyon&unmatched-institutions=I113428412
const BIO_PHRASE = "Arnaud Leveau a effectué une partie de ses études à Beijing avant de débuter sa carrière. Actuellement à Séoul, il finalise une thèse de doctorat (Institut d’Asie orientale-École normale supérieure de Lyon) sur les relations entre la Corée du Sud et l’Asie.";
const BIO_APART = "Maître de conférences en sociologie à l’Université Lumière Lyon 2, il est membre du Groupe de recherche sur la socialisation (UMR5040, CNRS - Université Lyon 2 - Ecole normale supérieure Lettres et Sciences Humaines) dirigé par Bernard Lahire.";

describe('fold', () => {
  it('drops case and accents the way the search index does', () => {
    expect(fold('École Łódź Tromsø Straße Œuvre')).toBe('ecole lodz tromso strasse oeuvre');
  });
});

describe('parseSearchTerms', () => {
  it('splits words, keeps quoted phrases, drops excluded words', () => {
    expect(parseSearchTerms('ens-lyon.fr "normale supérieure" -Paris lyon* Lyon|Grenoble')).toEqual([
      { pieces: ['ens', 'lyon', 'fr'], phrase: false, prefix: false },
      { pieces: ['normale', 'superieure'], phrase: true, prefix: false },
      { pieces: ['lyon'], phrase: false, prefix: true },
      { pieces: ['lyon'], phrase: false, prefix: false },
      { pieces: ['grenoble'], phrase: false, prefix: false },
    ]);
  });
  it('ignores operators, slop and empty input', () => {
    expect(parseSearchTerms('"ens lyon"~3 + | ( )')).toEqual([{ pieces: ['ens', 'lyon'], phrase: true, prefix: false }]);
    expect(parseSearchTerms('')).toEqual([]);
    expect(parseSearchTerms(null)).toEqual([]);
  });
});

describe('highlightSegments', () => {
  it('marks the whole institution name in a long biography, accented or not', () => {
    for (const q of ['École normale supérieure de Lyon', 'Ecole normale superieure de Lyon', 'ECOLE NORMALE SUPERIEURE DE LYON']) {
      expect(marked(BIO_PHRASE, q)).toEqual(['École normale supérieure de Lyon']);
    }
  });
  it('marks each word when the words sit apart, so every row shows why it matched', () => {
    expect(marked(BIO_APART, 'École normale supérieure de Lyon')).toEqual(['Lyon', 'Lyon', 'Ecole normale supérieure']);
  });
  it('never marks a lone short word ("de") away from the other searched words', () => {
    expect(marked(BIO_PHRASE, 'École normale supérieure de Lyon')).not.toContain('de');
    expect(marked('Université de Lyon', 'de')).toEqual(['de']); // only short words searched: mark them
  });
  it('matches whole words only, unless the word ends in *', () => {
    expect(marked('Université Lyonnaise, Lyon', 'lyon')).toEqual(['Lyon']);
    expect(marked('Université Lyonnaise, Lyon', 'lyon*')).toEqual(['Lyonnaise, Lyon']);
  });
  it('marks a domain as one run, or its words when they sit apart', () => {
    expect(marked('Contact: jean.dupont@ens-lyon.fr', 'ens-lyon.fr')).toEqual(['ens-lyon.fr']);
    expect(marked('ENS, 46 allée d’Italie, Lyon', 'ens-lyon.fr')).toEqual(['ENS', 'Lyon']);
  });
  it('marks quoted phrases only as phrases, and never excluded words', () => {
    expect(marked('Lyon. Normale Sup, normale supérieure', '"normale supérieure" -Lyon')).toEqual(['normale supérieure']);
  });
  it('maps marks back onto the original text, letters that fold to two included', () => {
    expect(marked('Universität Straße 1, Łódź', 'strasse lodz')).toEqual(['Straße', 'Łódź']);
    const decomposed = 'E\u0301cole normale supe\u0301rieure de Lyon'.normalize('NFD');
    expect(marked(`Thèse, ${decomposed}.`, 'ecole normale superieure de lyon')).toEqual([decomposed]);
    for (const q of ['École normale supérieure de Lyon', 'strasse', 'zzz', '']) {
      expect(rejoined(BIO_PHRASE, q)).toBe(BIO_PHRASE);
    }
  });
  it('returns the text unmarked when nothing matches or nothing was searched', () => {
    expect(highlightSegments('CNRS', parseSearchTerms(''))).toEqual([{ text: 'CNRS', hit: false }]);
    expect(highlightSegments('CNRS', parseSearchTerms('Lyon'))).toEqual([{ text: 'CNRS', hit: false }]);
    expect(highlightSegments('', parseSearchTerms('Lyon'))).toEqual([]);
  });
});
