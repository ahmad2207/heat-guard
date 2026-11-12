import { describe, expectTypeOf, it } from 'vitest'
import type {
  AuthTokensResponse,
  HealthCheckResponse,
  MePrecaution,
  MeResponse,
  MyHelpRequest,
  MyRiskResponse,
  SiteHelpRequest,
  SiteTodayResponse,
  UserMeResponse,
} from './responses'

// These checks run in the type-checker (npm run build): a wrong path or method would make the
// alias "never" and fail the build instead of silently accepting anything.
describe('generated response types', () => {
  it('resolve to real shapes', () => {
    expectTypeOf<HealthCheckResponse>().not.toBeNever()
    expectTypeOf<AuthTokensResponse['refreshToken']>().toEqualTypeOf<string>()
    expectTypeOf<UserMeResponse['role']>().toEqualTypeOf<string>()
    expectTypeOf<MyRiskResponse['nextBreak']['durationMinutes']>().toEqualTypeOf<number>()
    expectTypeOf<MyRiskResponse['action']['what']>().toEqualTypeOf<string>()
    expectTypeOf<SiteTodayResponse['workersOnShift']>().toEqualTypeOf<number>()
    expectTypeOf<MyHelpRequest['detailsShared']>().toEqualTypeOf<boolean>()
    expectTypeOf<SiteHelpRequest['workerCode']>().toEqualTypeOf<string>()
    expectTypeOf<MeResponse['user']['loginId']>().toEqualTypeOf<string>()
    expectTypeOf<MePrecaution['level']>().toEqualTypeOf<'standard' | 'enhanced' | 'high_priority'>()
    expectTypeOf<MePrecaution['restrictions']>().toEqualTypeOf<string[]>()
  })
})
