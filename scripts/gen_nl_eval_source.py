#!/usr/bin/env python3
"""Generate src/nlEvalSource.js from the NL→OQO gold SOURCE (oxjob #382).

This is the EDITABLE source of truth for the `/query/nl/annotate` curation page —
NOT to be confused with src/nlEvalRun.js (a lossy, derived snapshot of one eval
*run*; #344/#345). This script bakes the actual gold file

    openalex-elastic-api/docs/oql/nl_eval.yaml

into a plain JS module so the annotator can curate each case's natural-language
input strings with no runtime YAML/backend dependency.

Two case shapes (see nl_eval.yaml header):
  * {ref: <corpus-id>, nl: [...]}   inherits the gold OQO from corpus.yaml.
  * {id, oqo, nl: [...]}            standalone NL-only gold (Zendesk / guides).

For the read-only LEFT panel we resolve, per case, a uniform display bundle:
{category, oql, oqo, oxurl, provenance}. ref cases pull it from the corpus row
(same logic as gen_oql_corpus.py); standalone cases render OQL + oxurl from their
inline OQO via the production renderers.

LOSSLESS SERIALIZE (the whole point — see #382 ACCEPTANCE Test 4): the annotator
must be able to emit a full nl_eval.yaml that differs from the original ONLY in
the `nl:` lines the user actually touched. To guarantee that, we carry two
verbatim text carriers through to the JS module:

  * `preamble` / per-case `head` / `tail` — the EXACT original text of everything
    that is not an nl item line (file header comments, section banners, blank
    lines, the `- ref:`/`- id:`/`provenance:`/`oqo:` identity lines, the `  nl:`
    line). The serializer concatenates these verbatim, so ref/id/provenance/
    standalone-oqo and every comment are byte-identical by construction.
  * each nl item's `raw` — the verbatim original line. Untouched items are emitted
    verbatim (byte-identical); only added items (and difficulty edits) are
    (re)formatted in the browser. The file is `"\n".join(lines)`, so the
    serializer simply joins [preamble, head, item-lines..., tail] with "\n".

`source` defaults to "agent" (absence == agent); the annotator tags newly added
strings "source: human". We never write `source: agent` back, so untouched agent
items stay bare `{text, difficulty}`.

Regenerate (run from the openalex-gui repo root):

    python3 scripts/gen_nl_eval_source.py

Requires openalex-elastic-api as a sibling repo + its venv (for the OQL/url
renderers). Re-run whenever nl_eval.yaml changes, then commit src/nlEvalSource.js.
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
GUI_ROOT = os.path.dirname(HERE)
ELASTIC_API_DEFAULT = os.path.normpath(os.path.join(GUI_ROOT, "..", "openalex-elastic-api"))
# Data + source root. Override with ELASTIC_API_DIR to generate against an isolated
# worktree (e.g. while the canonical checkout is busy with another job's WIP).
ELASTIC_API = os.path.normpath(os.environ.get("ELASTIC_API_DIR") or ELASTIC_API_DEFAULT)
CORPUS_YAML = os.path.join(ELASTIC_API, "docs", "oql", "corpus.yaml")
NL_EVAL_YAML = os.path.join(ELASTIC_API, "docs", "oql", "nl_eval.yaml")
OUT_JS = os.path.join(GUI_ROOT, "src", "nlEvalSource.js")
# The venv (installed deps) always comes from the canonical sibling checkout; the
# child sys.path.inserts ELASTIC_API so it imports renderers from the chosen tree.
VENV_PY = os.path.join(ELASTIC_API_DEFAULT, "venv", "bin", "python")

CHILD = r"""
import json, re, sys
from urllib.parse import quote
sys.path.insert(0, sys.argv[1])  # elastic-api repo root
import yaml
from tests.oql.oql_v2 import parse, OQLError
from query_translation.oqo import OQO
from query_translation.oql_renderer import render_oqo_to_oql
from query_translation.url_renderer import render_oqo_to_url, URLRenderError

ELASTIC_API, CORPUS_PATH, NL_EVAL_PATH = sys.argv[1], sys.argv[2], sys.argv[3]

SAFE = ":|,!<>=-.~*()/"

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

def safe_oql(oqo_dict):
    try:
        return render_oqo_to_oql(OQO.from_dict(oqo_dict))
    except Exception:
        return None

def safe_oxurl(oqo_dict):
    if oqo_dict is None:
        return None
    try:
        return build_oxurl(oqo_dict)
    except (URLRenderError, Exception):
        return None

# --- corpus map: id -> display bundle (mirrors gen_oql_corpus.py) ------------
# Since #384 the corpus carries the materialized `oqo` (every ok row, incl. 78)
# and the rendered `oxurl` (null on `oql-only` rows) directly, so ref cases just
# copy them — no re-parse/re-render needed (standalone cases below still render
# from their inline oqo).
with open(CORPUS_PATH) as f:
    corpus = yaml.safe_load(f)
corpus_disp = {}
for row in corpus["rows"]:
    prov = row.get("provenance") or {}
    corpus_disp[row["id"]] = {
        "category": row.get("category", ""),
        "oql": row.get("oql"),
        "oqo": row.get("oqo"),
        "oxurl": row.get("oxurl"),
        "provenance": {
            "type": prov.get("type", ""),
            "label": prov.get("label", ""),
            "url": prov.get("url") or None,
        },
    }

# --- raw text + structured parse of nl_eval.yaml -----------------------------
raw = open(NL_EVAL_PATH).read()
lines = raw.split("\n")
doc = yaml.safe_load(raw)
cases_data = doc.get("cases", [])

