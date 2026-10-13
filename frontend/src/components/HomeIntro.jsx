import { Plus } from 'lucide-react'
import Button from './ui/Button'
import getImageUrl from '../utils/imageUrl'
import cn from '../utils/cn'

/**
 * Intro section at the top of the home page. Title, message and background image are set by
 * super admins; with an image the text sits on a dark overlay so it stays readable.
 */
export default function HomeIntro({ tagline, title, message, imageUrl, action, preview = false }) {
    const hasImage = !!imageUrl
    const Heading = preview ? 'p' : 'h1'

    return (
        <section
            aria-label={preview ? 'Intro preview' : undefined}
            className={cn(
                'relative isolate overflow-hidden',
                hasImage ? 'rounded-lg bg-neutral-900 px-5 py-10 sm:px-8 sm:py-14' : 'border-b border-line pb-8'
            )}
        >
            {hasImage && (
                <>
                    <img src={imageUrl.startsWith('blob:') ? imageUrl : getImageUrl(imageUrl)} alt=""
                        className="absolute inset-0 -z-10 h-full w-full object-cover" />
                    <div className="absolute inset-0 -z-10 bg-black/60" aria-hidden />
                </>
            )}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-xl">
                    {tagline && <p className={cn('text-sm font-medium', hasImage ? 'text-white/80' : 'text-brand-text')}>{tagline}</p>}
                    <Heading className={cn('mt-1 text-2xl font-semibold sm:text-3xl', hasImage ? 'text-white' : 'text-fg')}>{title}</Heading>
                    {message && <p className={cn('mt-2 whitespace-pre-line text-sm', hasImage ? 'text-white/85' : 'text-fg-muted')}>{message}</p>}
                </div>
                {action}
            </div>
        </section>
    )
}

export function HomeIntroAction({ isAuthenticated, ...props }) {
    return (
        <Button to={isAuthenticated ? '/sell' : '/signup'} icon={Plus} size="lg" className="self-start sm:self-auto" {...props}>
            {isAuthenticated ? 'Post a listing' : 'Create an account'}
        </Button>
    )
}
