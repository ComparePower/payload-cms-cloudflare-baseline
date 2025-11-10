import { Block } from 'payload/types'

/**
 * PopularZipcodes Block
 *
 * Generated from component analysis on 2025-10-23T14:06:30.358Z
 * Source: Component from Astro project
 */

export const PopularZipcodesBlock: Block = {
  slug: 'popularZipcodes',
  interfaceName: 'PopularZipcodesBlockType',
  fields: [
    {
      name: 'state',
      type: 'text',
      required: true,
      admin: {
        description: 'Required prop (type: string;)',
      },
    },
    {
      name: 'city',
      type: 'text',
      admin: {
        description: 'Optional prop (type: string;)',
      },
    },
    {
      name: 'limit',
      type: 'text',
      admin: {
        description: 'Optional prop (type: string;)',
      },
    },
    {
      name: 'minimumPopulation',
      type: 'text',
      admin: {
        description: 'Optional prop (type: string;)',
      },
    }
  ]
}
