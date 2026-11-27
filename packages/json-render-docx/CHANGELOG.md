# Changelog

All notable changes to `json-render-docx` are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-11-27

### Added

- `imageOptions` in `RenderOptions`: the same limits as the office loader (timeout, abort signal, concurrency, byte cap, host allowlist). Used when no `loadImage` is given.
- `createImageLoader` and `ImageLoadOptions` are exported.

### Changed

- Requires `json-render-office` 1.1.0.

## [1.0.1] - 2026-11-18

### Fixed

- Bad props, cycles and a `repeat` over a non-list are skipped with a warning instead of rejecting the render. An image whose bytes are not the declared type is left out with an `image-failed` warning.

## [1.0.0] - 2026-11-17

### Added

- A json-render catalog and schema for Word documents: `Document`, `Section`, `Header`, `Footer`, `Title`, `Heading`, `Paragraph`, `List`, `Table`, `Image`, `PageBreak` and `TableOfContents`.
- `renderToBuffer`, `renderToBlob` and `renderToFile` write editable `.docx` files with real headings, lists, native tables whose header row repeats across pages, headers, footers, page numbers and a table of contents, built on `vue-docx-document`.
- Custom Vue components through `registry`, `theme` and `state` options, `onWarn` for skipped elements and unusable props, and `loadImage` to replace the default image loader.
- `json-render-docx/server` exports the schema and component definitions without Vue or the Word writer, for code that only builds prompts.
- An agent skill that tells a model how to write specs for the catalog.

[1.1.0]: https://www.npmjs.com/package/json-render-docx/v/1.1.0
[1.0.1]: https://www.npmjs.com/package/json-render-docx/v/1.0.1
[1.0.0]: https://www.npmjs.com/package/json-render-docx/v/1.0.0
