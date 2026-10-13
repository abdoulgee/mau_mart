/**
 * Shrinks a photo in the browser before upload (max side 1600px, JPEG ~80%).
 * Falls back to the original file if the browser can't decode it.
 */
export default async function compressImage(file, maxSide = 1600, quality = 0.8) {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') return file

    try {
        const bitmap = await createImageBitmap(file)
        const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(bitmap.width * scale)
        canvas.height = Math.round(bitmap.height * scale)
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        bitmap.close?.()

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
        if (!blob || blob.size >= file.size) return file

        const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
        return new File([blob], name, { type: 'image/jpeg' })
    } catch {
        return file
    }
}
