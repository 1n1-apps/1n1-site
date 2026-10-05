#!/usr/bin/env bash
# Scaffold a new, correctly-numbered ADR from the template.
#
# Usage: new-adr.sh <slug> --issue <N> [--title "Human title"] [--ticket ABC-123]
#                          [--dir docs/adr] [--date YYYY-MM-DD] [--deciders "Name"]
#
# What it does:
#   * numbers the ADR from the Issue it belongs to (--issue 320 -> 0320), so two branches
#     working in parallel cannot claim the same number; if that number is already taken
#     (a second ADR on the same ticket, or an older sequential ADR holding it), it takes the
#     first free letter suffix: 0320b, 0320c, …
#   * copies <dir>/TEMPLATE.md if present, else a built-in baseline
#   * fills the title number, date, and ticket (leaves status/deciders/supersede fields
#     as proposed defaults unless --deciders is given)
#   * writes <dir>/<NNNN>-<slug>.md (never overwrites) and prints the README index row
#
# What it deliberately does NOT do (do these by hand — see the skill body):
#   * write the section prose, or add the README index row to docs/adr/README.md
#     (inserting into a Markdown table reliably is a judgment call, not a substitution)
#
# Portable: standard POSIX shell tools only (bash, find, grep, sed, awk, sort, tr, date).
# No git, no network.
set -euo pipefail

die() { echo "new-adr.sh: $*" >&2; exit 1; }

usage() {
  cat <<'EOF'
usage: new-adr.sh <slug> --issue <N> [--title "Human title"] [--ticket ABC-123]
                         [--dir docs/adr] [--date YYYY-MM-DD] [--deciders "Name"]

  <slug>        kebab-case filename slug, e.g. single-egress          (required)
  --issue       Issue number the ADR belongs to; it is the number     (required)
  --title       H1 title text                    (default: humanized slug)
  --ticket      work-item key for frontmatter     (default: GH-<issue>)
  --dir         ADR directory                     (default: docs/adr)
  --date        ISO date for frontmatter          (default: today)
  --deciders    comma-separated names             (default: [] left empty)
EOF
}

[ "$#" -ge 1 ] || {
  usage >&2
  exit 1
}

slug=""
title=""
issue=""
ticket=""
dir="docs/adr"
date="$(date +%F)"
deciders=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --title)    [ "$#" -ge 2 ] || die "--title needs a value"; title="$2"; shift 2 ;;
    --issue)    [ "$#" -ge 2 ] || die "--issue needs a value"; issue="$2"; shift 2 ;;
    --ticket)   [ "$#" -ge 2 ] || die "--ticket needs a value"; ticket="$2"; shift 2 ;;
    --dir)      [ "$#" -ge 2 ] || die "--dir needs a value"; dir="$2"; shift 2 ;;
    --date)     [ "$#" -ge 2 ] || die "--date needs a value"; date="$2"; shift 2 ;;
    --deciders) [ "$#" -ge 2 ] || die "--deciders needs a value"; deciders="$2"; shift 2 ;;
    -h|--help)  usage; exit 0 ;;
    --*)        die "unknown option: $1" ;;
    *)
      [ -z "$slug" ] || die "unexpected extra argument: $1"
      slug="$1"; shift ;;
  esac
done

[ -n "$slug" ] || {
  usage >&2
  exit 1
}
echo "$slug" | grep -Eq '^[a-z0-9]+(-[a-z0-9]+)*$' \
  || die "slug must be kebab-case (lowercase letters, digits, single hyphens): got '$slug'"
echo "$date" | grep -Eq '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' \
  || die "--date must be ISO YYYY-MM-DD: got '$date'"
[ -d "$dir" ] || die "ADR directory not found: '$dir' (run from the repo root, or pass --dir)"

# An ADR's number is its ticket's Issue number, so the Issue is required rather than inferred.
issue="${issue#\#}"
[ -n "$issue" ] || die "--issue <N> is required: an ADR takes its number from its ticket's Issue"
echo "$issue" | grep -Eq '^[0-9]+$' \
  || die "--issue must be an Issue number (digits, '#' optional): got '$issue'"
[ -n "$ticket" ] || ticket="GH-$issue"

# Humanize the slug for a default title: "single-egress" -> "Single egress".
if [ -z "$title" ]; then
  title="$(echo "$slug" | tr '-' ' ')"
  title="$(echo "${title:0:1}" | tr '[:lower:]' '[:upper:]')${title:1}"
fi

