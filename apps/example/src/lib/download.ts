export type Format = 'pptx' | 'docx'

/** A file name for the report: lower case words joined by dashes. */
export function fileName(title: string, format: Format): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || 'report'}.${format}`
}

/** Saves a Blob through a temporary link, which works in every browser without a dialog API. */
export function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.append(link)
  link.click()
  link.remove()
  // Browsers read the blob asynchronously after the click.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
