import { CollectionConfig } from 'payload/types'

/**
 * Team Collection
 *
 * Team members for author/editor/checker relationships
 * Generated on 2025-10-23T14:06:30.354Z
 */

export const Team: CollectionConfig = {
  slug: 'team',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'email'],
    description: 'Team members (authors, editors, checkers)'
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Full name'
      }
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'URL-friendly identifier'
      }
    },
    {
      name: 'email',
      type: 'email',
      admin: {
        description: 'Email address'
      }
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Author', value: 'author' },
        { label: 'Editor', value: 'editor' },
        { label: 'Checker', value: 'checker' },
        { label: 'Multiple Roles', value: 'multiple' }
      ],
      defaultValue: 'author',
      admin: {
        description: 'Primary role'
      }
    },
    {
      name: 'bio',
      type: 'richText',
      admin: {
        description: 'Biography (optional)'
      }
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Profile photo'
      }
    }
  ],
  hooks: {
    beforeValidate: [
      // Auto-generate slug from name if not provided
      ({ data }) => {
        if (!data.slug && data.name) {
          data.slug = data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
        }
        return data
      }
    ]
  }
}
