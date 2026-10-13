import { Home, SearchX } from 'lucide-react'
import Button from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/Feedback'

export default function NotFound() {
    return (
        <main id="main" className="flex min-h-screen items-center justify-center p-4">
            <EmptyState
                icon={SearchX}
                title="Page not found"
                message="The page you're looking for doesn't exist or has moved."
                action={<Button to="/" icon={Home}>Go home</Button>}
            />
        </main>
    )
}
