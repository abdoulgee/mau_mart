export default function LoadingScreen() {
    return (
        <div className="min-h-screen bg-surface-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-5">
                {/* Logo Animation */}
                <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center animate-float shadow-glow">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    {/* Spinning ring */}
                    <div className="absolute -inset-2">
                        <div className="w-full h-full border-[3px] border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                    </div>
                </div>

                {/* Loading text */}
                <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 font-semibold tracking-wide text-sm">Loading</span>
                    <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                        <span className="w-1.5 h-1.5 bg-primary-300 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                    </span>
                </div>
            </div>
        </div>
    )
}
