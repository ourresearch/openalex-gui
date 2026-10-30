// oxjob #1928: a '<' that is text stays in the title; real markup is handled as before (b/i/em/strong/a kept,
// other tags dropped with their text kept). Examples are live titles the walden fix restored.
import { describe, it, expect } from "vitest";
import { titleHtml } from "@/titleHtml";
import { plain } from "@/seo/recordHead.mjs";

describe("titleHtml keeps text '<' (#1928)", () => {
  it.each([
    ["<Hygrophila phlomoides> Nees (Acanthaceae)", "&lt;Hygrophila phlomoides&gt; Nees (Acanthaceae)"],
    ["Study on Close-Up Shots in Film <The Throne>(2015)", "Study on Close-Up Shots in Film &lt;The Throne&gt;(2015)"],
    ["Solutions for 1<m<p and c>0", "Solutions for 1&lt;m&lt;p and c&gt;0"],
    ["the <i − 1i>-associative law", "the &lt;i − 1i&gt;-associative law"],
    ["<Advanced Energy Utilization Division> Chemical Reaction", "&lt;Advanced Energy Utilization Division&gt; Chemical Reaction"],
    ["Transverse expansion in <sup 197> Au", "Transverse expansion in &lt;sup 197&gt; Au"],
    ["p<0.05 in <LOD samples", "p&lt;0.05 in &lt;LOD samples"],
    ["run python <script-path> on <scripts>", "run python &lt;script-path&gt; on &lt;scripts&gt;"],
  ])("%s", (input, expected) => {
    expect(titleHtml(input)).toBe(expected);
  });
});

describe("titleHtml markup unchanged (#1928)", () => {
  it.each([
    ["Growth of <i>E. coli</i> in H<sub>2</sub>O", "Growth of <i>E. coli</i> in H2O"],
    ["<b>Bold</b> and <em>em</em> and <strong>s</strong>", "<b>Bold</b> and <em>em</em> and <strong>s</strong>"],
    ["x<sup>2</sup> + <span class=\"a\">y</span>", "x2 + y"],
    ["<mml:math><mml:mi>x</mml:mi></mml:math> bounds", "x bounds"],
    ["Line<br/>break and <p>para</p>", "Linebreak and para"],
    ["<scp>Dna</scp> repair", "Dna repair"],
    ["<script>alert(1)</script>Title", "Title"],
    ["<img src=x onerror=\"alert(1)\">Title", "Title"],
    ["<a href=\"javascript:alert(1)\">x</a>", "<a>x</a>"],
    ["R&D for c>0", "R&amp;D for c&gt;0"],
  ])("%s", (input, expected) => {
    expect(titleHtml(input)).toBe(expected);
  });
});

describe("plain() for page heads keeps text '<' (#1928)", () => {
  it.each([
    ["Psychology in Korean Films: focused on <King and the Crown> and <Masquerade>", "Psychology in Korean Films: focused on <King and the Crown> and <Masquerade>"],
    ["Solutions for 1<m<p and c>0", "Solutions for 1<m<p and c>0"],
    ["Growth of <i>E. coli</i> in H<sub>2</sub>O &amp; more", "Growth of E. coli in H2O & more"],
    ["<mml:math><mml:mi>x</mml:mi></mml:math> bounds <jats:italic>a</jats:italic>", "x bounds a"],
  ])("%s", (input, expected) => {
    expect(plain(input)).toBe(expected);
  });
});
