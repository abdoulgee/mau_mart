import { RefreshCw, WifiOff } from 'lucide-react'
import Button from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/Feedback'

export default function Offline() {
    return (
        <main id="main" className="flex min-h-screen items-center justify-center p-4">
            <EmptyState
                icon={WifiOff}
                title="You're offline"
                message="Check your internet connection, then try again."
                action={<Button icon={RefreshCw} onClick={() => window.location.reload()}>Try again</Button>}
            />
        </main>
    )
}
