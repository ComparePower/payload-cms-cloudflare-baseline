import { Block } from 'payload/types'

/**
 * ProviderCard Block
 *
 * Generated from component analysis on 2025-10-23T14:06:30.358Z
 * Source: Component from Astro project
 */

export const ProviderCardBlock: Block = {
  slug: 'providerCard',
  interfaceName: 'ProviderCardBlockType',
  fields: [
    {
      name: 'providerSlug',
      type: 'text',
      required: true,
      admin: {
        description: 'Required prop (type: string;)',
      },
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      admin: {
        description: 'Required prop (type: string;)',
      },
    },
    {
      name: 'description',
      type: 'text',
      required: true,
      admin: {
        description: 'Required prop (type: string;)',
      },
    },
    {
      name: 'ctaText',
      type: 'text',
      admin: {
        description: 'Optional prop (type: string;)',
      },
    }
  ]
}
