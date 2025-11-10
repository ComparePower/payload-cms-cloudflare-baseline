import type { CollectionConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'

export const ElectricityRates: CollectionConfig = {
  slug: 'electricity-rates',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'cityName', 'status', 'publishedAt'],
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrPublishedStatus,
    update: adminOnly,
  },
  // Enable soft-delete trash feature
  trash: true,
  versions: {
    drafts: true,
  },
  fields: [
    // Basic Info
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Page title (e.g., "Abilene Electricity Rates")',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'URL slug (e.g., "texas/abilene-electricity-rates-energy-plans")',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },

    // City Information
    {
      name: 'cityName',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'City name (e.g., "Abilene")',
      },
    },
    {
      name: 'cityRef',
      type: 'text',
      admin: {
        description: 'Reference to city content (e.g., "cities/abilene")',
      },
    },

    // WordPress Migration Fields
    {
      name: 'wordpressSlug',
      type: 'text',
      admin: {
        description: 'Original WordPress slug',
      },
    },
    {
      name: 'wpPostId',
      type: 'number',
      admin: {
        description: 'Original WordPress post ID',
      },
    },
    {
      name: 'wpAuthor',
      type: 'text',
      admin: {
        description: 'Original WordPress author',
      },
    },

    // Dates
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'updatedDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },

    // SEO Group
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
          admin: {
            description: 'SEO page title (meta title)',
          },
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          admin: {
            description: 'SEO meta description',
          },
        },
      ],
    },

    // Hero Group
    {
      name: 'hero',
      type: 'group',
      fields: [
        {
          name: 'headingLine1',
          type: 'text',
          admin: {
            description: 'Hero heading line 1',
          },
        },
        {
          name: 'headingLine2',
          type: 'textarea',
          admin: {
            description: 'Hero heading line 2',
          },
        },
        {
          name: 'ctaText',
          type: 'text',
          admin: {
            description: 'Call to action text',
          },
        },
      ],
    },

    // Target Keyword
    {
      name: 'targetKeyword',
      type: 'text',
      admin: {
        description: 'SEO target keyword',
      },
    },

    // Content Blocks (Lexical Rich Text)
    {
      name: 'contentBlocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'richText',
          fields: [
            {
              name: 'content',
              type: 'richText',
              required: true,
            },
          ],
        },
        {
          slug: 'assetManager',
          fields: [
            {
              name: 'assetId',
              type: 'text',
              required: true,
              admin: {
                description: 'Asset Manager ID',
              },
            },
            {
              name: 'alt',
              type: 'text',
              admin: {
                description: 'Image alt text',
              },
            },
            {
              name: 'caption',
              type: 'text',
              admin: {
                description: 'Image caption',
              },
            },
          ],
        },
        {
          slug: 'ratesTable',
          fields: [
            {
              name: 'state',
              type: 'text',
              required: true,
            },
            {
              name: 'city',
              type: 'text',
              required: true,
            },
            {
              name: 'showUtility',
              type: 'text',
            },
            {
              name: 'showProvider',
              type: 'text',
            },
            {
              name: 'provider',
              type: 'text',
            },
            {
              name: 'utility',
              type: 'text',
            },
            {
              name: 'excludeProviders',
              type: 'text',
            },
            {
              name: 'linkPlanToPopup',
              type: 'text',
            },
            {
              name: 'textRrTable',
              type: 'text',
            },
            {
              name: 'appendTableExtras',
              type: 'text',
            },
            {
              name: 'pricingBasedOn',
              type: 'text',
            },
          ],
        },
        {
          slug: 'section',
          fields: [
            {
              name: 'sectionId',
              type: 'text',
              admin: {
                description: 'Section ID for anchoring',
              },
            },
            {
              name: 'content',
              type: 'richText',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
