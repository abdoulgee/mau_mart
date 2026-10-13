import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import useSettingsStore from '../../store/settingsStore'
import getImageUrl from '../../utils/imageUrl'
import cn from '../../utils/cn'

export default function Logo({ className, showName = true, to = '/' }) {
    const { site_name, site_logo_url } = useSettingsStore((state) => state.settings)

    return (
        <Link to={to} className={cn('flex items-center gap-2 rounded-md', className)} aria-label={`${site_name} home`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-brand text-brand-fg">
                {site_logo_url
                    ? <img src={getImageUrl(site_logo_url)} alt="" className="h-full w-full object-cover" />
                    : <ShoppingBag size={18} aria-hidden />}
            </span>
            {showName && <span className="text-base font-semibold tracking-tight text-fg">{site_name}</span>}
        </Link>
    )
}
