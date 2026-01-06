import { getConfidenceColor, getConfidenceLabel } from './utils'

interface MetadataGridProps {
  confidence: number
  wordCount: number
  processingTime: number
  language: string
}

export function MetadataGrid({
  confidence,
  wordCount,
  processingTime,
  language,
}: MetadataGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          Confidence
        </p>
        <p
          className={`text-lg font-semibold ${getConfidenceColor(confidence)}`}
        >
          {confidence.toFixed(1)}%
          <span className="text-sm ml-1">
            ({getConfidenceLabel(confidence)})
          </span>
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          Word Count
        </p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">
          {wordCount}
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          Processing Time
        </p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">
          {(processingTime / 1000).toFixed(2)}s
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          Language
        </p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">
          {language}
        </p>
      </div>
    </div>
  )
}
