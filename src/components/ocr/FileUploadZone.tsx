import { useRef } from 'react'
import { Upload } from 'lucide-react'

interface FileUploadZoneProps {
  selectedFile: File | null
  onFileSelect: (file: File) => void
}

export function FileUploadZone({
  selectedFile,
  onFileSelect,
}: FileUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  return (
    <div className="mb-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp"
        onChange={handleFileChange}
        className="hidden"
        id="file-input"
      />
      <label
        htmlFor="file-input"
        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
      >
        <Upload className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-2" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {selectedFile ? selectedFile.name : 'Click to select an image'}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          JPG, PNG, GIF, WEBP, or BMP (max 10MB)
        </span>
      </label>
    </div>
  )
}

