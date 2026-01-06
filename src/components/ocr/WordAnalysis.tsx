import { getConfidenceColor } from './utils'

interface Word {
  text: string
  confidence: number
}

interface WordAnalysisProps {
  words: Array<Word>
}

export function WordAnalysis({ words }: WordAnalysisProps) {
  if (words.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Word-level Analysis:
      </h3>
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 max-h-64 overflow-y-auto">
        <div className="flex flex-wrap gap-2">
          {words.map((word, index) => (
            <span
              key={index}
              className={`px-2 py-1 rounded text-sm ${getConfidenceColor(word.confidence)} bg-gray-100 dark:bg-gray-600`}
              title={`Confidence: ${word.confidence.toFixed(1)}%`}
            >
              {word.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
