import { DependencyList, useEffect, useState } from "react"

type AsyncState<T> = [T | undefined, boolean, Error | undefined]

export const useAsync = <T>(
  fn: () => Promise<T>,
  dependencies: DependencyList = [],
  onUnmount?: (value?: T) => void
) => {
  const [state, setState] = useState<AsyncState<T>>([
    undefined,
    true,
    undefined,
  ])

  useEffect(() => {
    let mounted = true
    let value: T | undefined

    fn()
      .then((result) => {
        value = result
        mounted && setState([result, false, undefined])
      })
      .catch((error) => mounted && setState([undefined, false, error]))

    return () => {
      mounted = false
      if (onUnmount) onUnmount(value)
    }
  }, dependencies) // eslint-disable-line react-hooks/exhaustive-deps

  return state
}

export const useAsyncEffect = (
  fn: (mountedRef: { current: boolean }) => Promise<void | (() => void)>,
  onError: (error: Error) => void = (error) =>
    console.error("Error in useAsyncEffect:", error),
  dependencies: DependencyList = []
) => {
  useEffect(() => {
    const mountedRef = { current: true }
    const cleanUpRef = { current: undefined as void | (() => void) }

    fn(mountedRef)
      .then((cleanUpFn) => {
        if (cleanUpFn) {
          cleanUpRef.current = cleanUpFn
        }
      })
      .catch((error) => {
        if (mountedRef.current) {
          onError(error)
        }
      })

    return () => {
      mountedRef.current = false
      cleanUpRef.current?.()
    }
  }, dependencies) // eslint-disable-line react-hooks/exhaustive-deps
}
