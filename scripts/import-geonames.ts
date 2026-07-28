import { createHash } from 'node:crypto';
import {
  createReadStream,
  createWriteStream,
  existsSync,
} from 'node:fs';
import { mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import { once } from 'node:events';
import {
  countryNamesForCode,
  parseGeoNamesCityLine,
  sqlLiteral,
  type GeoCityRow,
} from '../lib/converters/geonames';

interface CliOptions {
  input: string;
  output: string;
  force: boolean;
  batchSize: number;
}

function parseArguments(): CliOptions {
  const args = process.argv.slice(2);
  let input = path.join(process.cwd(), 'data', 'cities500.txt');
  let output = '';
  let force = false;
  let batchSize = 500;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--input' || argument === '-i') {
      input = path.resolve(args[++index] || '');
    } else if (argument === '--output' || argument === '-o') {
      output = path.resolve(args[++index] || '');
    } else if (argument === '--batch-size') {
      batchSize = Number(args[++index]);
    } else if (argument === '--force') {
      force = true;
    } else if (!argument.startsWith('-')) {
      input = path.resolve(argument);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!output) {
    throw new Error(
      'An output path is required. Example: bun run import:geo --output /tmp/cities500.sql'
    );
  }
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 5_000) {
    throw new Error('--batch-size must be an integer between 1 and 5000.');
  }
  return { input, output, force, batchSize };
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256');
  const stream = createReadStream(filePath);
  stream.on('data', (chunk) => hash.update(chunk));
  await once(stream, 'end');
  return hash.digest('hex');
}

async function writeChunk(
  writer: ReturnType<typeof createWriteStream>,
  content: string
): Promise<void> {
  if (!writer.write(content)) await once(writer, 'drain');
}

function cityInsert(rows: GeoCityRow[]): string {
  const values = rows
    .map(
      (row) =>
        `(${row.id},${sqlLiteral(row.name)},${sqlLiteral(row.asciiName)},` +
        `${sqlLiteral(row.alternateNames)},${sqlLiteral(row.chineseName)},` +
        `${sqlLiteral(row.countryCode)},${sqlLiteral(row.admin1Code)},` +
        `${row.latitude ?? 'NULL'},${row.longitude ?? 'NULL'})`
    )
    .join(',\n');

  return (
    'INSERT INTO geo_cities ' +
    '(id,name,ascii_name,alternate_names,chinese_name,country_code,admin1_code,latitude,longitude)\n' +
    `VALUES\n${values}\nON CONFLICT (id) DO NOTHING;\n\n`
  );
}

async function generateSql(options: CliOptions) {
  if (!existsSync(options.input)) {
    throw new Error(`Input file does not exist: ${options.input}`);
  }
  if (existsSync(options.output) && !options.force) {
    throw new Error(`Output already exists: ${options.output}. Pass --force to replace it.`);
  }

  await mkdir(path.dirname(options.output), { recursive: true });
  const temporaryOutput = `${options.output}.tmp-${process.pid}`;
  const sourceHash = await sha256File(options.input);
  const writer = createWriteStream(temporaryOutput, {
    encoding: 'utf8',
    flags: 'wx',
  });
  const countries = new Set<string>();
  let batch: GeoCityRow[] = [];
  let parsed = 0;
  let skipped = 0;

  try {
    await writeChunk(
      writer,
      [
        '-- Work-Chain GeoNames data-only export',
        `-- source-sha256: ${sourceHash}`,
        '-- schema is managed exclusively by Drizzle ORM',
        'BEGIN;',
        '',
      ].join('\n')
    );

    const lines = readline.createInterface({
      input: createReadStream(options.input),
      crlfDelay: Infinity,
    });
    for await (const line of lines) {
      if (!line.trim()) continue;
      const city = parseGeoNamesCityLine(line);
      if (!city) {
        skipped += 1;
        continue;
      }
      countries.add(city.countryCode);
      batch.push(city);
      parsed += 1;

      if (batch.length >= options.batchSize) {
        await writeChunk(writer, cityInsert(batch));
        batch = [];
      }
      if (parsed % 25_000 === 0) {
        console.log(`Parsed ${parsed.toLocaleString()} cities...`);
      }
    }
    if (batch.length > 0) await writeChunk(writer, cityInsert(batch));

    const countryValues = [...countries]
      .sort()
      .map((code) => {
        const names = countryNamesForCode(code);
        return `(${sqlLiteral(code)},${sqlLiteral(names.en)},${sqlLiteral(names.zh)})`;
      })
      .join(',\n');
    await writeChunk(
      writer,
      'INSERT INTO geo_countries (code,name,chinese_name)\n' +
        `VALUES\n${countryValues}\nON CONFLICT (code) DO NOTHING;\n\nCOMMIT;\n`
    );
    writer.end();
    await once(writer, 'finish');
    await rename(temporaryOutput, options.output);

    console.log(
      `Generated ${options.output}: ${parsed.toLocaleString()} cities, ` +
        `${countries.size} countries, ${skipped.toLocaleString()} skipped lines.`
    );
    console.log(`Source SHA-256: ${sourceHash}`);
  } catch (error) {
    writer.destroy();
    await rm(temporaryOutput, { force: true });
    throw error;
  }
}

generateSql(parseArguments()).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
