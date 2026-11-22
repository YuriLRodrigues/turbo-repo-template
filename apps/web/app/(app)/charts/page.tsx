import type { Metadata } from 'next'

import { ChartsScreen } from './components/charts-screen'

export const metadata: Metadata = { title: 'Charts' }

const ChartsPage = () => <ChartsScreen />

export default ChartsPage
