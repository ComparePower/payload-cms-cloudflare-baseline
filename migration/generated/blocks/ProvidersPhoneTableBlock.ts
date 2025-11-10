import { Block } from 'payload/types'

/**
 * ProvidersPhoneTable Block
 *
 * Generated from component analysis on 2025-10-23T14:06:30.358Z
 * Source: Component from Astro project
 */

export const ProvidersPhoneTableBlock: Block = {
  slug: 'providersPhoneTable',
  interfaceName: 'ProvidersPhoneTableBlockType',
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
    }
  ]
}
