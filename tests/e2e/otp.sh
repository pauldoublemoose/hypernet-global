#!/usr/bin/env bash
# Prints the newest Hypernet / Neon Auth login code sent to ONE plus-address of the owner's Gmail, e.g.
#   tests/e2e/otp.sh michal.kucera04+hn1@gmail.com [after-epoch-seconds]
# It searches only for that exact recipient and the auth sender, reads only the newest match, prints only the code.
set -euo pipefail
to="${1:?usage: otp.sh <plus-address> [after-epoch-seconds]}"
after="${2:-$(( $(date +%s) - 900 ))}"
case "$to" in michal.kucera04+hn*@gmail.com) ;; *) echo "only +hn test addresses" >&2; exit 2 ;; esac
q="to:$to after:$after (from:auth@mail.myneon.app OR subject:\"Hypernet code\")"
id=$(gws gmail users messages list --params "$(python3 -c 'import json,sys; print(json.dumps({"userId":"me","q":sys.argv[1],"maxResults":1}))' "$q")" 2>/dev/null \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); m=d.get("messages") or []; print(m[0]["id"] if m else "")')
[ -n "$id" ] || exit 1
gws gmail users messages get --params "{\"userId\":\"me\",\"id\":\"$id\",\"format\":\"full\"}" 2>/dev/null | python3 -c '
import sys, json, base64, re
m = json.load(sys.stdin)
def walk(p):
    out = []
    if p.get("body", {}).get("data"): out.append(base64.urlsafe_b64decode(p["body"]["data"]).decode("utf-8", "replace"))
    for q in p.get("parts", []) or []: out += walk(q)
    return out
subj = next((h["value"] for h in m["payload"]["headers"] if h["name"].lower() == "subject"), "")
text = subj + "\n" + "\n".join(walk(m["payload"]))
text = re.sub(r"<[^>]+>", " ", text)
hit = re.search(r"(?<![0-9#])([0-9]{3}) ?([0-9]{3})(?![0-9])", text)
print(hit.group(1) + hit.group(2) if hit else "", end="")
'
