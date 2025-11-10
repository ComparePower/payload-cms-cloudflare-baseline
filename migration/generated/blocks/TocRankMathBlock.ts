import { Block } from 'payload/types'

/**
 * TocRankMath Block
 *
 * Generated from component analysis on 2025-10-23T14:06:30.359Z
 * Source: Component from Astro project
 */

export const TocRankMathBlock: Block = {
  slug: 'tocRankMath',
  interfaceName: 'TocRankMathBlockType',
  fields: [
    {
      name: 'headings',
      type: 'text',
      admin: {
        description: 'Optional prop (type: TocHeading[];)',
      },
    },
    {
      name: 'listStyle',
      type: 'text',
      admin: {
        description: 'Optional prop (type: "ul" | "ol" | "div";)',
      },
    },
    {
      name: 'titleWrapper',
      type: 'text',
      admin: {
        description: 'Optional prop (type: "h2" | "h3" | "h4" | "h5" | "h6" | "p";)',
      },
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Optional prop (type: string;)',
      },
    },
    {
      name: 'className',
      type: 'text',
      admin: {
        description: 'Optional prop (type: string;)',
      },
    },
    {
      name: 'excludeHeadings',
      type: 'text',
      admin: {
        description: 'Optional prop (type: string[];)',
      },
    }
  ]
}
