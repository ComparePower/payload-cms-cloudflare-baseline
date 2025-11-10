/**
 * Payload Media Uploader
 *
 * Uploads images to Payload's media collection (S3/R2 storage)
 * and creates asset registry entries.
 */

import type { Payload } from 'payload'
import fs from 'fs/promises'
import path from 'path'
import https from 'https'
import http from 'http'
import { Readable } from 'stream'
import crypto from 'crypto'

export interface UploadResult {
  mediaId: string
  assetId: string
  url: string
  filename: string
  mimeType: string
  filesize: number
  width?: number
  height?: number
  isDuplicate?: boolean // True if image already existed
  fileHash?: string // SHA256 hash for deduplication
}

/**
 * Calculate SHA256 hash of buffer for deduplication
 */
function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/**
 * Find existing media by file hash
 */
async function findMediaByHash(
  payload: Payload,
  fileHash: string,
  mimeType: string
): Promise<any | null> {
  const results = await payload.find({
    collection: 'media',
    where: {
      and: [
        { fileHash: { equals: fileHash } },
        { mimeType: { equals: mimeType } }
      ]
    },
    limit: 1
  })

  return results.docs.length > 0 ? results.docs[0] : null
}

/**
 * Download image from URL to buffer
 */
async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http

    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`))
        return
      }

      const chunks: Buffer[] = []
      response.on('data', (chunk) => chunks.push(chunk))
      response.on('end', () => resolve(Buffer.concat(chunks)))
      response.on('error', reject)
    })
  })
}

/**
 * Read local image file
 */
async function readLocalImage(
  imagePath: string,
  astroProjectPath: string
): Promise<Buffer> {
  // Resolve path relative to Astro project
  const resolvedPath = path.isAbsolute(imagePath)
    ? imagePath
    : path.join(astroProjectPath, imagePath)

  return await fs.readFile(resolvedPath)
}

/**
 * Get image buffer from various sources
 */
async function getImageBuffer(
  src: string,
  astroProjectPath: string
): Promise<Buffer> {
  // Remote URL
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return await downloadImage(src)
  }

  // Asset path prefix
  if (src.startsWith('@assets-src-images/')) {
    const localPath = src.replace('@assets-src-images/', 'src/assets/images/')
    return await readLocalImage(localPath, astroProjectPath)
  }

  if (src.startsWith('@assets-src/')) {
    const localPath = src.replace('@assets-src/', 'src/assets/')
    return await readLocalImage(localPath, astroProjectPath)
  }

  if (src.startsWith('@assets-public/')) {
    const localPath = src.replace('@assets-public/', 'public/')
    return await readLocalImage(localPath, astroProjectPath)
  }

  if (src.startsWith('@assets-cdn/')) {
    const cdnUrl = src.replace('@assets-cdn/', 'https://cdn.comparepower.com/')
    return await downloadImage(cdnUrl)
  }

  // Absolute or relative path
  return await readLocalImage(src, astroProjectPath)
}

/**
 * Detect MIME type from filename
 */
function detectMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()

  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.avif': 'image/avif',
  }

  return mimeTypes[ext] || 'application/octet-stream'
}

/**
 * Upload image to Payload media collection
 *
 * @param payload - Payload instance
 * @param src - Image source (URL or path)
 * @param assetId - Asset ID from registry
 * @param alt - Alt text
 * @param astroProjectPath - Path to Astro project
 * @returns Upload result with media ID and URL
 */
export async function uploadImageToPayload(
  payload: Payload,
  src: string,
  assetId: string,
  alt: string,
  astroProjectPath: string
): Promise<UploadResult> {
  try {
    // Get image buffer
    const imageBuffer = await getImageBuffer(src, astroProjectPath)

    // Generate filename from asset ID
    const ext = path.extname(src) || '.jpg'
    const filename = `${assetId}${ext}`
    const mimeType = detectMimeType(filename)

    // Calculate file hash for deduplication
    const fileHash = calculateFileHash(imageBuffer)

    // Check if image already exists with same hash and MIME type
    const existingMedia = await findMediaByHash(payload, fileHash, mimeType)

    if (existingMedia) {
      // Return existing media instead of re-uploading
      return {
        mediaId: existingMedia.id,
        assetId,
        url: existingMedia.url || '',
        filename: existingMedia.filename || filename,
        mimeType: existingMedia.mimeType || mimeType,
        filesize: existingMedia.filesize || imageBuffer.length,
        width: existingMedia.width,
        height: existingMedia.height,
        isDuplicate: true,
        fileHash,
      }
    }

    // Create readable stream from buffer
    const stream = Readable.from(imageBuffer)

    // Upload to Payload media collection with file hash
    const mediaDoc = await payload.create({
      collection: 'media',
      data: {
        alt: alt || assetId,
        fileHash, // Store hash for future deduplication
      },
      file: {
        data: imageBuffer,
        mimetype: mimeType,
        name: filename,
        size: imageBuffer.length,
      },
    })

    return {
      mediaId: mediaDoc.id as string,
      assetId,
      url: mediaDoc.url || '',
      filename: mediaDoc.filename || filename,
      mimeType: mediaDoc.mimeType || mimeType,
      filesize: mediaDoc.filesize || imageBuffer.length,
      width: mediaDoc.width,
      height: mediaDoc.height,
      isDuplicate: false,
      fileHash,
    }
  } catch (error: any) {
    throw new Error(
      `Failed to upload image "${src}" as "${assetId}": ${error.message}`
    )
  }
}

/**
 * Batch upload images with progress tracking
 */
export async function batchUploadImages(
  payload: Payload,
  images: Array<{
    src: string
    assetId: string
    alt: string
  }>,
  astroProjectPath: string,
  onProgress?: (current: number, total: number, assetId: string) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = []

  for (let i = 0; i < images.length; i++) {
    const image = images[i]

    if (onProgress) {
      onProgress(i + 1, images.length, image.assetId)
    }

    try {
      const result = await uploadImageToPayload(
        payload,
        image.src,
        image.assetId,
        image.alt,
        astroProjectPath
      )
      results.push(result)
    } catch (error: any) {
      console.error(`Failed to upload ${image.assetId}:`, error.message)
      // Continue with other images
    }
  }

  return results
}

/**
 * Check if media already exists by filename
 */
export async function findExistingMedia(
  payload: Payload,
  assetId: string
): Promise<string | null> {
  try {
    const result = await payload.find({
      collection: 'media',
      where: {
        filename: {
          contains: assetId,
        },
      },
      limit: 1,
    })

    if (result.docs.length > 0) {
      return result.docs[0].id as string
    }

    return null
  } catch (error) {
    return null
  }
}

/**
 * Upload image with deduplication
 */
export async function uploadImageWithDedup(
  payload: Payload,
  src: string,
  assetId: string,
  alt: string,
  astroProjectPath: string
): Promise<UploadResult> {
  // Check if already uploaded
  const existingId = await findExistingMedia(payload, assetId)

  if (existingId) {
    const existing = await payload.findByID({
      collection: 'media',
      id: existingId,
    })

    return {
      mediaId: existingId,
      assetId,
      url: existing.url || '',
      filename: existing.filename || '',
      mimeType: existing.mimeType || '',
      filesize: existing.filesize || 0,
      width: existing.width,
      height: existing.height,
    }
  }

  // Upload new
  return await uploadImageToPayload(payload, src, assetId, alt, astroProjectPath)
}
