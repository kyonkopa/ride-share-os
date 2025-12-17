/**
 * Converts a File object to a base64-encoded data URI string
 * @param file - The File object to convert
 * @returns A Promise that resolves to a data URI string (data:image/png;base64,...)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Return as data URI format (data:image/png;base64,...)
      resolve(result)
    }
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}

/**
 * Validates and processes an image file, converting it to base64
 * @param file - The File object to process, or null to clear the value
 * @param onValueChange - Callback function that receives the base64 string (or null)
 * @param options - Optional configuration
 * @param options.maxSizeBytes - Maximum file size in bytes (default: 5MB)
 * @param options.onError - Optional error callback
 */
export async function handleImageFileChange(
  file: File | null,
  onValueChange: (value: string | null) => void,
  options?: {
    maxSizeBytes?: number
    onError?: (error: string) => void
  }
): Promise<void> {
  const maxSizeBytes = options?.maxSizeBytes ?? 5 * 1024 * 1024 // Default 5MB
  const onError = options?.onError ?? ((error: string) => alert(error))

  // If no file, clear the value
  if (!file) {
    onValueChange(null)
    return
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    onError("Please select an image file")
    return
  }

  // Validate file size
  if (file.size > maxSizeBytes) {
    onError("Image size must be less than 5MB")
    return
  }

  try {
    // Convert file to base64
    const base64 = await fileToBase64(file)
    onValueChange(base64)
  } catch (error) {
    console.error("Error converting file to base64:", error)
    onError("Failed to process image. Please try again.")
  }
}
