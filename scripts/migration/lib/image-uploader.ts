/**
 * Image Upload Utility for MDX Migration
 *
 * Uploads image files to Payload's media collection
 * and returns the created media document ID for block references.
 */

import fs from 'fs/promises'
import path from 'path'
import slugify from '@sindresorhus/slugify'
import type { Payload } from 'payload'

interface ImageUploadResult {
  mediaId: string
  filename: string
  alt: string
}

/**
 * Upload an image file to Payload media collection
 *
 * @param payload - Payload instance
 * @param imagePath - Full path to image file on filesystem
 * @param alt - Alt text for the image
 * @returns Media document ID
 */
export async function uploadImage(
  payload: Payload,
  imagePath: string,
  alt: string
): Promise<ImageUploadResult> {
  // Read the image file
  const imageBuffer = await fs.readFile(imagePath)
  const originalFilename = path.basename(imagePath)

  // Sanitize filename to kebab-case (this-is-my-name.jpg)
  const filename = sanitizeFilename(originalFilename)
  const mimeType = getMimeType(filename)

  // Create file object in Payload's expected format for Node.js
  // Payload expects an object with specific properties for file uploads
  const fileData = {
    data: imageBuffer,
    mimetype: mimeType,
    name: filename,
    size: imageBuffer.length,
  }

  // Upload to Payload media collection
  const media = await payload.create({
    collection: 'media',
    data: {
      alt: alt || '',
    },
    file: fileData as any,
  })

  return {
    mediaId: media.id,
    filename: media.filename || filename,
    alt: media.alt || alt,
  }
}

/**
 * Find image file in source directory
 * Looks in images/ subdirectory relative to the MDX file
 *
 * @param mdxFilePath - Path to the MDX file
 * @param imageSrc - Image filename from MDX (e.g., "abileneTexas.jpg")
 * @returns Full path to image file
 */
export async function findImageFile(
  mdxFilePath: string,
  imageSrc: string
): Promise<string> {
  const mdxDir = path.dirname(mdxFilePath)

  // Try common image directory locations
  const possiblePaths = [
    path.join(mdxDir, 'images', imageSrc),
    path.join(mdxDir, imageSrc),
    path.join(mdxDir, '..', 'images', imageSrc),
  ]

  for (const imagePath of possiblePaths) {
    try {
      await fs.access(imagePath)
      return imagePath
    } catch {
      // File doesn't exist, try next path
    }
  }

  throw new Error(`Image file not found: ${imageSrc} (searched ${possiblePaths.length} locations)`)
}

/**
 * Get MIME type from filename extension
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()

  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
  }

  return mimeTypes[ext] || 'application/octet-stream'
}

/**
 * Sanitize filename to kebab-case while preserving extension
 *
 * Examples:
 *   "abileneTexas.jpg" → "abilene-texas.jpg"
 *   "Energy_Bill_Usage_kWh.jpg" → "energy-bill-usage-kwh.jpg"
 *   "Electricity Rates Switch Save.jpg" → "electricity-rates-switch-save.jpg"
 *
 * @param filename - Original filename
 * @returns Sanitized kebab-case filename
 */
function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename)
  let nameWithoutExt = path.basename(filename, ext)

  // Handle special cases that should stay together (before slugify)
  const specialCases: Record<string, string> = {
    'kWh': 'kwh',
    'KWh': 'kwh',
    'KWH': 'kwh',
  }

  // Replace special cases with placeholders
  Object.entries(specialCases).forEach(([pattern, replacement]) => {
    const regex = new RegExp(pattern, 'g')
    nameWithoutExt = nameWithoutExt.replace(regex, `__${replacement}__`)
  })

  // Use slugify to convert to kebab-case
  let sanitized = slugify(nameWithoutExt, {
    lowercase: true,
    decamelize: true, // Convert camelCase to kebab-case
    separator: '-',
  })

  // Restore special cases from placeholders
  Object.values(specialCases).forEach((replacement) => {
    sanitized = sanitized.replace(`__${replacement}__`, replacement)
  })

  return `${sanitized}${ext.toLowerCase()}`
}
