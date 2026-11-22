import { HomePage } from '@/components/home-page'
import { resolveLocale } from '@/i18n/params'

/** `/en/` and `/es/`: the page in the language of the prefix. */
const LocaleHomePage = async ({ params }: PageProps<'/[lang]'>) => <HomePage lang={await resolveLocale(params)} />

export default LocaleHomePage
