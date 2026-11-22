import { Closing, Faq, Features, Hero, HowItWorks } from '@/components/sections'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'

/** The product page: a promise, what it does, how to start, the usual questions and the call to start. */
const HomePage = () => (
  <>
    <SiteHeader />
    <main>
      <Hero />
      <Features />
      <HowItWorks />
      <Faq />
      <Closing />
    </main>
    <SiteFooter />
  </>
)

export default HomePage
