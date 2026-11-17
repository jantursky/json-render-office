# Contributing

Thanks for helping. Bug reports, docs fixes and pull requests are all welcome.

## Before you start

- For anything bigger than a small fix, open an issue first so we can agree on the approach.
- If a file renders wrong, check whether the same tree built directly with [vue-pptx-document](https://github.com/jantursky/vue-pptx-document) or [vue-docx-document](https://github.com/jantursky/vue-docx-document) shows it too. If it does, the bug belongs there; these packages only build the tree.

## Setup

You need [Bun](https://bun.sh) 1.3+ and Node.js 22.19+ (the version is in `.node-version`).

```sh
bun install
bun run build   # the example app and the docs read the built packages
```

## Where things live

| path                          |                                                                             |
| ----------------------------- | --------------------------------------------------------------------------- |
| `packages/json-render-office` | Shared spec walker, safe image loading, themes and warnings.                |
| `packages/json-render-pptx`   | Catalog and renderer for `.pptx`.                                           |
| `packages/json-render-docx`   | Catalog and renderer for `.docx`.                                           |
| `packages/json-render-report` | One report catalog for the web, `.pptx` and `.docx`. Depends on the others. |
| `apps/example`                | The demo and its Playwright end-to-end tests.                               |
| `apps/docs`                   | The documentation site.                                                     |
| `scripts`                     | The pack test and the Open XML SDK validator.                               |

The build order is `json-render-office`, then `json-render-pptx` and `json-render-docx`, then `json-render-report`. `bun run build` follows it.

## Checks

```sh
bun run check          # format, lint, typecheck, unit tests with coverage
bun run build          # all packages, in dependency order
bun run size           # size-limit budgets, after build
bun run lint:package   # publint and are-the-types-wrong, after build
bun run test:pack      # packs the tarballs and installs them into empty Node and Vite projects, after build
bun run test:e2e       # builds the packages and drives the example app with Playwright
```

CI runs all of them on every pull request, plus two checks that need extra tools:

- **LibreOffice oracle.** LibreOffice opens the generated `.pptx` and `.docx` and converts them to PDF, which proves that a second implementation can read the files. It is a test oracle only and is never used at runtime. Install LibreOffice and poppler (`brew install --cask libreoffice && brew install poppler`, or `apt-get install libreoffice-writer libreoffice-impress poppler-utils`), then run `bun run --filter json-render-report test:oracle`.
- **Open XML SDK validation.** `scripts/validate-ooxml` renders the fixture specs and validates them against the Office schemas with the .NET Open XML SDK. Locally: `node scripts/validate-ooxml/render-fixtures.mjs out && dotnet run --project scripts/validate-ooxml -- out`.

## Conventions

- TypeScript strict, Prettier formatting (`bun run format`), ESLint with no warnings.
- Every behavior change comes with a test. Unit tests render real files and read the XML back.
- The `./server` entries must stay free of Vue and the document engines. `bun run test:pack` checks it.
- Add a line under `## [Unreleased]` in the `CHANGELOG.md` of each package users will notice a change in.
- Commits are short and imperative, one change each, such as `Fix table header row on page breaks`.
- Breaking changes need a new major version and an entry under **Changed**.

## Releasing

The four packages share one version. Bump it in all four `package.json` files, turn `## [Unreleased]` in each changelog into the new version, and push a tag such as `1.0.1`. The release workflow publishes to npm with trusted publishing.

## License

By contributing you agree that your contributions are licensed under the MIT license.
