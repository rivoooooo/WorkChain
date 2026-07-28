import { createHash } from 'node:crypto';
import {
  createWriteStream,
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { mkdir, rename, rm } from 'node:fs/promises';
import { once } from 'node:events';
import path from 'node:path';
import { KinginsunEnterpriseConverter } from '../lib/converters/kinginsun-converter';
import {
  companyInsertSql,
  companySqlRecord,
} from '../lib/converters/company-sql';

interface Options {
  inputs: string[];
  output: string;
  batchSize: number;
  force: boolean;
}

function filesIn(target: string): string[] {
  const absolute = path.resolve(target);
  const stat = statSync(absolute);
  if (stat.isFile()) return [absolute];
  return readdirSync(absolute)
    .flatMap((entry) => filesIn(path.join(absolute, entry)))
    .filter((file) => /\.(csv|txt)$/i.test(file))
    .sort();
}

function options(): Options {
  const args = process.argv.slice(2);
  const targets: string[] = [];
  let output = '';
  let batchSize = 500;
  let force = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--dir' || argument === '-d') {
      targets.push(args[++index] || '');
    } else if (argument === '--output' || argument === '-o') {
      output = path.resolve(args[++index] || '');
    } else if (argument === '--batch-size') {
      batchSize = Number(args[++index]);
    } else if (argument === '--force') {
      force = true;
    } else if (!argument.startsWith('-')) {
      targets.push(argument);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (targets.length === 0 || !output) {
    throw new Error(
      'Usage: bun run import:kinginsun <CSV|directory> --output <data.sql>'
    );
  }
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 5_000) {
    throw new Error('--batch-size must be between 1 and 5000.');
  }
  return {
    inputs: [...new Set(targets.flatMap(filesIn))].sort(),
    output,
    batchSize,
    force,
  };
}

async function write(
  stream: ReturnType<typeof createWriteStream>,
  value: string
) {
  if (!stream.write(value)) await once(stream, 'drain');
}

async function main() {
  const config = options();
  if (config.inputs.length === 0) throw new Error('No CSV or TXT inputs found.');
  if (existsSync(config.output) && !config.force) {
    throw new Error(`Output exists: ${config.output}. Pass --force to replace it.`);
  }

  const converter = new KinginsunEnterpriseConverter();
  let parsed = 0;
  let valid = 0;
  let skipped = 0;
  const sourceHash = createHash('sha256');

  await mkdir(path.dirname(config.output), { recursive: true });
  const temporary = `${config.output}.tmp-${process.pid}`;
  const writer = createWriteStream(temporary, { encoding: 'utf8', flags: 'wx' });
  try {
    await write(
      writer,
      '-- Work-Chain company data-only export\n' +
        '-- schema is managed exclusively by Drizzle ORM\nBEGIN;\n\n'
    );

    const commonRoot = path.dirname(
      config.inputs.reduce((common, file) => {
        let candidate = common;
        while (!file.startsWith(`${candidate}${path.sep}`) && candidate !== path.dirname(candidate)) {
          candidate = path.dirname(candidate);
        }
        return candidate;
      }, path.dirname(config.inputs[0]))
    );

    for (let fileIndex = 0; fileIndex < config.inputs.length; fileIndex += 1) {
      const file = config.inputs[fileIndex];
      const content = readFileSync(file);
      const relativeFile = path.relative(commonRoot, file);
      sourceHash.update(relativeFile).update('\0').update(content);
      const result = await converter.parse(content);
      parsed += result.totalParsed;
      valid += result.success.length;
      skipped += result.skipped.length;

      for (let index = 0; index < result.success.length; index += config.batchSize) {
        await write(
          writer,
          companyInsertSql(
            result.success.slice(index, index + config.batchSize).map(companySqlRecord)
          )
        );
      }
      console.log(
        `[${fileIndex + 1}/${config.inputs.length}] ${relativeFile}: ` +
          `${result.success.length} valid, ${result.skipped.length} skipped`
      );
    }

    const digest = sourceHash.digest('hex');
    await write(writer, `-- source-sha256: ${digest}\nCOMMIT;\n`);
    writer.end();
    await once(writer, 'finish');
    await rename(temporary, config.output);
    console.log(
      `Generated ${config.output}: ${valid} valid rows, ` +
        `${parsed} parsed rows, ${skipped} skipped rows.`
    );
    console.log(`Source SHA-256: ${digest}`);
  } catch (error) {
    writer.destroy();
    await rm(temporary, { force: true });
    throw error;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
