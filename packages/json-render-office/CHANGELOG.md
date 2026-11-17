# Changelog

All notable changes to `json-render-office` are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - Unreleased

### Added

- The shared base of the json-render Office renderers: `walkSpec` turns a flat `{ root, elements }` spec into a Vue VNode tree, resolving `visible`, `repeat` and `$state` / `$cond` / `$template` expressions with `@json-render/core`.
- Partial and streamed specs never throw: missing roots, missing child keys and unknown types are skipped and reported through a warning handler.
- Safe image loading: only `https:` URLs and `data:` images are read, with a 10 s timeout, a 10 MB cap and a content type check. `preloadImages` loads every `Image` source before rendering, and a custom `ImageLoader` can add a proxy or an allowlist.
- `defineOfficeSchema` and the rules every Office catalog shares, `validateProps` for the per-component limits in the Zod schemas, and a base theme (colors, fonts, chart palette) that decks, documents and web pages read alike.

[1.0.0]: https://www.npmjs.com/package/json-render-office/v/1.0.0
