# Changelog

All notable changes to `json-render-office` are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-11-27

### Added

- `createImageLoader(options)` builds the default image loader with limits. `fetchImage` is the same loader with the defaults.
- `ImageLoadOptions`: `timeoutMs` (10 s), `signal` (aborting it rejects the render), `concurrency` (6 images at once), `maxBytes` (10 MB) and `allowedHosts` (remote images from other hosts are skipped).
- `ImageBlockedError`, the error a loader throws to report a refused source.
- `preloadImages` takes the options as a fifth argument.

### Changed

- An image over the byte cap, from a loader or a `data:` URI, is reported as `blocked-image` instead of `image-failed`. It is still left out of the file.
- With `allowedHosts` set, a browser that hides a redirect target refuses the redirect, because the target cannot be checked.

## [1.0.1] - 2026-11-18

### Fixed

- A spec that contains itself, a `repeat` over a value that is not a list, and element types named like `toString` no longer crash a render. They are skipped with a warning.
- Props that fail their component's schema are skipped with a `bad-props` warning instead of throwing. A missing nullable prop counts as `null`.
- Images inside a `repeat` are loaded. Data URIs must start with the bytes of the type they declare.
- The default image loader enforces the 10 MB cap while the body streams, follows at most three redirects, refuses redirects away from https and private addresses written as literals, and a spec may use at most 50 different images.

## [1.0.0] - 2026-11-17

### Added

- The shared base of the json-render Office renderers: `walkSpec` turns a flat `{ root, elements }` spec into a Vue VNode tree, resolving `visible`, `repeat` and `$state` / `$cond` / `$template` expressions with `@json-render/core`.
- Partial and streamed specs never throw: missing roots, missing child keys and unknown types are skipped and reported through a warning handler.
- Safe image loading: only `https:` URLs and `data:` images are read, with a 10 s timeout, a 10 MB cap and a content type check. `preloadImages` loads every `Image` source before rendering, and a custom `ImageLoader` can add a proxy or an allowlist.
- `defineOfficeSchema` and the rules every Office catalog shares, `validateProps` for the per-component limits in the Zod schemas, and a base theme (colors, fonts, chart palette) that decks, documents and web pages read alike.

[1.1.0]: https://www.npmjs.com/package/json-render-office/v/1.1.0
[1.0.1]: https://www.npmjs.com/package/json-render-office/v/1.0.1
[1.0.0]: https://www.npmjs.com/package/json-render-office/v/1.0.0
