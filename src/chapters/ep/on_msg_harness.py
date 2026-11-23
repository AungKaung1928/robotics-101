"""Runs the on_msg code exactly as the EP2 page shows it (passed in as text) over the page's 20 messages.
argv: code, keep (0/1: un-comment the stamp check line), max_age (ms), delays as JSON (ms). Prints [acted, back]."""
import json
import sys
from types import SimpleNamespace

code, keep, max_age, delays = sys.argv[1], sys.argv[2] == '1', float(sys.argv[3]), json.loads(sys.argv[4])
if keep:
    code = code.replace('# if stamp', 'if stamp')
newest = float('-inf')
used = []
_now = [0.0]


def now():
    return _now[0]


def act(msg):
    used.append(msg.header.stamp)


exec(code, globals())  # defines on_msg in this module, so a `global newest` in it refers to the newest above
for arrive, stamp in sorted((i * 100 + d, i * 100) for i, d in enumerate(delays)):
    _now[0] = arrive
    on_msg(SimpleNamespace(header=SimpleNamespace(stamp=stamp)))  # noqa: F821 (defined by exec)
back = sum(1 for k, s in enumerate(used) if k and s < max(used[:k]))
print(json.dumps([len(used), back]))
