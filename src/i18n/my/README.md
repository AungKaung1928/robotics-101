# Burmese strings (generated, lane my)

One JSON file per English source table. Written by the translation pipeline, never by hand in a chapter.

| File | Source |
|---|---|
| `core.json` | `en` in `src/i18n.ts` |
| `titles.json` | chapter titles: `{ "<ChapterMeta.id>": "..." }` |
| `<dir>.<base>.<EXPORT>.json` | `src/chapters/<dir>/<base>.strings.ts`, export `<EXPORT>`, its `en` object. Example: `l0.tools.TOOLS_STRINGS.json` |

Shape: the same nested keys as the English object (arrays by index), string leaves only. Leave out any string that is not
ready: the app shows the English string in its place (`overlay` in `src/i18n.ts`). Functions (e.g. `wv.jump`) stay English.

Rules checked by `src/i18n.parity.test.ts`: every key must exist in the English source (unknown key = red); numbers and
`code` spans equal the English string's; Western digits 0-9, Myanmar Unicode only (no Zawgyi).
