import { CheckCircle } from 'lucide-react'
import { ExtractedText } from './ExtractedText'
import { MetadataGrid } from './MetadataGrid'
import { OCRVisualization } from './OCRVisualization'
import { WordAnalysis } from './WordAnalysis'
import type { RecognizeResult } from 'tesseract.js'

interface OCRResultsProps {
  result: RecognizeResult
  imageUrl: string
  processingTime: number
}

export function OCRResults({
  result,
  imageUrl,
  processingTime,
}: OCRResultsProps) {
  const words = (result.data as any).words || []

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Recognition Complete
        </h2>
      </div>

      <MetadataGrid
        confidence={result.data.confidence}
        wordCount={words.length}
        processingTime={processingTime}
        language="English"
      />

      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          OCR Visualization:
        </h3>
        <OCRVisualization imageUrl={imageUrl} result={result} />
      </div>

      <ExtractedText text={result.data.text} />

      <WordAnalysis words={words} />
    </div>
  )
}
