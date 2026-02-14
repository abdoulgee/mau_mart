import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { Toaster } from './components/ui/Toast'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import AdminLayout from './layouts/AdminLayout'
import SellerLayout from './layouts/SellerLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoadingScreen from './components/ui/LoadingScreen'
import useAuthStore from './store/authStore'
import useCategoryStore from './store/categoryStore'
import useSettingsStore from './store/settingsStore'
import api from './services/api'


// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/auth/Login'))
const Signup = lazy(() => import('./pages/auth/Signup'))
const VerifyOtp = lazy(() => import('./pages/auth/VerifyOtp'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))
const Categories = lazy(() => import('./pages/Categories'))
const CategoryProducts = lazy(() => import('./pages/CategoryProducts'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const StoreDetail = lazy(() => import('./pages/StoreDetail'))
const Search = lazy(() => import('./pages/Search'))
const ChatList = lazy(() => import('./pages/ChatList'))
const ChatConversation = lazy(() => import('./pages/ChatConversation'))
const Profile = lazy(() => import('./pages/Profile'))
const Orders = lazy(() => import('./pages/Orders'))
const Checkout = lazy(() => import('./pages/Checkout'))
const OrderDetail = lazy(() => import('./pages/OrderDetail'))
const BecomeSeller = lazy(() => import('./pages/BecomeSeller'))
const Advertise = lazy(() => import('./pages/Advertise'))
const NotFound = lazy(() => import('./pages/errors/NotFound'))
const ServerError = lazy(() => import('./pages/errors/ServerError'))
const Offline = lazy(() => import('./pages/errors/Offline'))

// Seller Dashboard Pages
const SellerDashboard = lazy(() => import('./pages/seller/Dashboard'))
const SellerProducts = lazy(() => import('./pages/seller/Products'))
const ProductForm = lazy(() => import('./pages/seller/ProductForm'))
const SellerOrders = lazy(() => import('./pages/seller/Orders'))
const StoreSettings = lazy(() => import('./pages/seller/StoreSettings'))
const SellerFeatured = lazy(() => import('./pages/seller/Featured'))
const SellerAds = lazy(() => import('./pages/seller/Ads'))

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminUsers = lazy(() => import('./pages/admin/Users'))
const AdminStoreRequests = lazy(() => import('./pages/admin/StoreRequests'))
const AdminStores = lazy(() => import('./pages/admin/Stores'))
const AdminCategories = lazy(() => import('./pages/admin/Categories'))
const AdminProducts = lazy(() => import('./pages/admin/Products'))
const AdminOrders = lazy(() => import('./pages/admin/Orders'))
const AdminAds = lazy(() => import('./pages/admin/Ads'))
const AdminReviews = lazy(() => import('./pages/admin/Reviews'))
const AdminReports = lazy(() => import('./pages/admin/Reports'))
const AdminSmtp = lazy(() => import('./pages/admin/Smtp'))
const AdminSettings = lazy(() => import('./pages/admin/Settings'))
const AdminFeatured = lazy(() => import('./pages/admin/Featured'))
const AdminEmailMarketing = lazy(() => import('./pages/admin/EmailMarketing'))
const AdminSupportAdmins = lazy(() => import('./pages/admin/SupportAdmins'))

// User Dashboard Pages (Missing Routes)
const MyReviews = lazy(() => import('./pages/MyReviews'))
const SavedItems = lazy(() => import('./pages/SavedItems'))
const EditProfile = lazy(() => import('./pages/EditProfile'))
const ChangePassword = lazy(() => import('./pages/ChangePassword'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Support = lazy(() => import('./pages/Support'))

function App() {
    const { accessToken } = useAuthStore()
    const { fetchCategories, connectSocket } = useCategoryStore()
    const { fetchSettings } = useSettingsStore()

    // Initialize auth token and categories when app loads
    useEffect(() => {
        if (accessToken) {
            api.setAuthToken(accessToken)
        }
        connectSocket()
        fetchCategories()
        fetchSettings()
    }, [accessToken])


    return (
        <>
            <Suspense fallback={<LoadingScreen />}>
                <Routes>
                    {/* Public Auth Routes */}
                    <Route element={<AuthLayout />}>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/verify-otp" element={<VerifyOtp />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                    </Route>

                    {/* Main App Routes */}
                    <Route element={<MainLayout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/category/:slug" element={<CategoryProducts />} />
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route path="/store/:id" element={<StoreDetail />} />
                        <Route path="/search" element={<Search />} />

                        {/* Protected Routes */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/chat" element={<ChatList />} />
                            <Route path="/chat/:chatId" element={<ChatConversation />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/orders" element={<Orders />} />
                            <Route path="/order/new" element={<Checkout />} />
                            <Route path="/order/:id" element={<OrderDetail />} />
                            <Route path="/become-seller" element={<BecomeSeller />} />
                            <Route path="/advertise" element={<Advertise />} />
                            <Route path="/my-reviews" element={<MyReviews />} />
                            <Route path="/saved" element={<SavedItems />} />
                            <Route path="/profile/edit" element={<EditProfile />} />
                            <Route path="/profile/change-password" element={<ChangePassword />} />
                            <Route path="/profile/notifications" element={<Notifications />} />
                            <Route path="/support" element={<Support />} />
                        </Route>
                    </Route>

                    {/* Seller Dashboard Routes */}
                    <Route element={<ProtectedRoute requiredRole="seller" />}>
                        <Route element={<SellerLayout />}>
                            <Route path="/seller" element={<SellerDashboard />} />
                            <Route path="/seller/products" element={<SellerProducts />} />
                            <Route path="/seller/products/new" element={<ProductForm />} />
                            <Route path="/seller/products/:id/edit" element={<ProductForm />} />
                            <Route path="/seller/orders" element={<SellerOrders />} />
                            <Route path="/seller/store" element={<StoreSettings />} />
                            <Route path="/seller/featured" element={<SellerFeatured />} />
                            <Route path="/seller/ads" element={<SellerAds />} />
                        </Route>
                    </Route>

                    {/* Admin Routes */}
                    <Route element={<ProtectedRoute requiredRole="admin" />}>
                        <Route element={<AdminLayout />}>
                            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                            <Route path="/admin/dashboard" element={<AdminDashboard />} />
                            <Route path="/admin/users" element={<AdminUsers />} />
                            <Route path="/admin/store-requests" element={<AdminStoreRequests />} />
                            <Route path="/admin/stores" element={<AdminStores />} />
                            <Route path="/admin/categories" element={<AdminCategories />} />
                            <Route path="/admin/products" element={<AdminProducts />} />
                            <Route path="/admin/orders" element={<AdminOrders />} />
                            <Route path="/admin/ads" element={<AdminAds />} />
                            <Route path="/admin/reviews" element={<AdminReviews />} />
                            <Route path="/admin/reports" element={<AdminReports />} />
                            <Route path="/admin/smtp" element={<AdminSmtp />} />
                            <Route path="/admin/settings" element={<AdminSettings />} />
                            <Route path="/admin/featured" element={<AdminFeatured />} />
                            <Route path="/admin/support-admins" element={<AdminSupportAdmins />} />
                            <Route path="/admin/email-marketing" element={<AdminEmailMarketing />} />
                        </Route>
                    </Route>

                    {/* Error Pages */}
                    <Route path="/offline" element={<Offline />} />
                    <Route path="/error" element={<ServerError />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
            <Toaster />
        </>
    )
}

export default App


