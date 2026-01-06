import * as tf from '@tensorflow/tfjs'

let model: tf.LayersModel | null = null

// Create a CNN model for MNIST digit recognition
function createMNISTModel(): tf.Sequential {
  const mnistModel = tf.sequential()

  // First convolutional layer
  mnistModel.add(
    tf.layers.conv2d({
      inputShape: [28, 28, 1],
      kernelSize: 5,
      filters: 8,
      strides: 1,
      activation: 'relu',
      kernelInitializer: 'varianceScaling',
    }),
  )
  mnistModel.add(tf.layers.maxPooling2d({ poolSize: [2, 2], strides: [2, 2] }))

  // Second convolutional layer
  mnistModel.add(
    tf.layers.conv2d({
      kernelSize: 5,
      filters: 16,
      strides: 1,
      activation: 'relu',
      kernelInitializer: 'varianceScaling',
    }),
  )
  mnistModel.add(tf.layers.maxPooling2d({ poolSize: [2, 2], strides: [2, 2] }))

  // Flatten and dense layers
  mnistModel.add(tf.layers.flatten())

  mnistModel.add(
    tf.layers.dense({
      units: 10,
      kernelInitializer: 'varianceScaling',
      activation: 'softmax',
    }),
  )

  return mnistModel
}

// Load or create MNIST model
export async function loadMNISTModel(): Promise<tf.LayersModel> {
  if (model) {
    return model
  }

  try {
    // Try to load from browser storage (IndexedDB)
    try {
      model = await tf.loadLayersModel('indexeddb://mnist-model')
      console.log('MNIST model loaded from browser storage')
      return model
    } catch (loadError) {
      console.log('No cached model found, creating and training new model...')
    }

    // Create and train a new model
    console.log('Creating MNIST model...')
    const newModel = createMNISTModel()

    // Compile the model
    newModel.compile({
      optimizer: tf.train.adam(),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    })

    // Load MNIST data from TensorFlow's hosted datasets
    console.log('Loading MNIST training data...')
    const data = new MnistData()
    await data.load()

    // Train with a small subset for faster initial setup
    console.log('Training model (this will take ~30 seconds)...')
    const batchSize = 512

    await newModel.fit(data.trainImages, data.trainLabels, {
      batchSize,
      validationSplit: 0.15,
      epochs: 1,
      callbacks: {
        onBatchEnd: (batch, logs) => {
          console.log(`Batch ${batch}: loss = ${logs?.loss.toFixed(4)}`)
        },
      },
    })

    // Save model to browser storage for next time
    await newModel.save('indexeddb://mnist-model')
    console.log('Model trained and saved to browser storage')

    model = newModel
    return model
  } catch (error) {
    console.error('Failed to load/create MNIST model:', error)
    throw new Error(
      `Failed to initialize MNIST model: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

// MNIST data loader
class MnistData {
  trainImages!: tf.Tensor
  trainLabels!: tf.Tensor

  async load() {
    // Load a subset of MNIST data from TensorFlow.js sprite and labels
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    // Use TensorFlow.js tutorial data (smaller subset)
    const MNIST_IMAGES_SPRITE_PATH =
      'https://storage.googleapis.com/learnjs-data/model-builder/mnist_images.png'
    const MNIST_LABELS_PATH =
      'https://storage.googleapis.com/learnjs-data/model-builder/mnist_labels_uint8'

    // Load the sprite image
    await new Promise((resolve, reject) => {
      img.crossOrigin = 'anonymous'
      img.onload = resolve
      img.onerror = reject
      img.src = MNIST_IMAGES_SPRITE_PATH
    })

    // Load labels
    const labelsRequest = await fetch(MNIST_LABELS_PATH)
    const labelsData = new Uint8Array(await labelsRequest.arrayBuffer())

    // Extract images from sprite (65000 images, 28x28 each)
    const numImages = 5000 // Use smaller subset for faster training
    canvas.width = img.width
    canvas.height = numImages * 28
    ctx.drawImage(img, 0, 0)

    const datasetBytesBuffer = new ArrayBuffer(numImages * 28 * 28 * 4)
    const datasetBytes = new Float32Array(datasetBytesBuffer)

    for (let i = 0; i < numImages; i++) {
      const imageData = ctx.getImageData(0, i * 28, 28, 28)
      for (let j = 0; j < 28 * 28; j++) {
        datasetBytes[i * 28 * 28 + j] = imageData.data[j * 4] / 255
      }
    }

    this.trainImages = tf.tensor4d(datasetBytes, [numImages, 28, 28, 1])

    // Convert labels to one-hot encoding
    const labelsArray = Array.from(labelsData.slice(0, numImages))
    this.trainLabels = tf.oneHot(tf.tensor1d(labelsArray, 'int32'), 10)
  }
}

export interface DigitPrediction {
  digit: number
  confidence: number
  probabilities: Array<number>
}

// Preprocess image for MNIST model (expects 28x28 grayscale)
export function preprocessForMNIST(imageData: ImageData): tf.Tensor4D {
  const result = tf.tidy(() => {
    // Convert to tensor and normalize
    let tensor = tf.browser.fromPixels(imageData, 1)

    // Resize to 28x28
    tensor = tf.image.resizeBilinear(tensor, [28, 28])

    // Normalize to [0, 1]
    tensor = tensor.div(255.0)

    // Invert colors if needed (MNIST expects white digits on black background)
    // Check if we need to invert by looking at mean pixel value
    const mean = tensor.mean().dataSync()[0]
    if (mean > 0.5) {
      // Background is light, invert
      tensor = tf.sub(1.0, tensor)
    }

    // Reshape to [1, 28, 28, 1] for model input
    return tensor.expandDims(0)
  })
  return result as tf.Tensor4D
}

// Predict digit from preprocessed tensor
export async function predictDigit(
  inputTensor: tf.Tensor4D,
): Promise<DigitPrediction> {
  const mnistModel = await loadMNISTModel()

  return tf.tidy(() => {
    const prediction = mnistModel.predict(inputTensor) as tf.Tensor
    const probabilities = Array.from(prediction.dataSync())
    const digit = probabilities.indexOf(Math.max(...probabilities))
    const confidence = probabilities[digit] * 100

    return {
      digit,
      confidence,
      probabilities,
    }
  })
}

// Predict digit directly from image data
export async function predictDigitFromImage(
  imageData: ImageData,
): Promise<DigitPrediction> {
  const tensor = preprocessForMNIST(imageData)
  const prediction = await predictDigit(tensor)
  tensor.dispose()
  return prediction
}

// Clean up model from memory
export function disposeModel(): void {
  if (model) {
    model.dispose()
    model = null
  }
}
