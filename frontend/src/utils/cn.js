// Join class names, skipping falsy values
export default function cn(...classes) {
    return classes.filter(Boolean).join(' ')
}
