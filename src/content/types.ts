export type LangCode = 'no' | 'tl';

/** A word or short phrase taught in lessons and scheduled for review. */
export interface Item {
  id: string; // stable, e.g. "no-hei" — never change once shipped (review history keys off it)
  target: string; // the word/phrase in the language being learned
  english: string; // short English meaning shown to the learner
  unit: string; // Unit.id this item belongs to
  alts?: string[]; // other accepted spellings/answers in the target language
  note?: string; // optional one-line tip (grammar, usage, pronunciation)
}

export interface Unit {
  id: string;
  title: string;
  emoji: string;
}

/** A "Tonight's phrase" to try out in real conversation at home. */
export interface Phrase {
  id: string;
  target: string;
  english: string;
  context: string; // when you'd say it, e.g. "At dinner"
}

export interface Course {
  lang: LangCode;
  name: string; // "Norwegian"
  flag: string; // emoji flag
  ttsLang: string; // BCP-47 tag for speech, e.g. "nb-NO", "fil-PH"
  units: Unit[]; // in teaching order
  items: Item[];
  phrases: Phrase[];
}
