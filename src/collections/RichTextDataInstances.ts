import type { CollectionConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'

export const RichTextDataInstances: CollectionConfig = {
  slug: 'richTextDataInstances',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true, // Public read access
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['name', 'category', 'value'],
    useAsTitle: 'name',
    description: 'Reusable data values for inline blocks (phone numbers, etc.)',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name (e.g., "TXU Energy Phone")',
      },
      index: true,
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Phone Number', value: 'phone' },
        { label: 'Email', value: 'email' },
        { label: 'Address', value: 'address' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        description: 'Type of data being stored',
      },
      index: true,
    },
    {
      name: 'value',
      type: 'text',
      required: true,
      admin: {
        description: 'The actual value (phone number, email, etc.)',
      },
    },
    {
      name: 'userFacingDescription',
      type: 'text',
      admin: {
        description: 'User-friendly description for ARIA labels and tooltips (e.g., "TXU Energy Customer Service")',
      },
    },
    {
      name: 'slug',
      type: 'text',
      admin: {
        description: 'Unique identifier for programmatic lookup (e.g., "txu-phone")',
      },
      index: true,
      unique: true,
    },
    {
      name: 'provider',
      type: 'relationship',
      relationTo: 'providerMetadata',
      admin: {
        description: 'Associate this data with a specific provider (required for phone numbers)',
        condition: (data) => data?.category === 'phone',
      },
      index: true,
      // Conditionally required - only for phone numbers
      // Will be enforced via hook once ProviderMetadata is seeded
    },
    {
      name: 'componentName',
      type: 'text',
      admin: {
        description: 'Original MDX component name (e.g., "FourChangePhoneNumber")',
        position: 'sidebar',
      },
      index: true,
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional metadata (optional)',
      },
    },
  ],
}
