export function speak(text: string): void {
  if (!text || typeof speechSynthesis === "undefined") return;
  const line = new SpeechSynthesisUtterance(text);
  line.rate = 1;
  speechSynthesis.cancel();
  speechSynthesis.speak(line);
}
