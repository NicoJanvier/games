interface ImagePreviewProps {
  imageUrl: string
}

export function ImagePreview({ imageUrl }: ImagePreviewProps) {
  if (!imageUrl) return null

  return (
    <div className="mb-4">
      <img
        src={imageUrl}
        alt="Preview"
        className="max-w-full max-h-96 mx-auto rounded-lg shadow-sm"
      />
    </div>
  )
}

