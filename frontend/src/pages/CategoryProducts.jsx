import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import Page from '../components/navigation/Page'
import CategoryChips from '../components/CategoryChips'
import ListingResults from '../components/ListingResults'
import Button from '../components/ui/Button'
import useCategoryStore from '../store/categoryStore'

export default function CategoryProducts() {
    const { slug } = useParams()
    const { categories, fetchCategories } = useCategoryStore()
    const category = categories.find((c) => c.slug === slug)

    useEffect(() => {
        fetchCategories()
    }, [fetchCategories])

    return (
        <Page title={category?.name || 'Category'} back>
            <div className="space-y-6">
                <CategoryChips activeSlug={slug} />
                <ListingResults
                    key={slug}
                    params={{ category: slug }}
                    emptyTitle="Nothing in this category yet"
                    emptyMessage="Check back later, or post the first one."
                    emptyAction={<Button to="/sell" icon={Plus}>Post a listing</Button>}
                />
            </div>
        </Page>
    )
}
