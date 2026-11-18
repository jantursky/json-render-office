# Security policy

## Supported versions

Only the latest release of each package (`json-render-office`, `json-render-pptx`, `json-render-docx`, `json-render-report`) gets fixes. The four share one version number.

## Reporting a vulnerability

Please don't open a public issue. Email jan.tursky@gmail.com with a description and, if you can, a minimal reproduction spec. GitHub's [private vulnerability reporting](https://github.com/jantursky/json-render-office/security/advisories/new) works too.

You'll get an answer within a week. Once a fix is released, the advisory is published with credit, unless you'd rather stay anonymous.

Issues in the document writers should also go to [vue-pptx-document](https://github.com/jantursky/vue-pptx-document/security) or [vue-docx-document](https://github.com/jantursky/vue-docx-document/security).

## Things to know

- Specs are untrusted model output. Validate them before rendering if you can (`validateProps`), and treat warnings as signals: elements and props that don't fit the catalog are skipped, not repaired.
- Image sources are limited to `https:` URLs and `data:` images (PNG, JPEG, GIF, SVG). Everything else, including local paths, `file:` and `http:`, is blocked with a warning. Fetches have a 10 second timeout, a 10 MB cap (enforced while the body streams) and a content type check. `data:` images count against the same cap and a spec may use at most 50 different images. The default loader refuses redirects that leave https and host names or addresses written as private, loopback or link-local literals (`localhost`, `10.x`, `169.254.x`, `[::1]` and so on). It does not resolve DNS, so a public host name that points to a private address gets through: pass a `loadImage` with a host allowlist for untrusted specs. Data URIs must start with the bytes of the image type they declare (see `packages/json-render-office/src/images.ts`).
- The default image loader follows https redirects and does not block private network addresses. A server that renders specs from untrusted sources can be made to request internal URLs, so pass your own `loadImage` with a host allowlist or a proxy instead.
- Text from the spec is escaped by the writers when it is put into the XML parts of the file.
- The generated files are never executed or opened by these packages. They contain no macros. LibreOffice is only used by the test suite.
