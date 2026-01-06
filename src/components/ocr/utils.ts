export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 80) return 'text-green-600 dark:text-green-400'
  if (confidence >= 60) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

export const getConfidenceLabel = (confidence: number): string => {
  if (confidence >= 80) return 'High'
  if (confidence >= 60) return 'Medium'
  return 'Low'
}

export const VALID_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
] as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const validateImageFile = (
  file: File,
): { valid: boolean; error?: string } => {
  if (!VALID_IMAGE_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: 'Please select a valid image file (JPG, PNG, GIF, WEBP, or BMP)',
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size must be less than 10MB',
    }
  }

  return { valid: true }
}

export const preprocessImage = async (
  file: File,
  options: {
    scale?: number
    grayscale?: boolean
    contrast?: number
    brightness?: number
    sharpen?: boolean
    threshold?: number | null
  } = {},
): Promise<string> => {
  const {
    scale = 2,
    grayscale = true,
    contrast = 1.5,
    brightness = 1.1,
    sharpen = false,
    threshold = null,
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas not supported'))
      return
    }

    img.onload = () => {
      // 1. Set canvas size with scaling
      canvas.width = img.width * scale
      canvas.height = img.height * scale

      // 2. Draw scaled image
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // 3. Get image data for pixel manipulation
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // 4. Apply filters
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i]
        let g = data[i + 1]
        let b = data[i + 2]

        // Grayscale
        if (grayscale) {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b
          r = g = b = gray
        }

        // Contrast & Brightness
        r = ((r - 128) * contrast + 128) * brightness
        g = ((g - 128) * contrast + 128) * brightness
        b = ((b - 128) * contrast + 128) * brightness

        // Clamp values
        r = Math.max(0, Math.min(255, r))
        g = Math.max(0, Math.min(255, g))
        b = Math.max(0, Math.min(255, b))

        // Binarization (threshold)
        if (threshold !== null) {
          const avg = (r + g + b) / 3
          r = g = b = avg > threshold ? 255 : 0
        }

        data[i] = r
        data[i + 1] = g
        data[i + 2] = b
      }

      // 5. Put modified image data back
      ctx.putImageData(imageData, 0, 0)

      // 6. Optional: Sharpening (using convolution)
      if (sharpen) {
        // Apply sharpening filter
        const tempCanvas = document.createElement('canvas')
        const tempCtx = tempCanvas.getContext('2d')
        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height
        tempCtx?.drawImage(canvas, 0, 0)

        ctx.filter = 'contrast(1.2) brightness(1.05)'
        ctx.drawImage(tempCanvas, 0, 0)
        ctx.filter = 'none'
      }

      // 7. Return as data URL
      resolve(canvas.toDataURL('image/png'))
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}
