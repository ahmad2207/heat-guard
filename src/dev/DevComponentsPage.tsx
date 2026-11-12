import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button, ButtonLink } from '../components/Button'
import type { ButtonSize, ButtonVariant } from '../components/buttonClasses'
import { Card } from '../components/Card'
import { CheckTile } from '../components/CheckTile'
import { Chip } from '../components/Chip'
import { ForecastStrip, type ForecastHour } from '../components/ForecastStrip'
import { ListenButton } from '../components/ListenButton'
import { PrivacyFooter } from '../components/PrivacyFooter'
import { RadioTile } from '../components/RadioTile'
import { RiskBadge, type RiskBadgeSize } from '../components/RiskBadge'
import { RiskCard } from '../components/RiskCard'
import { SectionLabel } from '../components/SectionLabel'
import { StatusPill, type PillStatus } from '../components/StatusPill'
import { SupervisorHeader, type SupervisorTab } from '../components/SupervisorHeader'
import { Switch } from '../components/Switch'
import { WorkerBottomNav, type WorkerTab } from '../components/WorkerBottomNav'
import { cn } from '../lib/cn'
import { RISK_LEVELS, riskClasses } from '../lib/risk'

// Demo values for this component library only. Screen data goes in src/data/mock.ts (Phase 2).
const WORKER_HOURS: ForecastHour[] = [
  { time: '11:00', level: 3 },
  { time: '12:00', level: 3 },
  { time: '13:00', level: 4, possible: true },
  { time: '14:00', level: 4, possible: true },
  { time: '15:00', level: 3 },
  { time: '16:00', level: 2 },
]

const SAVED_HOURS: ForecastHour[] = [
  { time: '11:00', level: 3 },
  { time: '12:00', level: 3 },
  { time: '13:00', level: 4, possible: true },
  { time: '14:00', level: 3 },
]

const SITE_HOURS: ForecastHour[] = [
  { time: '07', level: 1 },
  { time: '08', level: 1 },
  { time: '09', level: 2 },
  { time: '10', level: 3, now: true },
  { time: '11', level: 3 },
  { time: '12', level: 3 },
  { time: '13', level: 4, possible: true },
  { time: '14', level: 4, possible: true },
  { time: '15', level: 3 },
  { time: '16', level: 2 },
  { time: '17', level: 2 },
]

const BADGE_SIZES: RiskBadgeSize[] = ['sm', 'md', 'lg']
const BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'danger']
const BUTTON_SIZES: ButtonSize[] = ['sm', 'md', 'lg']
const PILLS: PillStatus[] = [
  'done',
  'acknowledged',
  'pending',
  'ok',
  'check',
  'act-now',
  'sample-data',
  'hazard-moderate',
  'hazard-possible',
]
const WORKER_TABS: WorkerTab[] = ['status', 'report', 'my-data']
const SUPERVISOR_TABS: SupervisorTab[] = ['today', 'plan', 'measures']

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="m-0 px-1 text-[20px] font-extrabold">{title}</h2>
      {children}
    </section>
  )
}

function Note({ children }: { children: ReactNode }) {
  return <p className="m-0 text-[13px] text-muted">{children}</p>
}

