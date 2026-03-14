/**
 * Standalone validator for profile.json output.
 * Reads the existing profile.json and reports its health without running the pipeline.
 *
 * Usage: npm run validate:output
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { validateProfileData } from '../3_pipeline/validator.ts';

const profilePath = path.join(__dirname, '..', '..', 'project', 'public', 'profile.json');

async function main() {
  let raw: string;
  try {
    raw = await fs.readFile(profilePath, 'utf-8');
  } catch {
    console.error(`❌ Could not read ${profilePath}`);
    console.error('   Run npm run pipeline:run first to generate it.');
    process.exit(1);
  }

  const profile = JSON.parse(raw);
  const { concepts = [], evidence = [] } = profile;

  console.log('\n=== Profile Output Health Check ===');
  console.log(`  Concepts : ${concepts.length}`);
  console.log(`  Evidence : ${evidence.length}`);

  // Core cross-reference validation
  const result = validateProfileData(concepts, evidence);

  // Weight distribution summary
  const weights = concepts.map((c: any) => c.weight ?? 0).sort((a: number, b: number) => a - b);
  if (weights.length > 0) {
    const min = weights[0].toFixed(3);
    const max = weights[weights.length - 1].toFixed(3);
    const spread = (weights[weights.length - 1] - weights[0]).toFixed(3);
    console.log(`\n  Weight range : ${min} → ${max}  (spread ${spread})`);
    if (parseFloat(spread) < 0.3) {
      console.warn('  ⚠️  Low weight spread — cells will look similar sizes');
    }
  }

  // Highlights coverage
  const withHighlights = evidence.filter((e: any) => Array.isArray(e.highlights) && e.highlights.length > 0);
  console.log(`  Highlights   : ${withHighlights.length}/${evidence.length} evidence entries have highlights`);

  // Date format check
  const badDates = evidence.filter((e: any) => e.date && !/^\d{4}-\d{2}-\d{2}$/.test(e.date));
  if (badDates.length > 0) {
    console.warn(`\n  ⚠️  ${badDates.length} evidence entries have non-ISO dates:`);
    badDates.forEach((e: any) => console.warn(`     ${e.id}: "${e.date}"`));
  }

  // Orphaned evidence (no concept references them)
  const referencedIds = new Set(concepts.flatMap((c: any) => c.sourceEvidenceIds ?? []));
  const orphaned = evidence.filter((e: any) => !referencedIds.has(e.id));
  if (orphaned.length > 0) {
    console.warn(`\n  ⚠️  ${orphaned.length} evidence entries are not referenced by any concept`);
  }

  // Final verdict
  if (result.isValid && badDates.length === 0) {
    console.log('\n✅ Profile output looks healthy.\n');
  } else {
    console.log(`\n❌ Validation found ${result.errors.length} error(s) and ${result.warnings.length} warning(s).\n`);
    result.errors.slice(0, 20).forEach((e: string) => console.error(`  ❌ ${e}`));
    if (result.errors.length > 20) console.error(`  ... and ${result.errors.length - 20} more`);
    result.warnings.slice(0, 10).forEach((w: string) => console.warn(`  ⚠️  ${w}`));
    process.exit(1);
  }
}

main();
