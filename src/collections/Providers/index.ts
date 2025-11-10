import type { CollectionConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'

/**
 * Providers Collection
 *
 * NOTE: contentBlocks field will be added in Phase 2 after Lexical blocks are ported.
 * For now, using basic richText field for content.
 */
export const Providers: CollectionConfig = {
  slug: 'providers',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrPublishedStatus,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['title', 'publishedAt', 'status'],
    useAsTitle: 'title',
    livePreview: {
      url: ({ data }) => {
        const previewUrl = process.env.ASTRO_PREVIEW_URL || 'http://localhost:4321'
        return `${previewUrl}/preview/providers/${data.slug}`
      },
    },
  },
  // Enable soft-delete trash feature
  // Creates a deletedAt field and /admin/collections/providers/trash view
  trash: true,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Provider title',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      // NOTE: Removed 'unique: true' to fix autosave issue
      // See: https://github.com/payloadcms/payload/issues/953
      // Unique constraint blocks autosave from creating draft versions
      // Index still provides query performance for slug lookups
      admin: {
        description: 'SEO-friendly slug - Never change once published!',
      },
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: {
        description: 'Post status',
      },
    },
    {
      name: 'wordpressSlug',
      type: 'text',
      admin: {
        description: 'Original WordPress slug',
      },
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
          admin: {
            description: 'Custom SEO title',
          },
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          maxLength: 160,
          admin: {
            description: 'SEO meta description',
          },
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Publish date',
      },
    },
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
          type: 'text',
          admin: {
            description: 'Hero heading line 2',
          },
        },
        {
          name: 'ctaText',
          type: 'text',
          admin: {
            description: 'Hero CTA text',
          },
        },
      ],
    },
    {
      name: 'content',
      type: 'richText',
      required: false,
      admin: {
        description: 'Main content with rich formatting (contentBlocks will be added in Phase 2)',
      },
    },
    // NOTE: contentBlocks field will be added in Phase 2 after Lexical blocks infrastructure is complete
    // See CLAUDE.md Implementation Roadmap Phase 2
    {
      name: 'wpPostId',
      type: 'number',
      admin: {
        description: 'WordPress post ID',
      },
    },
    {
      name: 'updatedDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Last updated date',
      },
    },
    {
      name: 'targetKeyword',
      type: 'text',
      admin: {
        description: 'SEO target keyword',
      },
    },
    {
      name: 'wpAuthor',
      type: 'text',
      admin: {
        description: 'WordPress author name',
      },
    },
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 375, // Auto-save every 375ms for responsive live preview
      },
    },
  },
}
