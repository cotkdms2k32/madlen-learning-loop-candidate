export type ContentLocale = "en" | "tr";

const TURKISH_CHARACTERS = /[çğıöşüÇĞİÖŞÜ]/g;
const TURKISH_WORDS = new Set([
  "ama", "artık", "bir", "bu", "çünkü", "da", "daha", "de", "değil", "evet",
  "gibi", "için", "ile", "mi", "nasıl", "neden", "ne", "olan", "olarak",
  "hayır", "öğrenci", "öğrenciler", "sonra", "şimdi", "tamam", "ve", "veya",
]);
const ENGLISH_WORDS = new Set([
  "a", "an", "and", "are", "because", "but", "for", "from", "how", "in",
  "is", "of", "or", "student", "students", "that", "the", "this", "to",
  "what", "when", "why", "with",
]);

export function detectContentLocale(text: string): ContentLocale {
  const characterScore = (text.match(TURKISH_CHARACTERS) ?? []).length * 2;
  const words = text
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-zçğıöşü]+/gi, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const turkishScore = characterScore + words.filter((word) => TURKISH_WORDS.has(word)).length;
  const englishScore = words.filter((word) => ENGLISH_WORDS.has(word)).length;

  return turkishScore > englishScore ? "tr" : "en";
}

export function contentLanguageName(locale: ContentLocale) {
  return locale === "tr" ? "Turkish" : "English";
}

export function contentLanguageInstruction(locale: ContentLocale) {
  if (locale === "tr") {
    return "Required response language: Turkish. Write every generated title, explanation, rationale, feedback comment, question, and summary in natural Turkish. Keep only fixed machine-readable enum values in their required English form.";
  }

  return "Required response language: English. Write every generated title, explanation, rationale, feedback comment, question, and summary in English.";
}
