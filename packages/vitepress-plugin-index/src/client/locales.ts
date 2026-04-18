// Derived from @nolebase/vitepress-plugin-index (MIT) https://github.com/nolebase/integrations
import type { Locale } from './types'

import { defaultEnLocale, defaultZhCNLocale } from '../locales/index'

export {
  defaultEnLocale,
  defaultZhCNLocale,
}

export const defaultLocales: Record<string, Locale> = {
  'en-US': defaultEnLocale,
  'en': defaultEnLocale,
  'zh-CN': defaultZhCNLocale,
  'zh-Hans': defaultZhCNLocale,
  'zh': defaultZhCNLocale,
}
