#!/usr/bin/env python3
"""Generate src/oqlCorpus.js from the OQL v2 normative corpus (oxjob #330, #345).

The corpus lives in the sibling openalex-elastic-api repo
(docs/oql/corpus.yaml). It is the single source of truth; this script copies it
into the GUI as a plain JS module (like src/countries.js) so the OQL playground's
Cases subpage can render it with no runtime YAML dependency or backend call.

For every `ok` row we embed the canonical OQO. The corpus omits `oqo` on
round-trip-only rows (e.g. the L21 systematic-review tree), so we parse the OQL
through the reference impl (tests/oql/oql_v2.py) to fill it in. That way the
playground can compute a uniform complexity metric (OQO leaf count) for every
executable case -- L21 resolves to its full 114-leaf tree.

We also auto-render each row's **oxurl** (the classic api.openalex.org/openalex.org
SERP URL) via the production translator (query_translation/url_renderer.py), but
ONLY for rows the corpus flags `oxurl_representable: true`. A `true` row whose
render raises is a *translator gap* (the spec says it should render, but the
translator can't yet) -- we print those to stderr at the end so they can be
fixed. `false` rows (invalid-OQL errors + the genuine boundaries) get a null
oxurl and are skipped, as intended.

Regenerate (run from the openalex-gui repo root):

    python3 scripts/gen_oql_corpus.py

Requires the openalex-elastic-api repo as a sibling dir and its venv
(../openalex-elastic-api/venv) for the OQL parser. Re-run whenever corpus.yaml
changes, then commit the regenerated src/oqlCorpus.js.
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
GUI_ROOT = os.path.dirname(HERE)
ELASTIC_API = os.path.normpath(os.path.join(GUI_ROOT, "..", "openalex-elastic-api"))
CORPUS_YAML = os.path.join(ELASTIC_API, "docs", "oql", "corpus.yaml")
OUT_JS = os.path.join(GUI_ROOT, "src", "oqlCorpus.js")

# Parsing the OQL needs the elastic-api package + its deps, so we run the heavy
# lifting in a child process using that repo's venv interpreter.
VENV_PY = os.path.join(ELASTIC_API, "venv", "bin", "python")

CHILD = r"""
import json, sys
from urllib.parse import quote
sys.path.insert(0, sys.argv[1])  # elastic-api repo root
import yaml
from tests.oql.oql_v2 import parse, OQLError
from query_translation.oqo import OQO
from query_translation.url_renderer import render_oqo_to_url, URLRenderError

with open(sys.argv[2]) as f:
    corpus = yaml.safe_load(f)

# Filter/sort syntax chars are structural -- preserve them; percent-encode the
# rest (spaces, +, ", #, &, %, ...) so the stored oxurl is a valid URL.
SAFE = ":|,!<>=-.~*()/"

# Render OQO -> classic openalex.org SERP URL. Raises on non-representable
# structure (nested boolean / OR across fields), exactly like the translator.
def build_oxurl(oqo_dict):
    rendered = render_oqo_to_url(OQO.from_dict(oqo_dict))
    entity = oqo_dict.get("get_rows", "works")
    parts = []
    for key in ("filter", "sort", "group_by", "sample", "select", "seed",
                "per_page", "page", "cursor"):
        val = rendered.get(key)
        if val is None:
            continue
        parts.append(f"{key}=" + quote(str(val), safe=SAFE))
    return f"https://openalex.org/{entity}" + ("?" + "&".join(parts) if parts else "")