# preamble = everything through the `cases:` line (inclusive).
cases_idx = next(i for i, l in enumerate(lines) if l.rstrip() == "cases:")
preamble = "\n".join(lines[: cases_idx + 1])

NL_RE = re.compile(r"^  nl:\s*(#.*)?$")
ITEM_RE = re.compile(r"^    - ")

cursor = cases_idx + 1
out_cases = []
for case in cases_data:
    nl_items = case.get("nl") or []
    # head: from cursor up to AND INCLUDING the `  nl:` line.
    head_start = cursor
    while cursor < len(lines) and not NL_RE.match(lines[cursor]):
        cursor += 1
    if cursor >= len(lines):
        raise SystemExit(f"could not find `  nl:` for case {case.get('ref') or case.get('id')}")
    head = "\n".join(lines[head_start: cursor + 1])
    cursor += 1  # move past the `  nl:` line
    # consume exactly len(nl_items) item lines.
    item_raws = []
    for _ in nl_items:
        if cursor >= len(lines) or not ITEM_RE.match(lines[cursor]):
            raise SystemExit(
                f"expected nl item line at {cursor+1} for case "
                f"{case.get('ref') or case.get('id')}, got: {lines[cursor] if cursor < len(lines) else '<EOF>'}")
        item_raws.append(lines[cursor])
        cursor += 1

    is_ref = "ref" in case
    if is_ref:
        disp = corpus_disp.get(case["ref"])
        if disp is None:
            raise SystemExit(f"ref {case['ref']} not in corpus")
    else:
        oqo = case.get("oqo")
        prov = case.get("provenance") or {}
        disp = {
            "category": "standalone",
            "oql": safe_oql(oqo),
            "oqo": oqo,
            "oxurl": safe_oxurl(oqo),
            "provenance": {
                "type": prov.get("type", ""),
                "label": prov.get("label", ""),
                "url": prov.get("url") or None,
            },
        }

    nl = []
    for raw_line, item in zip(item_raws, nl_items):
        nl.append({
            "text": item["text"],
            "difficulty": item["difficulty"],
            "source": item.get("source", "agent"),
            "raw": raw_line,
        })

    out_cases.append({
        "ref": case.get("ref"),
        "id": case.get("id"),
        "display": disp,
        "head": head,
        "nl": nl,
    })

tail = "\n".join(lines[cursor:])

# --- self-test: lossless reconstruction must be byte-identical ---------------
def reconstruct(preamble, cases, tail):
    parts = [preamble]
    for c in cases:
        parts.append(c["head"])
        parts.extend(item["raw"] for item in c["nl"])
    parts.append(tail)
    return "\n".join(parts)

rebuilt = reconstruct(preamble, out_cases, tail)
roundtrip_ok = (rebuilt == raw)

json.dump({
    "version": doc.get("version"),
    "preamble": preamble,
    "tail": tail,
    "cases": out_cases,
    "roundtrip_ok": roundtrip_ok,
}, sys.stdout)
"""


def main():
    for p in (CORPUS_YAML, NL_EVAL_YAML):
        if not os.path.exists(p):
            sys.exit(f"not found: {p}\nexpected openalex-elastic-api as a sibling repo")
    py = VENV_PY if os.path.exists(VENV_PY) else sys.executable
    proc = subprocess.run(
        [py, "-c", CHILD, ELASTIC_API, CORPUS_YAML, NL_EVAL_YAML],
        capture_output=True, text=True,
    )
    if proc.stderr:
        print(proc.stderr, file=sys.stderr, end="")
    if proc.returncode != 0:
        sys.exit(f"nl_eval source generation failed (exit {proc.returncode})")

    data = json.loads(proc.stdout)
    if not data.get("roundtrip_ok"):
        sys.exit("FATAL: lossless reconstruction self-test FAILED — the segmenter "
                 "did not reproduce nl_eval.yaml byte-for-byte. Refusing to write a "
                 "module that can't round-trip. Inspect the segmentation logic.")

    payload = {
        "version": data["version"],
        "preamble": data["preamble"],
        "tail": data["tail"],
        "cases": data["cases"],
    }
    body = json.dumps(payload, indent=2, ensure_ascii=False)

    n_cases = len(payload["cases"])
    n_nl = sum(len(c["nl"]) for c in payload["cases"])
    n_ref = sum(1 for c in payload["cases"] if c["ref"] is not None)
    n_standalone = sum(1 for c in payload["cases"] if c["id"] is not None)
    header = (
        "// AUTO-GENERATED by scripts/gen_nl_eval_source.py -- do not edit by hand.\n"
        "// Source of truth: openalex-elastic-api/docs/oql/nl_eval.yaml (oxjob #382).\n"
        "// The EDITABLE NL→OQO gold source for the /query/nl/annotate curation page.\n"
        "// (Distinct from src/nlEvalRun.js, which is a lossy snapshot of one eval run.)\n"
        "// Carries verbatim text (preamble/head/tail + per-item `raw`) so the page can\n"
        "// re-emit nl_eval.yaml losslessly -- only touched nl: lines change. See #382.\n"
        f"// version: {payload['version']}; {n_cases} cases ({n_ref} ref, "
        f"{n_standalone} standalone); {n_nl} nl formulations.\n\n"
    )
    with open(OUT_JS, "w") as f:
        f.write(header)
        f.write(f"export const nlEvalSource = {body};\n")

    print(f"wrote {OUT_JS}")
    print(f"  {n_cases} cases ({n_ref} ref, {n_standalone} standalone); {n_nl} nl formulations")
    print("  lossless round-trip self-test: PASS")


if __name__ == "__main__":
    main()