# Number: the Issue number zero-padded to 4 (more digits once an Issue passes 9999). A number is
# "taken" when any ADR file already carries that exact stem, in which case we walk the letter
# suffixes — a ticket that produces several ADRs gets 0320, 0320b, 0320c, and a low Issue number
# colliding with an older sequential ADR is pushed onto a suffix rather than onto someone else's
# number.
number_taken() {
  [ -n "$(find "$dir" -maxdepth 1 -type f -name "$1-*.md" 2>/dev/null | head -1)" ]
}

num="$(printf '%04d' "$((10#$issue))")"
if number_taken "$num"; then
  base="$num"
  num=""
  for letter in b c d e f g h i j k l m n o p q r s t u v w x y z; do
    if ! number_taken "$base$letter"; then
      num="$base$letter"
      break
    fi
  done
  [ -n "$num" ] || die "no number left for Issue $issue: $base and its b–z suffixes are all taken"
fi

out="$dir/$num-$slug.md"
[ ! -e "$out" ] || die "refusing to overwrite existing file: $out"

# Base template: the repo's own TEMPLATE.md if present, else the built-in baseline.
template="$dir/TEMPLATE.md"
read_template() {
  if [ -f "$template" ]; then
    cat "$template"
  else
    cat <<'BASELINE'
---
status: proposed
date: YYYY-MM-DD
ticket: ABC-000
deciders: []
supersedes: []
supersededBy: null
---

# NNNN — Short imperative title

> **Summary.** One to three plain-language sentences: what we decided and why it
> mattered — the thing a human should take away without reading further.

## Context

Why this decision was forced: the problem, the constraints, the forces in play.
State the situation, not the answer.

## Decision

What we decided, in the active voice ("We do X"). This is the load-bearing prose —
code comments cite this by ADR number, so keep it precise.

## Consequences

- Positive outcomes this unlocks.
- **Residual risk / what we accept** — the cost we are knowingly taking on.

## Enforcement / verification

How this decision is kept true over time: a boundary rule, a scripts/* tripwire, a
pattern-scanner rule, a named test — or explicitly "None (narrative/posture ADR)."
BASELINE
  fi
}

# Fill placeholders. Anchored substitutions only (first frontmatter occurrence / the H1)
# so the illustrative NNNN / ABC-XXX in the body examples and comments stay untouched.
#   awk vars carry the values so no shell metacharacters leak into the sed/awk program.
content="$(
  read_template | awk -v date="$date" -v ticket="$ticket" -v deciders="$deciders" \
                      -v num="$num" -v title="$title" '
    BEGIN { in_fm = 0; fm_seen = 0 }
    # Track the single leading frontmatter block (between the first two --- lines).
    /^---[[:space:]]*$/ {
      if (fm_seen == 0) { in_fm = 1; fm_seen = 1; print; next }
      else if (in_fm == 1) { in_fm = 0; print; next }
    }
    in_fm == 1 && /^date:/    { print "date: " date; next }
    in_fm == 1 && /^ticket:/  { print "ticket: " ticket; next }
    in_fm == 1 && /^deciders:/ {
      if (deciders != "") { print "deciders: [" deciders "]" } else { print }
      next
    }
    # The H1 title line: replace only the "NNNN — <rest>" so the number matches the file.
    /^# NNNN — / { print "# " num " — " title; next }
    { print }
  '
)"

# Fail loudly if the chosen template lacked the anchors we fill. A silently mis-filled
# ADR (wrong/absent title number or missing frontmatter keys) would otherwise only blow
# up later in the linter with a confusing message — defeating "passes on first commit".
printf '%s\n' "$content" | grep -q "^# $num — " \
  || die "template has no '# NNNN — <title>' H1 to number (checked $template + built-in); the generated ADR would fail the linter"
printf '%s\n' "$content" | grep -q '^date: ' \
  || die "template frontmatter has no 'date:' key; the generated ADR would fail the linter"
printf '%s\n' "$content" | grep -q '^ticket: ' \
  || die "template frontmatter has no 'ticket:' key; the generated ADR would fail the linter"

printf '%s\n' "$content" > "$out"

echo "created: $out"
echo
echo "Add this row to $dir/README.md (index table, at its numeric position — not always last):"
echo "| [$num]($num-$slug.md) | $title |"
echo
echo "Next:"
echo "  1. Fill Context / Decision / Consequences / Enforcement (keep them in that order)."
echo "  2. Set 'deciders' and write the Summary blockquote."
echo "  3. Add the README index row above."
echo "  4. Validate: bun scripts/check-adr-format.mjs"
