import { useCallback, useEffect } from 'react'

const supported =
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  typeof window.SpeechSynthesisUtterance === 'function'

/**
 * Reads text aloud with the browser's speech synthesis.
 * `speak` is undefined when the browser cannot speak, so callers can hide their Listen button.
 */
export function useSpeech(): { speak: ((text: string) => void) | undefined } {
  // Stop talking when the screen that started it goes away.
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel()
    }
  }, [])

  const speak = useCallback((text: string) => {
    const synth = window.speechSynthesis
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = document.documentElement.lang || 'en'
    synth.speak(utterance)
  }, [])

  return { speak: supported ? speak : undefined }
}
