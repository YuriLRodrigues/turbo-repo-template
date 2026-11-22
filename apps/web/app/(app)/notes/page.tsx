import type { Metadata } from 'next'

import { NotesScreen } from './components/notes-screen'

export const metadata: Metadata = { title: 'Notes' }

const NotesPage = () => <NotesScreen />

export default NotesPage
