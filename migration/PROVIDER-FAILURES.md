# Provider Migration Failures

Generated: 10/24/2025, 3:01:16 PM
Total Failures: 1/157
Success Rate: 99.4%

## Failed Providers

### 1. index.mdx

**Error**: The following field is invalid: Content Blocks > Block 1 (Rich Text) > Content

```
ValidationError: The following field is invalid: Content Blocks > Block 1 (Rich Text) > Content
    at beforeChange (/Users/brad/_CODE_DEV_PROJECTS/cp-cms-payload-cms-mongo/node_modules/.pnpm/payload@3.60.0_graphql@16.11.0_typescript@5.7.2/node_modules/payload/src/fields/hooks/beforeChange/index.ts:77:11)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async createOperation (/Users/brad/_CODE_DEV_PROJECTS/cp-cms-payload-cms-mongo/node_modules/.pnpm/payload@3.60.0_graphql@16.11.0_typescript@5.7.2/node_modules/payload/src/collections/operations/create.ts:222:31)
    at async seed (file:///Users/brad/_CODE_DEV_PROJECTS/cp-cms-payload-cms-mongo/migration/scripts/seed-providers-enhanced.mjs:187:27)
```


## Next Steps

1. Review each error above
2. Fix issues in source MDX files or migration pipeline
3. Run retry script: `./scripts/doppler-run.sh dev node migration/scripts/retry-failed-providers.mjs`
