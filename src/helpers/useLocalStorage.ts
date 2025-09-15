import { useEffect, useState } from "react"

export const LOCAL_STORAGE_PREFIX = "GLIDE-"

export const useLocalStorage = (
  key: string,
  initialValue: string
): [string, (value: string) => void] => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    const storedValue = localStorage.getItem(LOCAL_STORAGE_PREFIX + key)
    if (storedValue) {
      setValue(storedValue)
    }
  }, [key])

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, value)
  }, [key, value])

  return [value, setValue]
}
