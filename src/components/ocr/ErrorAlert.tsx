import { AlertCircle } from 'lucide-react'

interface ErrorAlertProps {
  message: string
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  if (!message) return null

  return (
    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
      <span className="text-sm text-red-600 dark:text-red-400">{message}</span>
    </div>
  )
}
