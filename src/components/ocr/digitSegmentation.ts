export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface SegmentedDigit {
  bbox: BoundingBox
  imageData: ImageData
}

// Simple connected component labeling to find digit regions
export function segmentDigits(imageData: ImageData): SegmentedDigit[] {
  const { width, height, data } = imageData
  const visited = new Array(width * height).fill(false)
  const components: BoundingBox[] = []

  // Convert to binary (already should be from preprocessing)
  const isForeground = (x: number, y: number): boolean => {
    const idx = (y * width + x) * 4
    const value = data[idx] // R channel (should be grayscale)
    return value < 128 // Dark pixels are foreground (digits)
  }

  // Flood fill to find connected components
  const floodFill = (startX: number, startY: number): BoundingBox | null => {
    const stack: Array<[number, number]> = [[startX, startY]]
    let minX = startX,
      maxX = startX,
      minY = startY,
      maxY = startY
    let pixelCount = 0

    while (stack.length > 0) {
      const [x, y] = stack.pop()!

      if (x < 0 || x >= width || y < 0 || y >= height) continue

      const idx = y * width + x
      if (visited[idx] || !isForeground(x, y)) continue

      visited[idx] = true
      pixelCount++

      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)

      // Check 8 neighbors
      stack.push([x + 1, y])
      stack.push([x - 1, y])
      stack.push([x, y + 1])
      stack.push([x, y - 1])
      stack.push([x + 1, y + 1])
      stack.push([x - 1, y - 1])
      stack.push([x + 1, y - 1])
      stack.push([x - 1, y + 1])
    }

    // Filter out noise (too small) and borders (too large)
    const componentWidth = maxX - minX + 1
    const componentHeight = maxY - minY + 1
    const area = componentWidth * componentHeight

    if (
      pixelCount < 50 || // Too small (noise)
      area > width * height * 0.9 || // Too large (probably background)
      componentWidth < 10 ||
      componentHeight < 10
    ) {
      return null
    }

    return {
      x: minX,
      y: minY,
      width: componentWidth,
      height: componentHeight,
    }
  }

  // Find all connected components
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (!visited[idx] && isForeground(x, y)) {
        const bbox = floodFill(x, y)
        if (bbox) {
          components.push(bbox)
        }
      }
    }
  }

  // Sort left to right
  components.sort((a, b) => a.x - b.x)

  // Extract image data for each component
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  return components.map((bbox) => {
    // Add padding around digit
    const padding = 5
    const paddedX = Math.max(0, bbox.x - padding)
    const paddedY = Math.max(0, bbox.y - padding)
    const paddedWidth = Math.min(
      width - paddedX,
      bbox.width + padding * 2,
    )
    const paddedHeight = Math.min(
      height - paddedY,
      bbox.height + padding * 2,
    )

    // Create a square canvas (MNIST expects square images)
    const size = Math.max(paddedWidth, paddedHeight)
    canvas.width = size
    canvas.height = size

    // Fill with white background
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, size, size)

    // Create temporary canvas for source
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')!
    tempCanvas.width = width
    tempCanvas.height = height
    tempCtx.putImageData(imageData, 0, 0)

    // Center the digit in the square canvas
    const offsetX = (size - paddedWidth) / 2
    const offsetY = (size - paddedHeight) / 2

    ctx.drawImage(
      tempCanvas,
      paddedX,
      paddedY,
      paddedWidth,
      paddedHeight,
      offsetX,
      offsetY,
      paddedWidth,
      paddedHeight,
    )

    const segmentData = ctx.getImageData(0, 0, size, size)

    return {
      bbox: {
        x: paddedX,
        y: paddedY,
        width: paddedWidth,
        height: paddedHeight,
      },
      imageData: segmentData,
    }
  })
}

// Alternative: Simple column-based segmentation for evenly spaced digits
export function segmentDigitsSimple(
  imageData: ImageData,
  expectedDigits?: number,
): SegmentedDigit[] {
  const { width, height } = imageData

  if (!expectedDigits) {
    // Use connected component method
    return segmentDigits(imageData)
  }

  // Divide image into equal columns
  const digitWidth = Math.floor(width / expectedDigits)
  const segments: SegmentedDigit[] = []

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')!
  tempCanvas.width = width
  tempCanvas.height = height
  tempCtx.putImageData(imageData, 0, 0)

  for (let i = 0; i < expectedDigits; i++) {
    const x = i * digitWidth
    const size = Math.max(digitWidth, height)

    canvas.width = size
    canvas.height = size

    // White background
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, size, size)

    // Center digit
    const offsetX = (size - digitWidth) / 2
    const offsetY = (size - height) / 2

    ctx.drawImage(
      tempCanvas,
      x,
      0,
      digitWidth,
      height,
      offsetX,
      offsetY,
      digitWidth,
      height,
    )

    const segmentData = ctx.getImageData(0, 0, size, size)

    segments.push({
      bbox: { x, y: 0, width: digitWidth, height },
      imageData: segmentData,
    })
  }

  return segments
}

