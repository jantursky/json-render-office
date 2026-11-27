# Changelog

All notable changes to `json-render-report` are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-11-27

### Changed

- Uses the 1.1.0 Office renderers. No API change.

## [1.0.1] - 2026-11-18

### Fixed

- The web preview loads only `https:` and `data:` images, as the Office renderers do, and chart colours cycle correctly for palettes of any length.

## [1.0.0] - 2026-11-17

### Added

- One json-render report catalog for three outputs: `Report`, `Chapter`, `Paragraph`, `BulletList`, `Table`, `Chart` and `Image`.
- `renderToPptx` writes a cover and one slide per chapter, with native tables and native charts. `renderToDocx` writes a title and a heading per chapter, with charts as tables of their numbers. `renderToPptxBlob` and `renderToDocxBlob` return Blobs for the browser.
- `json-render-report/web` renders the same spec as plain HTML and SVG, themed through CSS custom properties, with `webRegistry`, `webStyles` and `themeStyle` for a live preview next to the download buttons.
- `json-render-report/server` exports the schema and component definitions without Vue or a writer.
- An agent skill that tells a model how to write report specs.

[1.1.0]: https://www.npmjs.com/package/json-render-report/v/1.1.0
[1.0.1]: https://www.npmjs.com/package/json-render-report/v/1.0.1
[1.0.0]: https://www.npmjs.com/package/json-render-report/v/1.0.0
