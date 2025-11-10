/**
 * Import Testimonials to Payload CMS
 *
 * This script imports testimonial data from JSON files into Payload CMS
 * using Payload 3 Local API (NOT direct database access).
 *
 * Usage:
 *   npx tsx src/scripts/import-testimonials.ts
 *
 * Requirements:
 *   - Payload dev server must NOT be running (Local API needs exclusive DB access)
 *   - Database must be accessible via environment variables
 */

import { getPayload } from 'payload'
import config from '../payload.config'
import * as fs from 'fs'
import * as path from 'path'

// Import JSON data files
import savingsData from './data/savings.json'
import liveLinkSwitcherData from './data/live-link-switcher.json'
import brandSwitcherData from './data/brand-switcher.json'
import moverUsageEstimatorData from './data/mover-usage-estimator.json'
import moverUrgentData from './data/mover-urgent.json'
import noDepositDisconnectData from './data/no-deposit-disconnect.json'

interface BaseTestimonial {
  id: string
  customerName: string
  location: string
  testimonialText: string
  date: string
  category: string
  featured?: boolean
  rating?: number
  avatarAssetId?: string
}

interface SavingsTestimonial extends BaseTestimonial {
  category: 'savings'
  savingsAmount: number
  annualSavings?: number
  previousBillAmount?: number
  currentBillAmount?: number
}

interface LiveLinkSwitcherTestimonial extends BaseTestimonial {
  category: 'live-link-switcher'
  savingsAmount: number
  annualSavings?: number
  predictionAccuracy?: number
  timeSaved?: number
}

interface BrandSwitcherTestimonial extends BaseTestimonial {
  category: 'brand-switcher'
  previousProvider: string
  newProvider?: string
  savingsAmount: number
  annualSavings?: number
  yearsWithPreviousProvider?: number
}

interface MoverUsageEstimatorTestimonial extends BaseTestimonial {
  category: 'mover-usage-estimator'
  movedTo: string
  movedFrom?: string
  estimatorAccuracy?: number
  helpedChooseRightPlan?: boolean
  estimatedBillAmount?: number
}

interface MoverUrgentTestimonial extends BaseTestimonial {
  category: 'mover-urgent'
  activationTime: string
  sameDayService?: boolean
  moveInDate?: string
  serviceStartDate?: string
}

interface NoDepositDisconnectTestimonial extends BaseTestimonial {
  category: 'no-deposit-disconnect'
  benefitType: 'no-deposit' | 'no-disconnect' | 'both'
  depositSaved?: number
  hadCreditConcerns?: boolean
  facingDisconnection?: boolean
}

type Testimonial =
  | SavingsTestimonial
  | LiveLinkSwitcherTestimonial
  | BrandSwitcherTestimonial
  | MoverUsageEstimatorTestimonial
  | MoverUrgentTestimonial
  | NoDepositDisconnectTestimonial

/**
 * Transform JSON testimonial data to Payload collection format
 */
function transformToPayloadFormat(testimonial: Testimonial): any {
  const base = {
    testimonialId: testimonial.id,
    customerName: testimonial.customerName,
    location: testimonial.location,
    testimonialText: testimonial.testimonialText,
    date: testimonial.date,
    category: testimonial.category,
    featured: testimonial.featured || false,
    rating: testimonial.rating,
    avatarAssetId: testimonial.avatarAssetId,
    status: 'published',
  }

  // Add category-specific data based on testimonial type
  switch (testimonial.category) {
    case 'savings':
      return {
        ...base,
        savingsData: {
          savingsAmount: testimonial.savingsAmount,
          annualSavings: testimonial.annualSavings,
          previousBillAmount: testimonial.previousBillAmount,
          currentBillAmount: testimonial.currentBillAmount,
        },
      }

    case 'live-link-switcher':
      return {
        ...base,
        savingsData: {
          savingsAmount: testimonial.savingsAmount,
          annualSavings: testimonial.annualSavings,
        },
        liveLinkData: {
          predictionAccuracy: testimonial.predictionAccuracy,
          timeSaved: testimonial.timeSaved,
        },
      }

    case 'brand-switcher':
      return {
        ...base,
        savingsData: {
          savingsAmount: testimonial.savingsAmount,
          annualSavings: testimonial.annualSavings,
        },
        brandSwitcherData: {
          previousProvider: testimonial.previousProvider,
          newProvider: testimonial.newProvider,
          yearsWithPreviousProvider: testimonial.yearsWithPreviousProvider,
        },
      }

    case 'mover-usage-estimator':
      return {
        ...base,
        moverEstimatorData: {
          movedTo: testimonial.movedTo,
          movedFrom: testimonial.movedFrom,
          estimatorAccuracy: testimonial.estimatorAccuracy,
          helpedChooseRightPlan: testimonial.helpedChooseRightPlan,
          estimatedBillAmount: testimonial.estimatedBillAmount,
        },
      }

    case 'mover-urgent':
      return {
        ...base,
        moverUrgentData: {
          activationTime: testimonial.activationTime,
          sameDayService: testimonial.sameDayService,
          moveInDate: testimonial.moveInDate,
          serviceStartDate: testimonial.serviceStartDate,
        },
      }

    case 'no-deposit-disconnect':
      return {
        ...base,
        noDepositData: {
          benefitType: testimonial.benefitType,
          depositSaved: testimonial.depositSaved,
          hadCreditConcerns: testimonial.hadCreditConcerns,
          facingDisconnection: testimonial.facingDisconnection,
        },
      }

    default:
      return base
  }
}

/**
 * Main import function
 */
async function importTestimonials() {
  console.log('🚀 Starting testimonial import...\n')

  try {
    // Initialize Payload Local API
    console.log('📦 Initializing Payload Local API...')
    const payload = await getPayload({ config })
    console.log('✅ Payload initialized\n')

    // Collect all testimonials from JSON files
    const allTestimonials: Testimonial[] = [
      ...savingsData.testimonials,
      ...liveLinkSwitcherData.testimonials,
      ...brandSwitcherData.testimonials,
      ...moverUsageEstimatorData.testimonials,
      ...moverUrgentData.testimonials,
      ...noDepositDisconnectData.testimonials,
    ]

    console.log(`📊 Found ${allTestimonials.length} testimonials to import\n`)

    let successCount = 0
    let errorCount = 0

    // Import each testimonial using Payload Local API
    for (const testimonial of allTestimonials) {
      try {
        const payloadData = transformToPayloadFormat(testimonial)

        console.log(`  Importing: ${testimonial.id} (${testimonial.category})...`)

        await payload.create({
          collection: 'testimonials',
          data: payloadData,
        })

        successCount++
        console.log(`  ✅ Success: ${testimonial.customerName}`)
      } catch (error) {
        errorCount++
        console.error(`  ❌ Error importing ${testimonial.id}:`, error)
      }
    }

    console.log('\n📈 Import Summary:')
    console.log(`  ✅ Successful: ${successCount}`)
    console.log(`  ❌ Failed: ${errorCount}`)
    console.log(`  📊 Total: ${allTestimonials.length}\n`)

    console.log('🎉 Import complete!')
  } catch (error) {
    console.error('❌ Fatal error during import:', error)
    process.exit(1)
  }
}

// Run the import
importTestimonials()
