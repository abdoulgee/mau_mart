import { Spinner } from './Feedback'

export default function LoadingScreen() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <Spinner size={28} label="Loading page" />
        </div>
    )
}
