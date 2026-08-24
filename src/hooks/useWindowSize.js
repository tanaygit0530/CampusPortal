import { useState, useEffect } from 'react'

// Straight from the CH-3 pattern: a custom hook that starts with "use",
// wraps useState + useEffect, and returns reusable logic — here, the
// live viewport size, kept in sync with a 'resize' event listener that's
// cleaned up in the effect's return function.
export default function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}
