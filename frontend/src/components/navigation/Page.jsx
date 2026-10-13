import TopBar from './TopBar'
import cn from '../../utils/cn'

const widths = {
    narrow: 'max-w-xl',
    medium: 'max-w-3xl',
    default: 'max-w-6xl',
}

/**
 * Standard page frame: top bar + content column.
 * The title shows in the mobile bar and as the page heading on desktop.
 * `actions` appear in both places; keep them compact (icon buttons or small buttons).
 */
export default function Page({
    title, description, back = false, actions, mobileActions, mobileContent,
    width = 'default', hideTitle = false, className, children,
}) {
    return (
        <>
            <TopBar title={title} back={back} actions={mobileActions ?? actions} mobileContent={mobileContent} />
            <main id="main" className={cn('mx-auto w-full px-4 pb-24 pt-4 sm:px-6 md:pb-12 md:pt-8', widths[width], className)}>
                {!hideTitle && title && (
                    // On mobile, back pages show the title in the top bar; the heading stays for screen readers
                    <div className={cn('mb-6 items-end justify-between gap-4', back ? 'sr-only md:not-sr-only md:flex' : 'flex')}>
                        <div className="min-w-0">
                            <h1 className="text-xl font-semibold text-fg md:text-2xl">{title}</h1>
                            {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
                        </div>
                        {actions && <div className="hidden shrink-0 items-center gap-2 md:flex">{actions}</div>}
                    </div>
                )}
                {children}
            </main>
        </>
    )
}
