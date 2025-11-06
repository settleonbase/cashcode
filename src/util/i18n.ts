// i18n.ts
export type Lang = "cn" | "en" | "ja";
export type TranslateFn = (cn: string, en: string, ja?: string) => string;

export const makeT = (lang: Lang): TranslateFn => (cn, en, ja) => {
  if (lang === "cn") return cn;
  if (lang === "en") return en;
  return ja ?? en;
};