export default function DevComponentsPage() {
  const [switches, setSwitches] = useState({ health: true, band: false, reports: true })
  const [ticks, setTicks] = useState({ headache: false, dizzy: true, heart: true, kidney: false })
  const [history, setHistory] = useState('no')

  return (
    <div className="min-h-screen bg-ground text-ink">
      <div className="mx-auto flex max-w-[430px] flex-col gap-8 px-4 py-6">
        <header className="flex flex-col gap-1 px-1">
          <Link to="/" className="inline-flex min-h-11 items-center text-[15px] font-bold text-ink">
            Back to home
          </Link>
          <h1 className="m-0 text-[26px] font-extrabold">Component library</h1>
          <Note>
            Temporary page for checking shared components. Removed from production in Phase 9.
          </Note>
        </header>

        <Group title="RiskBadge">
          {BADGE_SIZES.map((size) => (
            <Card key={size} className="flex flex-col gap-3">
              <SectionLabel as="h3">Size {size}</SectionLabel>
              <div className="flex flex-wrap items-center gap-2">
                {RISK_LEVELS.map((level) => (
                  <RiskBadge key={level} level={level} size={size} />
                ))}
                <RiskBadge level={4} size={size} possible />
              </div>
            </Card>
          ))}
        </Group>

        <Group title="RiskCard">
          {RISK_LEVELS.map((level) => (
            <RiskCard key={level} level={level} onListen={() => {}} />
          ))}
        </Group>

        <Group title="ForecastStrip">
          <Card className="flex flex-col gap-3">
            <SectionLabel as="h3">Worker, next 6 hours</SectionLabel>
            <ForecastStrip hours={WORKER_HOURS} />
          </Card>
          <Card className="flex flex-col gap-3">
            <SectionLabel as="h3">Worker, saved (field mode)</SectionLabel>
            <ForecastStrip hours={SAVED_HOURS} saved />
          </Card>
          <Card className="flex flex-col gap-3">
            <SectionLabel as="h3">Site, hour by hour</SectionLabel>
            <ForecastStrip hours={SITE_HOURS} variant="site" />
            <Note>Scrolls sideways on a phone. The current hour is outlined.</Note>
          </Card>
        </Group>

        <Group title="Card">
          <Card>
            <p className="m-0 text-[15px]">Worker card: 16px radius, 16px padding.</p>
          </Card>
          <Card variant="page">
            <p className="m-0 text-[15px]">Page card: 18px radius, 22px padding.</p>
          </Card>
        </Group>

        <Group title="Button">
          {BUTTON_SIZES.map((size) => (
            <Card key={size} className="flex flex-col gap-3">
              <SectionLabel as="h3">Size {size}</SectionLabel>
              {BUTTON_VARIANTS.map((variant) => (
                <Button key={variant} variant={variant} size={size} fullWidth>
                  {variant[0].toUpperCase() + variant.slice(1)}
                </Button>
              ))}
            </Card>
          ))}
          <Card className="flex flex-col gap-3">
            <SectionLabel as="h3">Disabled and link</SectionLabel>
            <Button disabled fullWidth>
              Disabled primary
            </Button>
            <Button variant="secondary" disabled fullWidth>
              Disabled secondary
            </Button>
            <ButtonLink to="/" variant="secondary" fullWidth>
              Link styled as a button
            </ButtonLink>
          </Card>
        </Group>

        <Group title="Switch">
          <Card className="py-1">
            <Switch
              label="Health precautions"
              description="Lets HeatGuard give you extra care based on your health answers. Without it you get standard advice."
              checked={switches.health}
              onChange={(health) => setSwitches((s) => ({ ...s, health }))}
              divider
            />
            <Switch
              label="Wearable band"
              description="Heart rate and skin temperature for earlier warnings. You can pause it any time."
              checked={switches.band}
              onChange={(band) => setSwitches((s) => ({ ...s, band }))}
              divider
            />
            <Switch
              label="Symptom reports"
              checked={switches.reports}
              onChange={(reports) => setSwitches((s) => ({ ...s, reports }))}
            />
          </Card>
        </Group>

        <Group title="CheckTile">
          <Card className="flex flex-col gap-2">
            <SectionLabel as="h3">Without hint (report)</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              <CheckTile
                label="Headache"
                checked={ticks.headache}
                onChange={(headache) => setTicks((t) => ({ ...t, headache }))}
              />
              <CheckTile
                label="Dizzy"
                checked={ticks.dizzy}
                onChange={(dizzy) => setTicks((t) => ({ ...t, dizzy }))}
              />
            </div>
          </Card>
          <Card className="flex flex-col gap-2">
            <SectionLabel as="h3">With hint (health profile)</SectionLabel>
            <CheckTile
              label="Heart or blood pressure"
              hint="For example heart disease or high blood pressure"
              checked={ticks.heart}
              onChange={(heart) => setTicks((t) => ({ ...t, heart }))}
            />
            <CheckTile
              label="Kidneys"
              hint="Any kidney condition"
              checked={ticks.kidney}
              onChange={(kidney) => setTicks((t) => ({ ...t, kidney }))}
            />
          </Card>
        </Group>

        <Group title="RadioTile">
          <Card as="fieldset" className="m-0 flex flex-col gap-2 border-0">
            <legend className="float-left mb-1 p-0">
              <SectionLabel as="span">Worker (health profile)</SectionLabel>
            </legend>
            <div className="clear-both flex flex-col gap-2">
              {[
                ['no', 'No'],
                ['recent', 'Yes, in the last 12 months'],
                ['unsure', 'Not sure'],
              ].map(([value, label]) => (
                <RadioTile
                  key={value}
                  name="dev-history"
                  value={value}
                  label={label}
                  checked={history === value}
                  onChange={setHistory}
                />
              ))}
            </div>
          </Card>
        </Group>

        <Group title="Chip">
          <Card className="flex flex-col gap-3">
            <SectionLabel as="h3">Default</SectionLabel>
            <div className="flex flex-wrap gap-2">
              <Chip>Hot and humid</Chip>
              <Chip>Heavy work: excavation</Chip>
              <Chip>Coveralls hold heat</Chip>
            </div>
            <SectionLabel as="h3">Source</SectionLabel>
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-ground p-2">
              <Chip variant="source">Weather</Chip>
              <Chip variant="source">Site sensor</Chip>
              <Chip variant="source">Your band</Chip>
            </div>
          </Card>
        </Group>

        <Group title="StatusPill">
          <Card className="flex flex-wrap gap-2">
            {PILLS.map((status) => (
              <StatusPill key={status} status={status} />
            ))}
          </Card>
        </Group>

        <Group title="SectionLabel">
          <Card className="flex flex-col gap-2">
            <SectionLabel>Do this now</SectionLabel>
            <SectionLabel>Site heat now</SectionLabel>
          </Card>
        </Group>

        <Group title="ListenButton">
          <Card className="flex flex-col gap-3">
            <SectionLabel as="h3">Labelled (screen header)</SectionLabel>
            <div>
              <ListenButton aria-label="Listen in your language" />
            </div>
            <SectionLabel as="h3">Icon only (on the risk card)</SectionLabel>
            <div className="flex gap-2">
              {RISK_LEVELS.map((level) => (
                <div
                  key={level}
                  className={cn('rounded-xl p-2', riskClasses(level).bg, riskClasses(level).text)}
                >
                  <ListenButton variant="icon" />
                </div>
              ))}
            </div>
          </Card>
        </Group>

        <Group title="WorkerBottomNav">
          {WORKER_TABS.map((tab) => (
            <div key={tab} className="flex flex-col gap-1">
              <Note>Current: {tab}</Note>
              <WorkerBottomNav active={tab} />
            </div>
          ))}
        </Group>

        <Group title="SupervisorHeader">
          {SUPERVISOR_TABS.map((tab) => (
            <div key={tab} className="flex flex-col gap-1">
              <Note>Current: {tab}</Note>
              <SupervisorHeader
                active={tab}
                status="Updated 10:32 · WBGT estimated from weather data"
                initials="SU"
              />
            </div>
          ))}
          <Note>Without role, status and account (as on Measures):</Note>
          <SupervisorHeader active="measures" showRole={false} />
        </Group>

        <Group title="PrivacyFooter">
          <PrivacyFooter>
            You see risk levels and actions, never health conditions, medicines or symptoms. Health
            information is not used for discipline, productivity rankings or employment decisions.
          </PrivacyFooter>
        </Group>
      </div>
    </div>
  )
}
