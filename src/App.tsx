import { useEffect, useState } from 'react'

export default function App() {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col justify-between p-4 sm:p-6 antialiased">
      <header className="w-full max-w-sm mx-auto pt-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-950">
          HeatGuard AI
        </h1>
        <p className="mt-2 text-sm sm:text-base font-medium text-stone-700">
          Heat-risk decision support for outdoor workers
        </p>
      </header>

      <main className="w-full max-w-sm mx-auto my-auto py-8">
        <div className="rounded-xl border border-stone-300 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-800">Connection Status</span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isOnline ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-600' : 'bg-rose-600'}`}
                aria-hidden="true"
              />
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-sm mx-auto pb-4 text-center">
        <p className="text-xs text-stone-500 font-medium">HeatGuard AI Shell</p>
      </footer>
    </div>
  )
}
