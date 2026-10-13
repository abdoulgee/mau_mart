import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { Toaster } from './components/ui/Toast'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import AdminLayout from './layouts/AdminLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoadingScreen from './components/ui/LoadingScreen'
import ErrorBoundary from './components/ErrorBoundary'
import useSettingsStore from './store/settingsStore'

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/auth/Login'))
const Signup = lazy(() => import('./pages/auth/Signup'))
const VerifyOtp = lazy(() => import('./pages/auth/VerifyOtp'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))
const Categories = lazy(() => import('./pages/Categories'))
const CategoryProducts = lazy(() => import('./pages/CategoryProducts'))
const Search = lazy(() => import('./pages/Search'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const ListingForm = lazy(() => import('./pages/ListingForm'))
const MyListings = lazy(() => import('./pages/MyListings'))
const UserProfile = lazy(() => import('./pages/UserProfile'))
const ChatList = lazy(() => import('./pages/ChatList'))
const ChatConversation = lazy(() => import('./pages/ChatConversation'))
const Profile = lazy(() => import('./pages/Profile'))
const EditProfile = lazy(() => import('./pages/EditProfile'))
const ChangePassword = lazy(() => import('./pages/ChangePassword'))
const Notifications = lazy(() => import('./pages/Notifications'))
const SavedItems = lazy(() => import('./pages/SavedItems'))
const Support = lazy(() => import('./pages/Support'))
const NotFound = lazy(() => import('./pages/errors/NotFound'))
const ServerError = lazy(() => import('./pages/errors/ServerError'))
const Offline = lazy(() => import('./pages/errors/Offline'))

// Admin
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminUsers = lazy(() => import('./pages/admin/Users'))
const AdminProducts = lazy(() => import('./pages/admin/Products'))
const AdminCategories = lazy(() => import('./pages/admin/Categories'))
const AdminReports = lazy(() => import('./pages/admin/Reports'))
const AdminHomePage = lazy(() => import('./pages/admin/HomePage'))
const AdminSettings = lazy(() => import('./pages/admin/Settings'))
const AdminSmtp = lazy(() => import('./pages/admin/Smtp'))

function App() {
    const { fetchSettings } = useSettingsStore()
    const location = useLocation()

    useEffect(() => {
        fetchSettings()
    }, [fetchSettings])

    return (
        <>
            {/* Navigating to another page clears a crash */}
            <ErrorBoundary resetKey={location.pathname}>
            <Suspense fallback={<LoadingScreen />}>
                <Routes>
                    {/* Auth */}
                    <Route element={<AuthLayout />}>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/verify-otp" element={<VerifyOtp />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                    </Route>

                    {/* Marketplace */}
                    <Route element={<MainLayout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/category/:slug" element={<CategoryProducts />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route path="/user/:id" element={<UserProfile />} />
                        <Route path="/support" element={<Support />} />

                        <Route element={<ProtectedRoute />}>
                            <Route path="/sell" element={<ListingForm />} />
                            <Route path="/product/:id/edit" element={<ListingForm />} />
                            <Route path="/my-listings" element={<MyListings />} />
                            <Route path="/chat" element={<ChatList />} />
                            <Route path="/chat/:chatId" element={<ChatConversation />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/profile/edit" element={<EditProfile />} />
                            <Route path="/profile/change-password" element={<ChangePassword />} />
                            <Route path="/notifications" element={<Notifications />} />
                            <Route path="/saved" element={<SavedItems />} />
                        </Route>
                    </Route>

                    {/* Admin */}
                    <Route element={<ProtectedRoute requiredRole="admin" />}>
                        <Route element={<AdminLayout />}>
                            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                            <Route path="/admin/dashboard" element={<AdminDashboard />} />
                            <Route path="/admin/users" element={<AdminUsers />} />
                            <Route path="/admin/products" element={<AdminProducts />} />
                            <Route path="/admin/categories" element={<AdminCategories />} />
                            <Route path="/admin/reports" element={<AdminReports />} />
                            <Route element={<ProtectedRoute requiredRole="super_admin" />}>
                                <Route path="/admin/home-page" element={<AdminHomePage />} />
                                <Route path="/admin/ads" element={<Navigate to="/admin/home-page" replace />} />
                                <Route path="/admin/settings" element={<AdminSettings />} />
                                <Route path="/admin/smtp" element={<AdminSmtp />} />
                            </Route>
                        </Route>
                    </Route>

                    {/* Old links */}
                    <Route path="/profile/notifications" element={<Navigate to="/notifications" replace />} />

                    {/* Errors */}
                    <Route path="/offline" element={<Offline />} />
                    <Route path="/error" element={<ServerError />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
            </ErrorBoundary>
            <Toaster />
        </>
    )
}

export default App
