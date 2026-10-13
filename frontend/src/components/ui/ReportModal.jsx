import { useEffect } from 'react'
import Modal from './Modal'
import Button from './Button'
import { SelectField, TextAreaField } from './Field'
import { Alert } from './Feedback'
import useForm, { rules } from '../../hooks/useForm'
import api, { errorMessage } from '../../services/api'
import useUIStore from '../../store/uiStore'

const REASONS = {
    product: ['Scam or fraud', 'Counterfeit or fake item', 'Prohibited item', 'Misleading description or price', 'Duplicate listing', 'Other'],
    user: ['Scam or fraud', 'Harassment or abuse', 'Fake profile', 'Spam', 'Other'],
}

export default function ReportModal({ isOpen, onClose, entityType, entityId }) {
    const { addToast } = useUIStore()
    const form = useForm({ reason: '', description: '' }, {
        reason: [rules.required('Choose a reason')],
        description: [rules.maxLength(500)],
    })

    useEffect(() => {
        if (isOpen) {
            form.setValues({ reason: '', description: '' })
            form.setErrors({})
            form.setFormError(null)
        }
    }, [isOpen])

    const submit = form.handleSubmit(async (values) => {
        try {
            const { data } = await api.post('/api/v1/reports', { entity_type: entityType, entity_id: entityId, ...values })
            addToast({ type: 'success', message: data.message === 'Report submitted' ? 'Thanks. Our team will review this report.' : data.message })
            onClose()
        } catch (error) {
            throw new Error(errorMessage(error, 'Could not send the report'))
        }
    })

    const noun = entityType === 'product' ? 'listing' : 'user'

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={`Report ${noun}`}
            description="Reports are anonymous to the person you report."
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={form.submitting}>Cancel</Button>
                    <Button variant="danger" onClick={submit} loading={form.submitting}>Send report</Button>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-4" noValidate>
                {form.formError && <Alert tone="danger">{form.formError}</Alert>}
                <SelectField label="Reason" required {...form.field('reason')}>
                    <option value="">Choose a reason</option>
                    {REASONS[entityType]?.map((r) => <option key={r} value={r}>{r}</option>)}
                </SelectField>
                <TextAreaField label="Details" optional maxLength={500} placeholder={`What's wrong with this ${noun}?`} {...form.field('description')} />
            </form>
        </Modal>
    )
}
