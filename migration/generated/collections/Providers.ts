import { CollectionConfig } from 'payload/types'

/**
 * Providers Collection
 *
 * Generated from frontmatter analysis on 2025-10-23T14:06:30.353Z
 * Total files analyzed: 157
 * Total fields: 17
 */

export const Providers: CollectionConfig = {
  slug: 'providers',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'draft', 'updatedAt'],
    description: 'Provider hub pages with hierarchical structure'
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'URL-friendly identifier (auto-generated from title)',
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'providers',
      admin: {
        description: 'Parent entry for hierarchical structure',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Found in 157/157 files',
      },
    },
    {
      name: 'wp_post_id',
      type: 'number',
      admin: {
        description: 'Found in 156/157 files',
      },
    },
    {
      name: 'seo_meta_desc',
      type: 'textarea',
      admin: {
        description: 'Found in 154/157 files',
      },
    },
    {
      name: 'draft',
      type: 'checkbox',
      required: true,
      admin: {
        description: 'Found in 157/157 files',
      },
    },
    {
      name: 'pubDate',
      type: 'date | string',
      required: true,
      admin: {
        description: 'Found in 157/157 files',
      },
    },
    {
      name: 'updatedDate',
      type: 'date',
      admin: {
        description: 'Found in 156/157 files',
      },
    },
    {
      name: 'wp_author',
      type: 'text',
      admin: {
        description: 'Found in 156/157 files',
      },
    },
    {
      name: 'cp_hero_heading_line_1',
      type: 'text',
      admin: {
        description: 'Found in 156/157 files',
      },
    },
    {
      name: 'cp_hero_heading_line_2',
      type: 'text',
      admin: {
        description: 'Found in 155/157 files',
      },
    },
    {
      name: 'cp_hero_cta_text',
      type: 'text',
      admin: {
        description: 'Found in 155/157 files',
      },
    },
    {
      name: 'seo_title',
      type: 'text',
      admin: {
        description: 'Found in 129/157 files',
      },
    },
    {
      name: 'target_keyword',
      type: 'text',
      admin: {
        description: 'Found in 93/157 files',
      },
    },
    {
      name: 'post_author_team_member_is',
      type: 'array',
      relationTo: 'team',
      hasMany: true,
      fields: [
        {
          name: 'item',
          type: 'text',
        }
      ],
      admin: {
        description: 'Found in 1/157 files',
      },
    },
    {
      name: 'post_editor_team_member_is',
      type: 'array',
      relationTo: 'team',
      hasMany: true,
      fields: [
        {
          name: 'item',
          type: 'text',
        }
      ],
      admin: {
        description: 'Found in 1/157 files',
      },
    },
    {
      name: 'post_checker_team_member_is',
      type: 'array',
      relationTo: 'team',
      hasMany: true,
      fields: [
        {
          name: 'item',
          type: 'text',
        }
      ],
      admin: {
        description: 'Found in 1/157 files',
      },
    },
    {
      name: 'description',
      type: 'text',
      admin: {
        description: 'Found in 1/157 files',
      },
    },
    {
      name: 'contentBlocks',
      type: 'blocks',
      blocks: [
        /* Import all generated blocks */,
      ],
      admin: {
        description: 'Rich content blocks (MDX converted to Lexical)',
      },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Featured/hero image',
      },
    }
  ],
  hooks: {
    beforeValidate: [
      // Auto-generate slug from title if not provided
      ({ data }) => {
        if (!data.slug && data.title) {
          data.slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
        }
        return data
      }
    ]
  }
}
