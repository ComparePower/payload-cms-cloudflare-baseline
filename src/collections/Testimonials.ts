import type { CollectionConfig } from 'payload'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'customerName',
    defaultColumns: ['customerName', 'category', 'featured', 'rating', 'date'],
    group: 'Content',
  },
  access: {
    read: () => true,
  },
  fields: [
    // Core Fields
    {
      name: 'testimonialId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Unique testimonial ID (e.g., "savings-001")',
      },
    },
    {
      name: 'customerName',
      type: 'text',
      required: true,
      admin: {
        description: 'Customer name (e.g., "Sarah Martinez")',
      },
    },
    {
      name: 'location',
      type: 'text',
      required: true,
      admin: {
        description: 'Customer location (e.g., "Houston, TX")',
      },
    },
    {
      name: 'testimonialText',
      type: 'textarea',
      required: true,
      admin: {
        description: 'The testimonial quote',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
        description: 'Date the testimonial was given',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Savings', value: 'savings' },
        { label: 'Live Link Switcher', value: 'live-link-switcher' },
        { label: 'Brand Switcher', value: 'brand-switcher' },
        { label: 'Mover - Usage Estimator', value: 'mover-usage-estimator' },
        { label: 'Mover - Urgent', value: 'mover-urgent' },
        { label: 'No Deposit/Disconnect', value: 'no-deposit-disconnect' },
        { label: 'Service', value: 'service' },
        { label: 'Switching', value: 'switching' },
        { label: 'Smart Meter', value: 'smart-meter' },
      ],
      admin: {
        description: 'Testimonial category/type',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: {
        description: 'Featured testimonial (displayed prominently)',
      },
    },
    {
      name: 'rating',
      type: 'number',
      min: 1,
      max: 5,
      admin: {
        description: 'Star rating (1-5)',
      },
    },
    {
      name: 'avatarAssetId',
      type: 'text',
      admin: {
        description: 'Asset Manager ID for customer avatar (optional)',
      },
    },

    // Savings-Specific Fields
    {
      name: 'savingsData',
      type: 'group',
      admin: {
        condition: (data) =>
          data.category === 'savings' ||
          data.category === 'live-link-switcher' ||
          data.category === 'brand-switcher',
        description: 'Savings amount details (for savings-related testimonials)',
      },
      fields: [
        {
          name: 'savingsAmount',
          type: 'number',
          required: true,
          admin: {
            description: 'Monthly savings amount (in dollars)',
          },
        },
        {
          name: 'annualSavings',
          type: 'number',
          admin: {
            description: 'Annual savings amount (calculated or explicit)',
          },
        },
        {
          name: 'previousBillAmount',
          type: 'number',
          admin: {
            description: 'Previous monthly bill amount',
          },
        },
        {
          name: 'currentBillAmount',
          type: 'number',
          admin: {
            description: 'Current monthly bill amount',
          },
        },
      ],
    },

    // Live Link Specific Fields
    {
      name: 'liveLinkData',
      type: 'group',
      admin: {
        condition: (data) => data.category === 'live-link-switcher',
        description: 'Live Link technology details',
      },
      fields: [
        {
          name: 'predictionAccuracy',
          type: 'number',
          min: 0,
          max: 100,
          admin: {
            description: 'Prediction accuracy percentage (0-100)',
          },
        },
        {
          name: 'timeSaved',
          type: 'number',
          admin: {
            description: 'Time saved in switching process (minutes)',
          },
        },
      ],
    },

    // Brand Switcher Specific Fields
    {
      name: 'brandSwitcherData',
      type: 'group',
      admin: {
        condition: (data) => data.category === 'brand-switcher',
        description: 'Brand switching details',
      },
      fields: [
        {
          name: 'previousProvider',
          type: 'text',
          required: true,
          admin: {
            description: 'Previous electricity provider (e.g., "TXU Energy")',
          },
        },
        {
          name: 'newProvider',
          type: 'text',
          admin: {
            description: 'New electricity provider',
          },
        },
        {
          name: 'yearsWithPreviousProvider',
          type: 'number',
          admin: {
            description: 'Years with previous provider',
          },
        },
      ],
    },

    // Mover Usage Estimator Specific Fields
    {
      name: 'moverEstimatorData',
      type: 'group',
      admin: {
        condition: (data) => data.category === 'mover-usage-estimator',
        description: 'Mover usage estimator details',
      },
      fields: [
        {
          name: 'movedTo',
          type: 'text',
          required: true,
          admin: {
            description: 'City/ZIP moved to',
          },
        },
        {
          name: 'movedFrom',
          type: 'text',
          admin: {
            description: 'City/ZIP moved from',
          },
        },
        {
          name: 'estimatorAccuracy',
          type: 'number',
          min: 0,
          max: 100,
          admin: {
            description: 'Estimator accuracy percentage (0-100)',
          },
        },
        {
          name: 'helpedChooseRightPlan',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Whether estimator helped choose right plan',
          },
        },
        {
          name: 'estimatedBillAmount',
          type: 'number',
          admin: {
            description: 'Estimated monthly bill amount',
          },
        },
      ],
    },

    // Mover Urgent Specific Fields
    {
      name: 'moverUrgentData',
      type: 'group',
      admin: {
        condition: (data) => data.category === 'mover-urgent',
        description: 'Urgent mover service details',
      },
      fields: [
        {
          name: 'activationTime',
          type: 'text',
          required: true,
          admin: {
            description: 'How quickly service was activated (e.g., "5 hours", "1 day")',
          },
        },
        {
          name: 'sameDayService',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Whether same-day service was provided',
          },
        },
        {
          name: 'moveInDate',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayOnly',
            },
            description: 'Move-in date',
          },
        },
        {
          name: 'serviceStartDate',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayOnly',
            },
            description: 'Service start date',
          },
        },
      ],
    },

    // No Deposit/Disconnect Specific Fields
    {
      name: 'noDepositData',
      type: 'group',
      admin: {
        condition: (data) => data.category === 'no-deposit-disconnect',
        description: 'No deposit/disconnect service details',
      },
      fields: [
        {
          name: 'benefitType',
          type: 'select',
          required: true,
          options: [
            { label: 'No Deposit', value: 'no-deposit' },
            { label: 'No Disconnect', value: 'no-disconnect' },
            { label: 'Both', value: 'both' },
          ],
          admin: {
            description: 'Type of benefit received',
          },
        },
        {
          name: 'depositSaved',
          type: 'number',
          admin: {
            description: 'Amount saved on deposit (in dollars)',
          },
        },
        {
          name: 'hadCreditConcerns',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Whether customer had credit concerns',
          },
        },
        {
          name: 'facingDisconnection',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Whether customer was facing disconnection',
          },
        },
      ],
    },

    // Metadata
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'published',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: {
        description: 'Publication status',
      },
    },
  ],
}
