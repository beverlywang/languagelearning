"use client";

import { useEffect, useState } from "react";
import styles from "./SpeakButton.module.css";

type Props = {
  text: string;
  lang: "it-IT" | "en-US";
  label?: string;
};

/**
 * Playback uses the browser's built-in speech synthesis: no API key, no cost,
 * no audio files. The tradeoff is that it only plays live - there is nothing to
 * download or listen to offline. Swapping in a TTS API later means replacing
 * this component and storing the returned audio alongside the entry.
 */
export default function SpeakButton({ text, lang, label }: Props) {
  const [supported, setSupported] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    // Voices populate asynchronously in most browsers, and the list is empty on
    // the first synchronous read.
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, []);

  if (!supported) return null;

  const speak = () => {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    const match = voices.find((v) => v.lang.replace("_", "-") === lang);
    if (match) utterance.voice = match;
    utterance.rate = lang === "it-IT" ? 0.9 : 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    synth.speak(utterance);
  };

  const hasVoice = voices.some((v) => v.lang.replace("_", "-").startsWith(lang.slice(0, 2)));

  return (
    <button
      type="button"
      onClick={speak}
      className={styles.button}
      data-speaking={speaking || undefined}
      title={
        hasVoice
          ? undefined
          : `No ${lang.startsWith("it") ? "Italian" : "English"} voice installed - the system default will be used.`
      }
    >
      <span aria-hidden="true">{speaking ? "■" : "▶"}</span>
      {label ?? (speaking ? "Stop" : "Listen")}
    </button>
  );
}
