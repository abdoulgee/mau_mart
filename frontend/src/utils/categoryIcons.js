import {
    Bike, BedDouble, BookOpen, Camera, Car, Dumbbell, Gamepad2, Headphones, Home, Laptop, Music,
    Package, Palette, Shirt, ShoppingBag, Smartphone, Sofa, Sparkles, Tag, Ticket, Utensils, Watch, Wrench,
} from 'lucide-react'

// Curated Lucide icons admins can assign to categories (stored by name in the database)
export const CATEGORY_ICONS = {
    smartphone: Smartphone,
    laptop: Laptop,
    headphones: Headphones,
    camera: Camera,
    'gamepad-2': Gamepad2,
    'book-open': BookOpen,
    shirt: Shirt,
    watch: Watch,
    sparkles: Sparkles,
    'bed-double': BedDouble,
    sofa: Sofa,
    home: Home,
    utensils: Utensils,
    'shopping-bag': ShoppingBag,
    wrench: Wrench,
    bike: Bike,
    car: Car,
    dumbbell: Dumbbell,
    music: Music,
    palette: Palette,
    ticket: Ticket,
    package: Package,
}

export const categoryIcon = (category) => CATEGORY_ICONS[category?.icon] || Tag
