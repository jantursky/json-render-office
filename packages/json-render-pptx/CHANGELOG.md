# Changelog

All notable changes to `json-render-pptx` are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Table borders use the theme's rule colour.
- Bad props, cycles and a `repeat` over a non-list are skipped with a warning instead of rejecting the render.

## [1.0.0] - Unreleased

### Added

- A json-render catalog and schema for PowerPoint decks: `Deck`, `Slide`, `Columns`, `Column`, `Title`, `Subtitle`, `Text`, `BulletList`, `Table`, `Chart` and `Image`. Slide layouts place the content, so a spec never carries coordinates.
- `renderToBuffer`, `renderToBlob` and `renderToFile` write editable `.pptx` files with real text boxes, native tables, native charts (bar, line, pie, doughnut, area), speaker notes and slide numbers, built on `vue-pptx-document`.
- Custom Vue components through `registry`, `theme` and `state` options, `onWarn` for skipped elements and unusable props, and `loadImage` to replace the default image loader.
- `json-render-pptx/server` exports the schema and component definitions without Vue or the PowerPoint writer, for code that only builds prompts.
- An agent skill that tells a model how to write specs for the catalog.

[1.0.0]: https://www.npmjs.com/package/json-render-pptx/v/1.0.0
