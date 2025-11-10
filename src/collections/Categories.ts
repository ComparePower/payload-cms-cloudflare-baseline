import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'Category',
    plural: 'Categories',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'parentCategory', 'categoryType', 'level', 'isActive', 'contentCount'],
    group: 'Taxonomy',
    description: 'Hierarchical content categories for primary organization',
  },
  access: {
    read: () => true,
  },
  fields: [
    // Core identification
    {
      name: 'title',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Category display name (e.g., "Moving to Texas")',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'URL-friendly identifier (auto-generated from title)',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.title) {
              return data.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
            }
            return value
          },
        ],
      },
    },

    // Hierarchy
    {
      name: 'parentCategory',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        description: 'Parent category for hierarchical organization (optional)',
      },
    },
    {
      name: 'level',
      type: 'select',
      options: [
        { label: 'Level 1 - Top Level', value: '1' },
        { label: 'Level 2 - Sub Category', value: '2' },
        { label: 'Level 3 - Tertiary', value: '3' },
      ],
      defaultValue: '1',
      admin: {
        description: 'Hierarchical level (auto-calculated based on parent)',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Sort order within parent (0 = first)',
      },
    },

    // Classification
    {
      name: 'categoryType',
      type: 'select',
      options: [
        { label: 'Persona - User Journey Stage', value: 'persona' },
        { label: 'Content Type', value: 'content-type' },
        { label: 'Geographic', value: 'geographic' },
        { label: 'Service Type', value: 'service-type' },
        { label: 'Business', value: 'business' },
        { label: 'Educational', value: 'educational' },
        { label: 'Internal/Tech', value: 'internal' },
      ],
      required: true,
      index: true,
      admin: {
        description: 'Category type for filtering and organization',
      },
    },

    // Multilingual content - English
    {
      name: 'nameEn',
      type: 'text',
      required: true,
      admin: {
        description: 'English display name',
      },
    },
    {
      name: 'descriptionEn',
      type: 'textarea',
      required: true,
      admin: {
        description: 'English description',
      },
    },
    {
      name: 'contentEn',
      type: 'richText',
      admin: {
        description: 'English long-form content for category landing pages',
      },
    },

    // Multilingual content - Spanish
    {
      name: 'nameEs',
      type: 'text',
      admin: {
        description: 'Spanish display name (optional)',
      },
    },
    {
      name: 'descriptionEs',
      type: 'textarea',
      admin: {
        description: 'Spanish description (optional)',
      },
    },
    {
      name: 'contentEs',
      type: 'richText',
      admin: {
        description: 'Spanish long-form content (optional)',
      },
    },

    // SEO
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
          admin: {
            description: 'SEO title (defaults to category title)',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          maxLength: 160,
          admin: {
            description: 'Meta description (max 160 characters)',
          },
        },
        {
          name: 'keywords',
          type: 'text',
          admin: {
            description: 'Target keywords (comma-separated)',
          },
        },
      ],
    },

    // Display properties
    {
      name: 'icon',
      type: 'text',
      admin: {
        description: 'Icon identifier (e.g., heroicon name)',
      },
    },
    {
      name: 'color',
      type: 'text',
      admin: {
        description: 'Hex color for visual identification (#f97316)',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Featured image for category pages',
      },
    },

    // Status and governance
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      admin: {
        description: 'Active categories appear in filters and navigation',
      },
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Featured categories appear prominently in UI',
      },
    },
    {
      name: 'contentCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of content items using this category (auto-calculated)',
        readOnly: true,
      },
    },

    // Relationships
    {
      name: 'relatedTags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      admin: {
        description: 'Related tags commonly used with this category',
      },
    },
  ],
}
