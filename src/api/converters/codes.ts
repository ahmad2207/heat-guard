import type { components } from '../schema'

/** Backend schemas, generated from docs/backend/openapi.json (npm run generate-api-types). */
export type Schemas = components['schemas']

export type LanguageCode = NonNullable<Schemas['UpdatePreferencesDto']['language']>
export type AgeRangeCode = NonNullable<Schemas['UpdateOwnHealthDataDto']['ageRange']>
export type PrecautionCode = NonNullable<Schemas['HealthProfile']['precautionLevel']>
export type ConfidenceCode = Schemas['EnvironmentalReading']['confidence']

/** Builds both lookups from one table, so the two directions can never disagree. */
export function twoWay<App extends string, Code extends string>(
  pairs: ReadonlyArray<readonly [App, Code]>,
) {
  const toCode = new Map<string, Code>(pairs.map(([app, code]) => [app, code]))
  const fromCode = new Map<string, App>(pairs.map(([app, code]) => [code, app]))
  return {
    /** The backend code for an app value, or null if there is none. */
    toCode: (value: string): Code | null => toCode.get(value) ?? null,
    /** The app value for a backend code, or null for an unknown code. Never shows the code. */
    fromCode: (code: unknown): App | null =>
      typeof code === 'string' ? (fromCode.get(code) ?? null) : null,
  }
}
