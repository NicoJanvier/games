interface ExtractedTextProps {
  text: string
}

export function ExtractedText({ text }: ExtractedTextProps) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Extracted Text:
      </h3>
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
        <p className="text-gray-900 dark:text-white whitespace-pre-wrap font-mono text-sm">
          {text || '(No text detected)'}
        </p>
      </div>
    </div>
  )
}
