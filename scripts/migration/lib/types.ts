/**
 * Type definitions for content migration scripts
 */

/**
 * Component prop information
 */
export interface ComponentProp {
  /** Prop name */
  name: string
  /** Prop value (stringified) */
  value: string | null
  /** Inferred prop type */
  type: 'string' | 'boolean' | 'number' | 'object' | 'array' | 'expression' | 'unknown'
}

/**
 * Component usage information
 */
export interface ComponentUsage {
  /** Component name (e.g., 'Admonition', 'FaqComponent') */
  component: string
  /** Props found on this component instance */
  props: ComponentProp[]
  /** Line number where component appears (1-indexed) */
  lineNumber: number
  /** Whether this component has children */
  hasChildren: boolean
}

/**
 * Parsed MDX file result
 */
export interface ParsedMdxFile {
  /** File path */
  filePath: string
  /** Components found in this file */
  components: ComponentUsage[]
  /** Total component count */
  componentCount: number
  /** Unique component names */
  uniqueComponents: string[]
  /** Parse errors if any */
  errors: string[]
}

/**
 * Represents a discovered MDX file with metadata
 */
export interface MdxFileInfo {
  /** Absolute path to the .mdx file */
  filePath: string
  /** Relative path from the data directory */
  relativePath: string
  /** Collection name (e.g., 'advisor', 'team', 'faqs') */
  collection: string
  /** Locale code (e.g., 'en', 'es') or null if no locale */
  locale: string | null
  /** File name without extension */
  fileName: string
  /** File name with extension */
  fullFileName: string
}

/**
 * Scanner statistics
 */
export interface ScanStats {
  /** Total files scanned */
  totalFiles: number
  /** Total directories scanned */
  totalDirectories: number
  /** Execution time in milliseconds */
  executionTimeMs: number
  /** Collections found */
  collections: string[]
  /** Locales found */
  locales: string[]
}

/**
 * Scanner output format
 */
export interface ScanResult {
  /** Array of discovered MDX files */
  files: MdxFileInfo[]
  /** Scan statistics */
  stats: ScanStats
  /** Timestamp when scan was performed */
  scannedAt: string
}
