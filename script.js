// Convert an image to a base64-encoded data URL
function convertImageToDataURL(imageFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(imageFile)
    reader.onload = () => {
      resolve(reader.result)
    }
    reader.onerror = (error) => {
      reject(error)
    }
  })
}

// Convert an array of images to base64-encoded data URLs
async function convertImagesToDataURLs(imageFiles) {
  const dataURLs = []
  for (const imageFile of imageFiles) {
    const dataURL = await convertImageToDataURL(imageFile)
    dataURLs.push(dataURL)
  }
  return dataURLs
}

// Create a zip folder containing the converted images using "JSZip"
function createZipFolder(imageFiles, webpDataURLs) {
  const zip = new JSZip()
  const conversionInfo = document.getElementById("conversionInfo")
  let totalSizeBefore = 0
  let totalSizeAfter = 0
  Array.from(imageFiles).forEach((imageFile, index) => {
    const webpDataURL = webpDataURLs[index]
    const webpBlob = dataURLToBlob(webpDataURL)
    zip.file(`${imageFile.name.replace(/\.[^/.]+$/, "")}.webp`, webpBlob)
    const sizeBefore = imageFile.size
    const sizeAfter = webpBlob.size
    const reduction = ((sizeBefore - sizeAfter) / sizeBefore) * 100
    totalSizeBefore += sizeBefore
    totalSizeAfter += sizeAfter
    const listItem = document.createElement("li")
    listItem.innerHTML = `
      <strong>${imageFile.name}</strong>:
      ${formatSize(sizeBefore)} before
      (${formatPercentage(reduction)} reduction),
      ${formatSize(sizeAfter)} after
    `
    conversionInfo.appendChild(listItem)
  })
  const totalReduction =
    ((totalSizeBefore - totalSizeAfter) / totalSizeBefore) * 100
  const totalItem = document.createElement("div")
  totalItem.innerHTML = `
    <hr>
    <strong class="total">Total:</strong>
    ${formatSize(totalSizeBefore)} before
    (${formatPercentage(totalReduction)} reduction),
    ${formatSize(totalSizeAfter)} after
  `
  conversionInfo.appendChild(totalItem)
  return zip.generateAsync({ type: "blob" })
}

// Format a file size in bytes to a human-readable string
function formatSize(bytes) {
  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

// Format a percentage as a string with two decimal places
function formatPercentage(percentage) {
  return `${percentage.toFixed(2)}%`
}

// Convert a base64-encoded data URL to a Blob object
function dataURLToBlob(dataURL) {
  const parts = dataURL.split(";base64,")
  const contentType = parts[0].split(":")[1]
  const b64 = atob(parts[1])
  let n = b64.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = b64.charCodeAt(n)
  }
  return new Blob([u8arr], { type: contentType })
}

// Handle the "Convert to WebP" button click event
const convertButton = document.getElementById("convertButton")
convertButton.addEventListener("click", async () => {
  const imageUpload = document.getElementById("imageUpload")
  const imageFiles = imageUpload.files
  if (imageFiles.length === 0) {
    alert("Please select one or more images to convert.")
    return
  }
  const dataURLs = await convertImagesToDataURLs(imageFiles)
  const webpDataURLs = await Promise.all(dataURLs.map(convertToWebP))
  const zipBlob = await createZipFolder(imageFiles, webpDataURLs)
  const downloadButton = document.getElementById("downloadButton")
  downloadButton.href = URL.createObjectURL(zipBlob)
  downloadButton.style.display = ""
})

// Convert a base64-encoded data URL to WebP format
function convertToWebP(dataURL) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      ctx.drawImage(img, 0, 0)
      const webpDataURL = canvas.toDataURL("image/webp")
      resolve(webpDataURL)
    }
    img.onerror = (error) => {
      reject(error)
    }
    img.src = dataURL
  })
}
