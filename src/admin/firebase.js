// Sign-in reuses the sanero-media Firebase project — the owner account there
// carries the `superAdmin` claim this dashboard requires. A named app keeps it
// separate from anything else that might initialise Firebase on the page.
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const app = initializeApp(
  {
    apiKey: 'AIzaSyDYTLjp2sbNfxHHOjms-i0cMDceZz1Vug8',
    authDomain: 'sanero-media.firebaseapp.com',
    projectId: 'sanero-media',
  },
  'vp-admin'
)

export const auth = getAuth(app)
export const db = getFirestore(app)

// Notes, links and hand-added sites, one doc per site. Owner-only in
// sanero-next/firestore.rules.
export const SITES_COLLECTION = 'vp_sites'
