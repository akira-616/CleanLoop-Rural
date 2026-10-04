import { en } from './en';
import { hi } from './hi';

export type Language = 'en' | 'hi';

export function getDictionary(lang: Language) {
  return lang === 'hi' ? hi : en;
}
