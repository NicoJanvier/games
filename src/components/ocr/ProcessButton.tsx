import { Loader2, Upload } from 'lucide-react'

interface ProcessButtonProps {
  isProcessing: boolean
  progress: number
  onProcess: () => void
}

export function ProcessButton({
  isProcessing,
  progress,
  onProcess,
}: ProcessButtonProps) {
  return (
    <button
      onClick={onProcess}
      disabled={isProcessing}
      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Processing... {progress}%</span>
        </>
      ) : (
        <>
          <Upload className="w-5 h-5" />
          <span>Extract Text</span>
        </>
      )}
    </button>
  )
}
