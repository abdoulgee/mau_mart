import { CheckCircle2, ChevronDown, Mail } from 'lucide-react'
import Page from '../components/navigation/Page'
import Button from '../components/ui/Button'
import Panel from '../components/ui/Panel'
import useSettingsStore from '../store/settingsStore'

const faqs = [
    { q: 'How do I sell something?', a: 'Tap Sell, add up to 4 photos, a title, price and category, then post. Anyone on campus can see it right away.' },
    { q: 'How do I buy?', a: 'Open a listing and tap Chat or WhatsApp to talk to the seller. Agree on a price and a place to meet, then pay when you have the item.' },
    { q: 'My item is sold. What now?', a: 'Open the listing (or My listings) and tap "Mark as sold". It disappears from search but stays in your history.' },
    { q: 'Who can see my WhatsApp number?', a: 'Only logged-in users who view your listings or chat with you. You can remove it in Edit profile at any time.' },
    { q: 'Something looks like a scam', a: 'Use the Report option on the listing or profile. Our admins review every report and can remove listings or suspend accounts.' },
]

const tips = [
    'Meet in busy, public places on campus, in daylight if possible.',
    'Inspect the item before you pay. Never pay in advance to someone you haven\'t met.',
    'Keep conversations in the app or on WhatsApp so there is a record.',
    'Report listings or users that look suspicious.',
]

export default function Support() {
    const { support_email } = useSettingsStore((s) => s.settings)
    const email = support_email || 'support@maumart.com'

    return (
        <Page title="Help and safety" back width="medium">
            <div className="space-y-6">
                <Panel title="Safety tips">
                    <ul className="space-y-3">
                        {tips.map((tip) => (
                            <li key={tip} className="flex gap-3 text-sm text-fg-muted">
                                <CheckCircle2 size={18} aria-hidden className="mt-px shrink-0 text-success" />{tip}
                            </li>
                        ))}
                    </ul>
                </Panel>

                <Panel title="Frequently asked questions" padded={false}>
                    <div className="divide-y divide-line">
                        {faqs.map(({ q, a }) => (
                            <details key={q} className="group px-4 py-3 sm:px-5">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md text-sm font-medium text-fg">
                                    {q}
                                    <ChevronDown size={16} aria-hidden className="shrink-0 text-fg-subtle transition-transform group-open:rotate-180" />
                                </summary>
                                <p className="mt-2 text-sm text-fg-muted">{a}</p>
                            </details>
                        ))}
                    </div>
                </Panel>

                <Panel title="Still need help?" description="Our team usually replies within a day.">
                    <Button href={`mailto:${email}`} variant="secondary" icon={Mail}>{email}</Button>
                </Panel>
            </div>
        </Page>
    )
}
