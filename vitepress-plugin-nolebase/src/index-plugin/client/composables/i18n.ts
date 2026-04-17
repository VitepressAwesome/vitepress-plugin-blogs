// Derived from @nolebase/vitepress-plugin-index (MIT) https://github.com/nolebase/integrations
import { createI18n } from '../../../ui/index.ts'

import { InjectionKey } from '../constants'
import { defaultEnLocale, defaultLocales } from '../locales'

export const useI18n = createI18n(InjectionKey, defaultLocales, defaultEnLocale)
