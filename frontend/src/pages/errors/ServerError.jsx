import { RefreshCw, ServerCrash } from 'lucide-react'
import Button from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/Feedback'

export default function ServerError() {
    return (
        <main id="main" className="flex min-h-screen items-center justify-center p-4">
            <EmptyState
                icon={ServerCrash}
                title="Something went wrong on our side"
                message="Please try again in a moment."
                action={<Button icon={RefreshCw} onClick={() => window.location.reload()}>Reload</Button>}
            />
        </main>
    )
}
