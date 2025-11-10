import { getPayload } from 'payload';
import configPromise from '../../src/payload.config.js';
import { promises as fs } from 'fs';
import path from 'path';

const ENTRY_ID = '68faa8f9a03b539ff6e41183';

async function main() {
  const payload = await getPayload({ config: await configPromise });

  console.log('📖 Fetching entry from database...');
  const entry = await payload.findByID({
    collection: 'providers',
    id: ENTRY_ID,
  });

  console.log('\n📊 Entry title:', entry.title);
  console.log('📦 Total blocks:', entry.contentBlocks?.length);

  // Find rich text blocks with links
  const richTextBlocks = entry.contentBlocks?.filter(b => b.blockType === 'richText') || [];
  console.log('📝 Rich text blocks:', richTextBlocks.length);

  if (richTextBlocks.length > 0) {
    const firstBlock = richTextBlocks[0];
    console.log('\n🔍 First rich text block:');
    const blockStr = JSON.stringify(firstBlock, null, 2);
    console.log(blockStr.substring(0, 2000));

    // Check for different patterns
    const hasLinkType = blockStr.includes('"type":"link"');
    const hasAutoLink = blockStr.includes('"type":"autolink"');
    const hasMarkdown = blockStr.includes('[') && blockStr.includes('](/');

    console.log('\n📊 Link analysis:');
    console.log('  - Has "type":"link":', hasLinkType);
    console.log('  - Has "type":"autolink":', hasAutoLink);
    console.log('  - Has markdown syntax [text](url):', hasMarkdown);

    // Save full entry to file
    const outputPath = path.join(process.cwd(), '.migration-cache/database-entry.json');
    await fs.writeFile(outputPath, JSON.stringify(entry, null, 2));
    console.log('\n💾 Full entry saved to:', outputPath);
  }

  process.exit(0);
}

main();
