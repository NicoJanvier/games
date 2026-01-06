import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Brain, Type } from 'lucide-react'
import { PSM, createWorker } from 'tesseract.js'
import { ErrorAlert } from '../components/ocr/ErrorAlert'
import { FileUploadZone } from '../components/ocr/FileUploadZone'
import {
  HandwritingResults,
  HandwrittenDigitRecognizer,
} from '../components/ocr/HandwrittenDigitRecognizer'
import { ImagePreview } from '../components/ocr/ImagePreview'
import { OCRResults } from '../components/ocr/OCRResults'
import { ProcessButton } from '../components/ocr/ProcessButton'
import { preprocessImage, validateImageFile } from '../components/ocr/utils'
import type { HandwritingResult } from '../components/ocr/HandwrittenDigitRecognizer'
import type { RecognizeResult } from 'tesseract.js'

export const Route = createFileRoute('/ocr')({
  component: RouteComponent,
})

type OCREngine = 'tesseract' | 'tensorflow'

function RouteComponent() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [preprocessedImage, setPreprocessedImage] = useState<string>('')
  const [ocrResult, setOcrResult] = useState<RecognizeResult | null>(null)
  const [handwritingResult, setHandwritingResult] =
    useState<HandwritingResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>('')
  const [progress, setProgress] = useState(0)
  const [processingTime, setProcessingTime] = useState<number>(0)
  const [engine, setEngine] = useState<OCREngine>('tensorflow')

  const handleFileSelect = (file: File) => {
    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || '')
      return
    }

    setError('')
    setSelectedFile(file)
    setOcrResult(null)
    setHandwritingResult(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleProcess = async () => {
    if (!selectedFile) return

    if (engine === 'tensorflow') {
      // TensorFlow will handle its own processing via HandwrittenDigitRecognizer
      setIsProcessing(true)
      setError('')
      setOcrResult(null)
      setHandwritingResult(null)
    } else {
      // Tesseract processing
      setIsProcessing(true)
      setError('')
      setProgress(0)
      setOcrResult(null)
      setHandwritingResult(null)
      const startTime = Date.now()

      try {
        const preprocessedImageUrl = await preprocessImage(selectedFile, {
          scale: 2,
          grayscale: true,
          contrast: 1.8,
          brightness: 1.1,
          sharpen: false,
          threshold: 128,
        })
        setPreprocessedImage(preprocessedImageUrl)
        const worker = await createWorker('eng', 1, {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100))
            }
          },
        })

        await worker.setParameters({
          tessedit_char_whitelist: '0123456789',
          tessedit_pageseg_mode: PSM.SINGLE_LINE,
        })

        const result = await worker.recognize(
          preprocessedImageUrl,
          {},
          {
            text: true,
            blocks: true,
          },
        )
        setOcrResult(result)
        console.log(result)
        setProcessingTime(Date.now() - startTime)

        await worker.terminate()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'OCR processing failed')
      } finally {
        setIsProcessing(false)
        setProgress(0)
      }
    }
  }

  const handleTFComplete = (result: HandwritingResult) => {
    setHandwritingResult(result)
    setIsProcessing(false)
  }

  const handleTFError = (errorMsg: string) => {
    setError(errorMsg)
    setIsProcessing(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            OCR Text Recognition
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose your recognition engine and upload an image
          </p>
        </div>

        {/* Engine Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Recognition Engine:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setEngine('tesseract')}
              className={`p-4 rounded-lg border-2 transition-all ${
                engine === 'tesseract'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <Type
                  className={`w-6 h-6 ${engine === 'tesseract' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
                />
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Tesseract OCR
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Best for printed numbers
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setEngine('tensorflow')}
              className={`p-4 rounded-lg border-2 transition-all ${
                engine === 'tensorflow'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <Brain
                  className={`w-6 h-6 ${engine === 'tensorflow' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
                />
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    TensorFlow.js
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Best for handwritten digits
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <FileUploadZone
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
          />

          <ErrorAlert message={error} />

          <ImagePreview imageUrl={imagePreview} />

          {selectedFile && !isProcessing && (
            <ProcessButton
              isProcessing={isProcessing}
              progress={progress}
              onProcess={handleProcess}
            />
          )}

          {/* TensorFlow Processing */}
          {isProcessing && engine === 'tensorflow' && selectedFile && (
            <HandwrittenDigitRecognizer
              file={selectedFile}
              onComplete={handleTFComplete}
              onError={handleTFError}
            />
          )}
        </div>

        {/* Results Display */}
        {ocrResult && engine === 'tesseract' && (
          <OCRResults
            result={ocrResult}
            imageUrl={preprocessedImage}
            processingTime={processingTime}
          />
        )}

        {handwritingResult && engine === 'tensorflow' && (
          <HandwritingResults result={handwritingResult} />
        )}
      </div>
    </div>
  )
}
