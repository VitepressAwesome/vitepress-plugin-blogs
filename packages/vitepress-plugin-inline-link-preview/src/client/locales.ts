// Derived from @nolebase/vitepress-plugin-inline-link-preview (MIT) https://github.com/nolebase/integrations
import type { Locale } from './types'

import { defaultEnLocale, defaultZhCNLocale } from '../locales/index'

export {
  defaultEnLocale,
  defaultZhCNLocale,
}

export const defaultLocales: Record<string, Locale> = {
  'zh-CN': defaultZhCNLocale,
  'zh-Hans': defaultZhCNLocale,
  'zh': defaultZhCNLocale,
  'en-US': defaultEnLocale,
  'en': defaultEnLocale,
}
