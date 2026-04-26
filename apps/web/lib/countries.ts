export type Country = {
  code: string; // ISO 3166-1 alpha-3
  name: string;
  flag: string;
};

// Curated short list covering hackathon target regions and major economies.
export const COUNTRIES: Country[] = [
  { code: "USA", name: "United States", flag: "🇺🇸" },
  { code: "MEX", name: "Mexico", flag: "🇲🇽" },
];

export function findCountry(code: string): Country | undefined {
  const c = (code || "").toUpperCase();
  return COUNTRIES.find((x) => x.code === c);
}
