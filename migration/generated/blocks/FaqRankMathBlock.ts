import { Block } from 'payload/types'

/**
 * FaqRankMath Block
 *
 * Generated from component analysis on 2025-10-23T14:06:30.357Z
 * Source: Component from Astro project
 */

export const FaqRankMathBlock: Block = {
  slug: 'faqRankMath',
  interfaceName: 'FaqRankMathBlockType',
  fields: [
    {
      name: 'questions',
      type: 'text',
      required: true,
      admin: {
        description: 'Required prop (type: FaqItem[];)',
      },
    },
    {
      name: 'titleWrapper',
      type: 'text',
      admin: {
        description: 'Optional prop (type: \'h2\' | \'h3\' | \'h4\' | \'h5\' | \'h6\' | \'p\';)',
      },
    },
    {
      name: 'className',
      type: 'text',
      admin: {
        description: 'Optional prop (type: string;)',
      },
    }
  ]
}
