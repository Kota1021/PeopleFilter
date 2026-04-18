import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Observe the clientWidth of a DOM element. Used by SVG charts that need to know
 * the actual rendered pixel width in order to compensate for viewBox scaling.
 * Initial width is 720 (matches the default viewBox) so first render is stable.
 */
export function useContainerWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(720)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      if (w > 0) setWidth(w)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, width]
}
