import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera } from 'lucide-react'
import Page from '../components/navigation/Page'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import Panel from '../components/ui/Panel'
import { Alert } from '../components/ui/Feedback'
import { TextField, TextAreaField } from '../components/ui/Field'
import useForm, { rules } from '../hooks/useForm'
import useAuthStore from '../store/authStore'
import useUIStore from '../store/uiStore'
import api, { errorMessage } from '../services/api'
import compressImage from '../utils/compressImage'

const schema = {
    first_name: [rules.required('Enter your first name')],
    last_name: [rules.required('Enter your last name')],
    phone: [rules.required('Enter your phone number'), rules.phone()],
    whatsapp: [rules.phone('Enter a valid WhatsApp number')],
    bio: [rules.maxLength(300)],
}

export default function EditProfile() {
    const { user, updateUser } = useAuthStore()
    const { addToast } = useUIStore()
    const navigate = useNavigate()
    const [avatarFile, setAvatarFile] = useState(null)
    const [avatarPreview, setAvatarPreview] = useState(null)

    const form = useForm({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        phone: user?.phone || '',
        whatsapp: user?.whatsapp ? `+${user.whatsapp}` : '',
        student_id: user?.student_id || '',
        bio: user?.bio || '',
    }, schema)

    const pickAvatar = async (e) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        if (!file.type.startsWith('image/')) {
            addToast({ type: 'error', message: 'Choose an image file' })
            return
        }
        const compressed = await compressImage(file, 600)
        setAvatarFile(compressed)
        setAvatarPreview(URL.createObjectURL(compressed))
    }

    const submit = form.handleSubmit(async (values) => {
        const data = new FormData()
        Object.entries(values).forEach(([key, value]) => data.append(key, value))
        if (avatarFile) data.append('avatar', avatarFile)
        try {
            const response = await api.put('/api/v1/users/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } })
            updateUser(response.data.user)
            addToast({ type: 'success', message: 'Profile updated' })
            navigate('/profile')
        } catch (error) {
            throw new Error(errorMessage(error, 'Could not update your profile'))
        }
    })

    return (
        <Page title="Edit profile" back width="narrow">
            <form onSubmit={submit} noValidate className="space-y-6">
                {form.formError && <Alert tone="danger">{form.formError}</Alert>}

                <div className="flex items-center gap-4">
                    {avatarPreview
                        ? <img src={avatarPreview} alt="New profile photo" className="h-20 w-20 rounded-full object-cover ring-1 ring-line" />
                        : <Avatar user={user} size="2xl" />}
                    <div>
                        <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-fg hover:bg-surface-hover has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand">
                            <Camera size={16} aria-hidden />
                            Change photo
                            <input type="file" accept="image/*" onChange={pickAvatar} className="sr-only" />
                        </label>
                        <p className="mt-1 text-xs text-fg-subtle">JPG or PNG. Shown on your listings.</p>
                    </div>
                </div>

                <Panel title="Personal details">
                    <div className="space-y-5">
                        <div className="grid gap-5 sm:grid-cols-2">
                            <TextField label="First name" required autoComplete="given-name" {...form.field('first_name')} />
                            <TextField label="Last name" required autoComplete="family-name" {...form.field('last_name')} />
                        </div>
                        <TextField label="Student ID" optional {...form.field('student_id')} />
                        <TextAreaField label="About you" optional rows={3} maxLength={300} placeholder="e.g. 300L Computer Science. I sell gadgets and textbooks." {...form.field('bio')} />
                    </div>
                </Panel>

                <Panel title="Contact" description="How buyers reach you about your listings">
                    <div className="space-y-5">
                        <TextField label="Phone number" required type="tel" autoComplete="tel" {...form.field('phone')} />
                        <TextField label="WhatsApp number" optional type="tel" placeholder="0803 123 4567"
                            hint="Only shown to logged-in users. Leave empty to use in-app chat only." {...form.field('whatsapp')} />
                    </div>
                </Panel>

                <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
                    <Button type="submit" loading={form.submitting}>Save changes</Button>
                </div>
            </form>
        </Page>
    )
}
