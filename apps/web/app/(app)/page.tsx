import type { Metadata } from 'next'

import { HomeScreen } from './components/home-screen'

export const metadata: Metadata = { title: 'Home' }

const HomePage = () => <HomeScreen />

export default HomePage
