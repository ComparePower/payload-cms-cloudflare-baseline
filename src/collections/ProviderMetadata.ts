import type { CollectionConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'

/**
 * ProviderMetadata Collection
 *
 * Central registry/master data for all energy providers.
 * Synced from ComparePower Pricing API.
 *
 * Data source: https://pricing.api.comparepower.com/api/brands
 */
export const ProviderMetadata: CollectionConfig = {
  slug: 'providerMetadata',
  labels: {
    singular: 'Provider Metadata',
    plural: 'Provider Metadata',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true, // Public read
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['name', 'puct_number', 'status', 'updatedAt'],
    useAsTitle: 'name',
    description: 'Central registry for energy provider metadata from pricing API',
  },
  fields: [
    // Primary Identifier
    {
      name: 'cp_provider_id',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Provider ID from pricing API (_id field)',
        position: 'sidebar',
        readOnly: true,
      },
    },

    // Basic Info
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Provider display name',
      },
    },
    {
      name: 'legal_name',
      type: 'text',
      admin: {
        description: 'Official legal name',
      },
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
      admin: {
        description: 'URL-friendly slug (auto-generated)',
      },
    },
    {
      name: 'puct_number',
      type: 'text',
      index: true,
      admin: {
        description: 'Public Utility Commission of Texas registration number',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
      admin: {
        description: 'Provider status in our system',
      },
      index: true,
    },

    // Operation Hours
    {
      name: 'operation_hours',
      type: 'group',
      admin: {
        description: 'Customer service hours by day of week',
      },
      fields: [
        {
          name: 'monday',
          type: 'group',
          fields: [
            { name: 'start', type: 'number', admin: { description: 'Start hour (24h)' } },
            { name: 'start_min', type: 'number' },
            { name: 'end', type: 'number', admin: { description: 'End hour (24h)' } },
            { name: 'end_min', type: 'number' },
          ],
        },
        {
          name: 'tuesday',
          type: 'group',
          fields: [
            { name: 'start', type: 'number' },
            { name: 'start_min', type: 'number' },
            { name: 'end', type: 'number' },
            { name: 'end_min', type: 'number' },
          ],
        },
        {
          name: 'wednesday',
          type: 'group',
          fields: [
            { name: 'start', type: 'number' },
            { name: 'start_min', type: 'number' },
            { name: 'end', type: 'number' },
            { name: 'end_min', type: 'number' },
          ],
        },
        {
          name: 'thursday',
          type: 'group',
          fields: [
            { name: 'start', type: 'number' },
            { name: 'start_min', type: 'number' },
            { name: 'end', type: 'number' },
            { name: 'end_min', type: 'number' },
          ],
        },
        {
          name: 'friday',
          type: 'group',
          fields: [
            { name: 'start', type: 'number' },
            { name: 'start_min', type: 'number' },
            { name: 'end', type: 'number' },
            { name: 'end_min', type: 'number' },
          ],
        },
        {
          name: 'saturday',
          type: 'group',
          fields: [
            { name: 'start', type: 'number' },
            { name: 'start_min', type: 'number' },
            { name: 'end', type: 'number' },
            { name: 'end_min', type: 'number' },
          ],
        },
        {
          name: 'sunday',
          type: 'group',
          fields: [
            { name: 'start', type: 'number' },
            { name: 'start_min', type: 'number' },
            { name: 'end', type: 'number' },
            { name: 'end_min', type: 'number' },
          ],
        },
      ],
    },

    // Same Day Service
    {
      name: 'same_day_cutoff_time',
      type: 'group',
      admin: {
        description: 'Cutoff time for same-day service activation',
      },
      fields: [
        { name: 'hour', type: 'number', admin: { description: '24-hour format' } },
        { name: 'min', type: 'number' },
      ],
    },

    // Contact Info - Sales
    {
      name: 'contact_sales',
      type: 'group',
      label: 'Sales Contact',
      fields: [
        { name: 'phone_number', type: 'text' },
      ],
    },

    // Contact Info - Support
    {
      name: 'contact_support',
      type: 'group',
      label: 'Support Contact',
      fields: [
        { name: 'phone_number', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'address', type: 'textarea' },
        { name: 'url', type: 'text' },
      ],
    },

    // Contact Info - Brand
    {
      name: 'contact_brand',
      type: 'group',
      label: 'Brand Contact',
      fields: [
        { name: 'phone_number', type: 'text' },
      ],
    },

    // Contact Info - ComparePower
    {
      name: 'contact_comparepower',
      type: 'group',
      label: 'ComparePower Contact',
      fields: [
        { name: 'phone_number', type: 'text' },
      ],
    },

    // Contact Info - Rescission
    {
      name: 'contact_rescission',
      type: 'group',
      label: 'Rescission Contact',
      admin: {
        description: 'Contact info for contract cancellation',
      },
      fields: [
        { name: 'phone_number', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'address', type: 'textarea' },
        { name: 'fax', type: 'text' },
      ],
    },

    // Contact Info - Deposit Waiver
    {
      name: 'contact_deposit_waiver',
      type: 'group',
      label: 'Deposit Waiver Contact',
      fields: [
        { name: 'phone_number', type: 'text' },
      ],
    },

    // Configuration
    {
      name: 'configuration',
      type: 'group',
      admin: {
        description: 'API configuration and feature flags',
        condition: (data, siblingData) => false, // Hidden by default
      },
      fields: [
        { name: 'api_url', type: 'text' },
        { name: 'has_credit_check_method', type: 'checkbox' },
        { name: 'has_payment_method', type: 'checkbox' },
        { name: 'compare_usage_prices', type: 'checkbox' },
        { name: 'compare_document_links', type: 'checkbox' },
        { name: 'compare_components', type: 'checkbox' },
        { name: 'send_brand', type: 'checkbox' },
        { name: 'allow_current_address', type: 'checkbox' },
        { name: 'allow_drivers_license', type: 'checkbox' },
        { name: 'social_security_number_required', type: 'checkbox' },
        { name: 'saturday_not_allowed', type: 'checkbox' },
        { name: 'hide_phone_number', type: 'checkbox' },
        { name: 'hide_sign_up_button', type: 'checkbox' },
        { name: 'window', type: 'number', admin: { description: 'Service window in days' } },
      ],
    },

    // System Fields
    {
      name: 'api_last_synced',
      type: 'date',
      admin: {
        description: 'Last time data was synced from API',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes',
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        // Auto-generate slug from name
        if (data?.name && !data?.slug) {
          data.slug = data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
        }
        return data
      },
    ],
  },
}
