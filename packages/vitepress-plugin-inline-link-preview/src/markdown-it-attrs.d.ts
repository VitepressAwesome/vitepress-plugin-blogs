// Type stub for markdown-it-attrs (no official @types package)
// See: https://github.com/arve0/markdown-it-attrs
declare module 'markdown-it-attrs' {
  import type MarkdownIt from 'markdown-it'

  interface Options {
    leftDelimiter?: string
    rightDelimiter?: string
    allowedAttributes?: string[]
  }
  const plugin: MarkdownIt.PluginWithOptions<Options>
  export default plugin
}
