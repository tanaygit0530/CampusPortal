import { events as seedEvents } from '../data/events'

// Exp 4 will replace this whole file's body with:
//   export const fetchEventsApi = () => api.get('/events')
// For now we simulate network latency + an axios-shaped { data } response
// so swapping in the real call later needs zero changes in the components/hooks.
export function fetchEventsApi() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // simulate an occasional network hiccup, ~5% of the time, to prove the
      // error-state UI actually works and isn't just theoretical
      if (Math.random() < 0.05) {
        reject(new Error('Could not reach the events server. Please retry.'))
        return
      }
      resolve({ data: seedEvents })
    }, 700)
  })
}
