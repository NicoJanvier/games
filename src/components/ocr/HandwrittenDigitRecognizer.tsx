import { useEffect, useState } from 'react'
import { Brain, CheckCircle } from 'lucide-react'
import { loadMNISTModel, predictDigitFromImage } from './mnistModel'
import { preprocessImage } from './utils'
import { segmentDigits } from './digitSegmentation'
import type { DigitPrediction } from './mnistModel'
import type { SegmentedDigit } from './digitSegmentation'

interface HandwrittenDigitRecognizerProps {
  file: File
  onComplete: (result: HandwritingResult) => void
  onError: (error: string) => void
}

export interface DigitResult {
  digit: number
  confidence: number
  bbox: { x: number; y: number; width: number; height: number }
}

export interface HandwritingResult {
  digits: Array<DigitResult>
  combinedText: string
  processingTime: number
  preprocessedImage: string
}

export function HandwrittenDigitRecognizer({
  file,
  onComplete,
  onError,
}: HandwrittenDigitRecognizerProps) {
  const [status, setStatus] = useState<string>('Initializing...')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let cancelled = false

    const recognize = async () => {
      const startTime = Date.now()

      try {
        // Step 1: Load MNIST model
        setStatus('Loading AI model (first time may take 30-60s to train)...')
        setProgress(10)
        await loadMNISTModel()
        setProgress(25)

        if (cancelled) return

        // Step 2: Preprocess image
        setStatus('Preprocessing image...')
        setProgress(35)
        const preprocessedImageUrl = await preprocessImage(file, {
          scale: 3,
          grayscale: true,
          contrast: 2.5,
          brightness: 1.2,
          sharpen: false,
          threshold: 140,
        })

        // Step 3: Get image data from preprocessed image
        setStatus('Loading preprocessed image...')
        setProgress(45)
        const img = new Image()
        const imageData = await new Promise<ImageData>((resolve, reject) => {
          img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(img, 0, 0)
            resolve(ctx.getImageData(0, 0, img.width, img.height))
          }
          img.onerror = () => reject(new Error('Failed to load image'))
          img.src = preprocessedImageUrl
        })

        // Step 4: Segment into individual digits
        setStatus('Detecting digits...')
        setProgress(55)
        const segments: Array<SegmentedDigit> = segmentDigits(imageData)

        if (segments.length === 0) {
          onError(
            'No digits detected. Try adjusting the image or preprocessing.',
          )
          return
        }

        // Step 5: Recognize each digit
        setStatus(`Recognizing ${segments.length} digit(s)...`)
        const results: Array<DigitResult> = []

        for (let i = 0; i < segments.length; i++) {
          setProgress(55 + (i / segments.length) * 40)
          const segment = segments[i]

          try {
            const prediction: DigitPrediction = await predictDigitFromImage(
              segment.imageData,
            )

            results.push({
              digit: prediction.digit,
              confidence: prediction.confidence,
              bbox: segment.bbox,
            })
          } catch (err) {
            console.error('Error recognizing digit:', err)
            results.push({
              digit: -1,
              confidence: 0,
              bbox: segment.bbox,
            })
          }
        }

        // Step 6: Combine results
        setStatus('Complete!')
        setProgress(100)

        const combinedText = results
          .map((r) => (r.digit >= 0 ? r.digit : '?'))
          .join('')

        const processingTime = Date.now() - startTime

        onComplete({
          digits: results,
          combinedText,
          processingTime,
          preprocessedImage: preprocessedImageUrl,
        })
      } catch (err) {
        if (cancelled) return
        console.error('Recognition error:', err)
        onError(err instanceof Error ? err.message : 'Recognition failed')
      }
    }

    recognize()

    return () => {
      cancelled = true
    }
  }, [file, onComplete, onError])

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <div className="flex items-center gap-3">
        <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
        <div>
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            {status}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Using TensorFlow.js MNIST Model
          </p>
        </div>
      </div>

      <div className="w-full max-w-md">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
          {progress}%
        </p>
      </div>
    </div>
  )
}

// Results display component
interface HandwritingResultsProps {
  result: HandwritingResult
}

export function HandwritingResults({ result }: HandwritingResultsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Recognition Complete
        </h2>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Detected Digits
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {result.digits.length}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Avg. Confidence
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {(
              result.digits.reduce((sum, d) => sum + d.confidence, 0) /
              result.digits.length
            ).toFixed(1)}
            %
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Processing Time
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {(result.processingTime / 1000).toFixed(2)}s
          </p>
        </div>
      </div>

      {/* Combined Result */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Recognized Number:
        </h3>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <p className="text-4xl font-bold text-center text-gray-900 dark:text-white font-mono tracking-wider">
            {result.combinedText}
          </p>
        </div>
      </div>

      {/* Individual Digits */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Individual Digits:
        </h3>
        <div className="flex flex-wrap gap-3">
          {result.digits.map((digit, index) => {
            const getConfidenceColor = (conf: number) => {
              if (conf >= 90)
                return 'bg-green-100 dark:bg-green-900/30 border-green-500'
              if (conf >= 70)
                return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500'
              return 'bg-red-100 dark:bg-red-900/30 border-red-500'
            }

            return (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${getConfidenceColor(digit.confidence)}`}
              >
                <div className="text-3xl font-bold text-center text-gray-900 dark:text-white font-mono mb-1">
                  {digit.digit >= 0 ? digit.digit : '?'}
                </div>
                <div className="text-xs text-center text-gray-600 dark:text-gray-400">
                  {digit.confidence.toFixed(1)}%
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Preprocessed Image */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Preprocessed Image:
        </h3>
        <img
          src={result.preprocessedImage}
          alt="Preprocessed"
          className="max-w-full rounded-lg border border-gray-300 dark:border-gray-600"
        />
      </div>
    </div>
  )
}
