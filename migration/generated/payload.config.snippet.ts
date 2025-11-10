/**
 * Payload Config Integration Snippet
 *
 * Copy the imports and add to your payload.config.ts
 * Generated on 2025-10-23T14:06:30.359Z
 */

// ====================
// COLLECTION IMPORTS
// ====================

import { Providers } from './collections/Providers'
import { Team } from './collections/Team'
import { FAQs } from './collections/FAQs'

// ====================
// BLOCK IMPORTS
// ====================

import { FaqBlock } from './blocks/FaqBlock'
import { AdvisorPostsTabsBlock } from './blocks/AdvisorPostsTabsBlock'
import { AmigoPhoneNumberBlock } from './blocks/AmigoPhoneNumberBlock'
import { AvgTexasResidentialRateBlock } from './blocks/AvgTexasResidentialRateBlock'
import { CirroEnergyPhoneNumberBlock } from './blocks/CirroEnergyPhoneNumberBlock'
import { ComparepowerReviewCountBlock } from './blocks/ComparepowerReviewCountBlock'
import { ConstellationPhoneNumberBlock } from './blocks/ConstellationPhoneNumberBlock'
import { CurrentYearDirectBlock } from './blocks/CurrentYearDirectBlock'
import { DirectEnergyPhoneNumberBlock } from './blocks/DirectEnergyPhoneNumberBlock'
import { DiscountPowerPhoneNumberBlock } from './blocks/DiscountPowerPhoneNumberBlock'
import { FaqRankMathBlock } from './blocks/FaqRankMathBlock'
import { FlagshipPhoneNumberBlock } from './blocks/FlagshipPhoneNumberBlock'
import { FourChangePhoneNumberBlock } from './blocks/FourChangePhoneNumberBlock'
import { FrontierPhoneNumberBlock } from './blocks/FrontierPhoneNumberBlock'
import { FrontierPhoneNumberLinkRcBlock } from './blocks/FrontierPhoneNumberLinkRcBlock'
import { GexaPhoneNumberBlock } from './blocks/GexaPhoneNumberBlock'
import { GreenMountainPhoneNumberBlock } from './blocks/GreenMountainPhoneNumberBlock'
import { HelpMeChooseBlock } from './blocks/HelpMeChooseBlock'
import { JustPhoneNumberBlock } from './blocks/JustPhoneNumberBlock'
import { LowestRateDisplayBlock } from './blocks/LowestRateDisplayBlock'
import { NewPowerPhoneNumberBlock } from './blocks/NewPowerPhoneNumberBlock'
import { PaylessPowerPhoneNumberBlock } from './blocks/PaylessPowerPhoneNumberBlock'
import { PopularCitiesListBlock } from './blocks/PopularCitiesListBlock'
import { PopularZipcodesBlock } from './blocks/PopularZipcodesBlock'
import { ProviderCardBlock } from './blocks/ProviderCardBlock'
import { ProvidersPhoneTableBlock } from './blocks/ProvidersPhoneTableBlock'
import { PulsePowerPhoneNumberBlock } from './blocks/PulsePowerPhoneNumberBlock'
import { RatesTableBlock } from './blocks/RatesTableBlock'
import { ReliantPhoneNumberBlock } from './blocks/ReliantPhoneNumberBlock'
import { RhythmEnergyPhoneBlock } from './blocks/RhythmEnergyPhoneBlock'
import { TaraEnergyPhoneNumberBlock } from './blocks/TaraEnergyPhoneNumberBlock'
import { TocRankMathBlock } from './blocks/TocRankMathBlock'
import { TxuPhoneNumberBlock } from './blocks/TxuPhoneNumberBlock'
import { VcBasicGridBlock } from './blocks/VcBasicGridBlock'
import { ZipcodeSearchbarBlock } from './blocks/ZipcodeSearchbarBlock'

// ====================
// CONFIG
// ====================

export default buildConfig({
  // ... other config

  collections: [
    // Add these collections
    Providers,
    Team,
    FAQs,

    // ... your existing collections
  ],

  // Blocks are included in the Providers collection's contentBlocks field
  // No need to register them separately
})

// ====================
// NOTES
// ====================

/*
 * 1. Collections are ready to use
 * 2. Blocks are imported in Providers.ts contentBlocks field
 * 3. All fields have admin descriptions
 * 4. Relationships are properly configured
 * 5. Auto-slug generation hooks included
 */
