import { useState } from 'react'
import type { Bbox, Block, Line, RecognizeResult, Word } from 'tesseract.js'

interface OCRVisualizationProps {
  imageUrl: string
  result: RecognizeResult
}

type VisualizationLevel = 'blocks' | 'lines' | 'words'

export function OCRVisualization({ imageUrl, result }: OCRVisualizationProps) {
  const [level, setLevel] = useState<VisualizationLevel>('words')
  const [showText, setShowText] = useState(true)
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  })

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setImageDimensions({ width: img.width, height: img.height })
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'rgba(34, 197, 94, 0.3)' // green
    if (confidence >= 60) return 'rgba(234, 179, 8, 0.3)' // yellow
    return 'rgba(239, 68, 68, 0.3)' // red
  }

  const getConfidenceBorder = (confidence: number) => {
    if (confidence >= 80) return 'rgb(34, 197, 94)' // green
    if (confidence >= 60) return 'rgb(234, 179, 8)' // yellow
    return 'rgb(239, 68, 68)' // red
  }

  // Extract data based on level
  const getBoxes = (): Array<{
    bbox: Bbox
    text: string
    confidence: number
  }> => {
    const blocks = (result.data as any).blocks || []

    if (level === 'blocks') {
      return blocks.map((block: Block) => ({
        bbox: block.bbox,
        text: block.text,
        confidence: block.confidence,
      }))
    } else if (level === 'lines') {
      const lines: Array<{ bbox: Bbox; text: string; confidence: number }> = []
      blocks.forEach((block: Block) => {
        block.paragraphs.forEach((para) => {
          para.lines.forEach((line: Line) => {
            lines.push({
              bbox: line.bbox,
              text: line.text,
              confidence: line.confidence,
            })
          })
        })
      })
      return lines
    } else {
      const words: Array<{ bbox: Bbox; text: string; confidence: number }> = []
      blocks.forEach((block: Block) => {
        block.paragraphs.forEach((para) => {
          para.lines.forEach((line: Line) => {
            line.words.forEach((word: Word) => {
              words.push({
                bbox: word.bbox,
                text: word.text,
                confidence: word.confidence,
              })
            })
          })
        })
      })
      return words
    }
  }

  const boxes = getBoxes()

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Visualization Level:
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as VisualizationLevel)}
            className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="blocks">Blocks</option>
            <option value="lines">Lines</option>
            <option value="words">Words</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showText}
            onChange={(e) => setShowText(e.target.checked)}
            className="rounded"
          />
          <span className="text-gray-700 dark:text-gray-300">Show Text</span>
        </label>

        <div className="ml-auto text-xs text-gray-600 dark:text-gray-400">
          <span className="inline-block w-3 h-3 bg-green-500/30 border border-green-500 mr-1"></span>
          High confidence
          <span className="inline-block w-3 h-3 bg-yellow-500/30 border border-yellow-500 ml-3 mr-1"></span>
          Medium
          <span className="inline-block w-3 h-3 bg-red-500/30 border border-red-500 ml-3 mr-1"></span>
          Low
        </div>
      </div>

      {/* Image with Overlays */}
      <div className="relative inline-block max-w-full">
        <img
          src={imageUrl}
          alt="OCR Analysis"
          className="max-w-full rounded-lg border border-gray-300 dark:border-gray-600"
          onLoad={handleImageLoad}
        />

        {/* Bounding boxes overlay */}
        {imageDimensions.width > 0 && (
          <div className="absolute inset-0">
            {boxes.map((box, index) => {
              const { bbox, text, confidence } = box
              const width = bbox.x1 - bbox.x0
              const height = bbox.y1 - bbox.y0

              return (
                <div
                  key={index}
                  className="absolute group cursor-default"
                  style={{
                    left: `${bbox.x0}px`,
                    top: `${bbox.y0}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                    backgroundColor: getConfidenceColor(confidence),
                    border: `2px solid ${getConfidenceBorder(confidence)}`,
                  }}
                >
                  {showText && text && (
                    <div className="absolute -top-6 left-0 px-1 text-xs font-mono whitespace-nowrap bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {text} ({confidence.toFixed(0)}%)
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {boxes.length} {level} detected
      </div>
    </div>
  )
}
