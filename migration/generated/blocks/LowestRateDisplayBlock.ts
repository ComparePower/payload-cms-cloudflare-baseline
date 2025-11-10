import { Block } from 'payload/types'

/**
 * LowestRateDisplay Block
 *
 * Generated from component analysis on 2025-10-23T14:06:30.358Z
 * Source: Component from Astro project
 */

export const LowestRateDisplayBlock: Block = {
  slug: 'lowestRateDisplay',
  interfaceName: 'LowestRateDisplayBlockType',
  fields: [
    {
      name: 'utilityId',
      type: 'text',
      required: true,
      admin: {
        description: 'Required prop (type: string;)',
      },
    },
    {
      name: 'pricingBasedOn',
      type: 'text',
      admin: {
        description: 'Optional prop (type: string;)',
      },
    },
    {
      name: 'priceUnit',
      type: 'text',
      admin: {
        description: 'Optional prop (type: string;)',
      },
    },
    {
      name: 'withoutCta',
      type: 'text',
      admin: {
        description: 'Optional prop (type: string;)',
      },
    },
    {
      name: 'onlyPrice',
      type: 'text',
      admin: {
        description: 'Optional prop (type: string;)',
      },
    }
  ]
}
