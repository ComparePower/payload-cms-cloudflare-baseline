/**
 * Unit tests for MDX File Scanner
 */

import { describe, it, expect } from 'vitest'
import { extractMetadata, calculateStats } from '../../../scripts/migration/scan-mdx-files'
import type { MdxFileInfo } from '../../../scripts/migration/lib/types'

describe('MDX File Scanner - extractMetadata', () => {
  it('should extract collection and locale from path with locale', () => {
    const result = extractMetadata('advisor/en/post-name/index.mdx')
    expect(result).toEqual({
      collection: 'advisor',
      locale: 'en',
    })
  })

  it('should extract collection without locale from single-level path', () => {
    const result = extractMetadata('team/john-doe.mdx')
    expect(result).toEqual({
      collection: 'team',
      locale: null,
    })
  })

  it('should handle Spanish locale', () => {
    const result = extractMetadata('advisor/es/articulo/index.mdx')
    expect(result).toEqual({
      collection: 'advisor',
      locale: 'es',
    })
  })

  it('should return unknown for empty path', () => {
    const result = extractMetadata('')
    expect(result).toEqual({
      collection: 'unknown',
      locale: null,
    })
  })

  it('should not treat non-locale directories as locale', () => {
    const result = extractMetadata('team/subfolder/file.mdx')
    expect(result).toEqual({
      collection: 'team',
      locale: null,
    })
  })
})

describe('MDX File Scanner - calculateStats', () => {
  it('should calculate correct statistics', () => {
    const mockFiles: MdxFileInfo[] = [
      {
        filePath: '/path/to/advisor/en/post1/index.mdx',
        relativePath: 'advisor/en/post1/index.mdx',
        collection: 'advisor',
        locale: 'en',
        fileName: 'index',
        fullFileName: 'index.mdx',
      },
      {
        filePath: '/path/to/advisor/es/post2/index.mdx',
        relativePath: 'advisor/es/post2/index.mdx',
        collection: 'advisor',
        locale: 'es',
        fileName: 'index',
        fullFileName: 'index.mdx',
      },
      {
        filePath: '/path/to/team/john.mdx',
        relativePath: 'team/john.mdx',
        collection: 'team',
        locale: null,
        fileName: 'john',
        fullFileName: 'john.mdx',
      },
    ]

    const stats = calculateStats(mockFiles, 100)

    expect(stats.totalFiles).toBe(3)
    expect(stats.totalDirectories).toBe(3)
    expect(stats.executionTimeMs).toBe(100)
    expect(stats.collections).toEqual(['advisor', 'team'])
    expect(stats.locales).toEqual(['en', 'es'])
  })

  it('should handle empty file list', () => {
    const stats = calculateStats([], 50)

    expect(stats.totalFiles).toBe(0)
    expect(stats.totalDirectories).toBe(0)
    expect(stats.executionTimeMs).toBe(50)
    expect(stats.collections).toEqual([])
    expect(stats.locales).toEqual([])
  })

  it('should deduplicate collections and locales', () => {
    const mockFiles: MdxFileInfo[] = [
      {
        filePath: '/path/to/advisor/en/post1/index.mdx',
        relativePath: 'advisor/en/post1/index.mdx',
        collection: 'advisor',
        locale: 'en',
        fileName: 'index',
        fullFileName: 'index.mdx',
      },
      {
        filePath: '/path/to/advisor/en/post2/index.mdx',
        relativePath: 'advisor/en/post2/index.mdx',
        collection: 'advisor',
        locale: 'en',
        fileName: 'index',
        fullFileName: 'index.mdx',
      },
    ]

    const stats = calculateStats(mockFiles, 100)

    expect(stats.collections).toEqual(['advisor'])
    expect(stats.locales).toEqual(['en'])
  })
})