gaps = []  # (id, kind, detail) -- representable rows the translator mishandles
out = []
for row in corpus["rows"]:
    prov = row.get("provenance") or {}
    representable = bool(row.get("oxurl_representable"))
    rec = {
        "id": row["id"],
        "category": row.get("category", ""),
        "provenance": {
            "type": prov.get("type", ""),
            "label": prov.get("label", ""),
            "url": prov.get("url") or None,
        },
        "oxurl_representable": representable,
        "status": row["status"],
        "oql": row["oql"],
        "note": row.get("note", ""),
        "diagnostic": row.get("diagnostic", ""),
    }
    oqo = row.get("oqo")
    # Fill in the OQO for ok rows that omit it (round-trip-only cases like L21)
    # by parsing through the reference impl, so complexity is uniform.
    if oqo is None and row["status"] == "ok":
        try:
            oqo = parse(row["oql"]).to_dict()
        except OQLError as e:
            print(f"warn: {row['id']} parse failed: {e.code}", file=sys.stderr)
            oqo = None
    rec["oqo"] = oqo

    # Auto-render the oxurl for representable rows only.
    oxurl = None
    if representable and oqo is not None:
        try:
            oxurl = build_oxurl(oqo)
            # The render succeeded but may be quietly wrong -- flag the known
            # translator shortcomings so they get fixed, but still ship the URL.
            if ".semantic" in (oxurl or ""):
                gaps.append((row["id"], "renders-but-wrong",
                             "semantic search emitted as a filter= clause; "
                             "should route through ?search.semantic="))
            if len(oqo.get("group_by") or []) > 1:
                gaps.append((row["id"], "renders-but-unsupported",
                             "multi-dim group_by; live API is single-dim (#297)"))
        except (URLRenderError, Exception) as e:
            gaps.append((row["id"], "render-failed", f"{type(e).__name__}: {e}"))
            oxurl = None
    rec["oxurl"] = oxurl
    out.append(rec)

json.dump({"version": corpus.get("version"), "rows": out, "gaps": gaps},
          sys.stdout)
"""


def main():
    if not os.path.exists(CORPUS_YAML):
        sys.exit(f"corpus not found: {CORPUS_YAML}\n"
                 "expected openalex-elastic-api as a sibling repo")
    py = VENV_PY if os.path.exists(VENV_PY) else sys.executable
    proc = subprocess.run(
        [py, "-c", CHILD, ELASTIC_API, CORPUS_YAML],
        capture_output=True, text=True,
    )
    if proc.stderr:
        print(proc.stderr, file=sys.stderr, end="")
    if proc.returncode != 0:
        sys.exit(f"corpus parse failed (exit {proc.returncode})")

    data = json.loads(proc.stdout)
    rows = data["rows"]
    body = json.dumps(rows, indent=2, ensure_ascii=False)

    header = (
        "// AUTO-GENERATED by scripts/gen_oql_corpus.py -- do not edit by hand.\n"
        "// Source of truth: openalex-elastic-api/docs/oql/corpus.yaml (oxjob #330).\n"
        "// The OQL v2 normative corpus, one entry per worked example. Each `ok`\n"
        "// row carries its canonical `oqo` (parsed where the corpus omits it) so\n"
        "// the OQL playground can compute a uniform complexity metric, plus its\n"
        "// `provenance` (real origin) and auto-rendered `oxurl` (classic SERP URL,\n"
        "// null when not oxurl_representable or the translator can't render it). See #345.\n"
        f"// corpus version: {data.get('version')}; rows: {len(rows)}.\n\n"
    )
    with open(OUT_JS, "w") as f:
        f.write(header)
        f.write(f"export const oqlCorpus = {body};\n")

    ok = sum(1 for r in rows if r["status"] == "ok")
    rep = sum(1 for r in rows if r["oxurl_representable"])
    withurl = sum(1 for r in rows if r["oxurl"])
    print(f"wrote {OUT_JS}: {len(rows)} rows ({ok} ok); "
          f"{rep} oxurl-representable, {withurl} rendered.")

    gaps = data.get("gaps") or []
    if gaps:
        print("\n=== TRANSLATOR GAPS (oxurl_representable rows the translator "
              "mishandles -- fix in query_translation/) ===", file=sys.stderr)
        for rid, kind, detail in gaps:
            print(f"  {rid:6} [{kind}] {detail}", file=sys.stderr)
        print(f"  ({len(gaps)} gap(s) -- the corpus says these SHOULD render; "
              "the translator can't yet.)\n", file=sys.stderr)


if __name__ == "__main__":
    main()
