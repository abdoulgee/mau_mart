import { useState, useEffect } from 'react'
import { Eye, EyeOff, LayoutGrid, Pencil, Plus } from 'lucide-react'
import { AdminPage } from '../../layouts/AdminLayout'
import Panel from '../../components/ui/Panel'
import Button, { IconButton } from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import DataTable from '../../components/ui/DataTable'
import { Alert, Badge, EmptyState } from '../../components/ui/Feedback'
import { TextField } from '../../components/ui/Field'
import useForm, { rules } from '../../hooks/useForm'
import api, { errorMessage } from '../../services/api'
import useUIStore from '../../store/uiStore'
import useCategoryStore from '../../store/categoryStore'
import { CATEGORY_ICONS, categoryIcon } from '../../utils/categoryIcons'
import cn from '../../utils/cn'

function IconPicker({ value, onChange }) {
    return (
        <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-fg">Icon</legend>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8" role="radiogroup">
                {Object.entries(CATEGORY_ICONS).map(([name, Icon]) => (
                    <label key={name} title={name}
                        className={cn('flex h-10 cursor-pointer items-center justify-center rounded-lg border transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand',
                            value === name ? 'border-brand bg-brand-soft text-brand-text' : 'border-line text-fg-muted hover:border-line-strong hover:text-fg')}>
                        <input type="radio" name="icon" value={name} checked={value === name} onChange={() => onChange(name)} className="sr-only" aria-label={name.replace(/-/g, ' ')} />
                        <Icon size={18} aria-hidden />
                    </label>
                ))}
            </div>
        </fieldset>
    )
}

function CategoryModal({ category, onClose, onSaved }) {
    const form = useForm(
        { name: category?.name || '', icon: category?.icon || 'package', sort_order: category?.sort_order ?? 0 },
        { name: [rules.required('Enter a name'), rules.maxLength(100)], sort_order: [rules.number({ min: 0 })] }
    )
    const submit = form.handleSubmit(async (values) => {
        try {
            const payload = { ...values, sort_order: Number(values.sort_order) || 0 }
            if (category) await api.put(`/api/v1/admin/categories/${category.id}`, payload)
            else await api.post('/api/v1/admin/categories', payload)
            onSaved(category ? 'Category updated' : 'Category added')
        } catch (error) {
            throw new Error(errorMessage(error))
        }
    })
    return (
        <Modal open onClose={onClose} title={category ? 'Edit category' : 'New category'}
            footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={form.submitting}>Save</Button></>}>
            <form onSubmit={submit} noValidate className="space-y-4">
                {form.formError && <Alert tone="danger">{form.formError}</Alert>}
                <TextField label="Name" required placeholder="e.g. Phones & Gadgets" {...form.field('name')} />
                <IconPicker value={form.values.icon} onChange={(v) => form.setValue('icon', v)} />
                <TextField label="Display order" type="number" min="0" hint="Lower numbers appear first." {...form.field('sort_order')} />
            </form>
        </Modal>
    )
}

export default function AdminCategories() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [editing, setEditing] = useState(null) // category object, or 'new'
    const { addToast } = useUIStore()

    const load = async () => {
        setError(false)
        try {
            const { data } = await api.get('/api/v1/admin/categories')
            setCategories(data.categories || [])
        } catch {
            setError(true)
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => { load() }, [])

    const refresh = (message) => {
        setEditing(null)
        addToast({ type: 'success', message })
        load()
        useCategoryStore.getState().fetchCategories(true)
    }

    const toggleVisible = async (category) => {
        try {
            await api.put(`/api/v1/admin/categories/${category.id}`, { is_active: !category.is_active })
            refresh(category.is_active ? `"${category.name}" hidden` : `"${category.name}" is visible`)
        } catch (err) {
            addToast({ type: 'error', message: errorMessage(err) })
        }
    }

    const columns = [
        {
            key: 'name', header: 'Category', primary: true,
            render: (c) => {
                const Icon = categoryIcon(c)
                return (
                    <span className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-muted text-fg-muted"><Icon size={18} aria-hidden /></span>
                        <span className="font-medium text-fg">{c.name}</span>
                    </span>
                )
            },
        },
        { key: 'listings', header: 'Listings', align: 'right', render: (c) => <span className="tabular">{c.listings_count}</span> },
        { key: 'order', header: 'Order', align: 'right', render: (c) => <span className="tabular text-fg-muted">{c.sort_order}</span> },
        { key: 'status', header: 'Visibility', render: (c) => (c.is_active ? <Badge tone="success" dot>Visible</Badge> : <Badge dot>Hidden</Badge>) },
        {
            key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right',
            render: (c) => (
                <div className="flex justify-end gap-1">
                    <IconButton icon={Pencil} label={`Edit ${c.name}`} size="sm" onClick={() => setEditing(c)} />
                    <IconButton icon={c.is_active ? EyeOff : Eye} label={c.is_active ? `Hide ${c.name}` : `Show ${c.name}`} size="sm" onClick={() => toggleVisible(c)} />
                </div>
            ),
        },
    ]

    return (
        <AdminPage title="Categories" description="Hidden categories keep their listings and can be shown again."
            actions={<Button icon={Plus} onClick={() => setEditing('new')}>New category</Button>}>
            <Panel padded={false}>
                <DataTable caption="Categories" columns={columns} rows={categories} loading={loading} error={error} onRetry={load}
                    empty={<EmptyState icon={LayoutGrid} title="No categories yet" action={<Button icon={Plus} onClick={() => setEditing('new')}>Add the first one</Button>} />} />
            </Panel>
            {editing && <CategoryModal category={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={refresh} />}
        </AdminPage>
    )
}
