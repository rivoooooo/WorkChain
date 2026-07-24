import fs from 'fs';
import path from 'path';
import { KinginsunEnterpriseConverter } from '../lib/converters/kinginsun-converter';
import { importCompanyData } from '../lib/converters/importer';

// 递归扫描目录下的所有 CSV / TXT 文件
function scanDirectoryRecursively(dirPath: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dirPath);

  for (const file of list) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat && stat.isDirectory()) {
      results = results.concat(scanDirectoryRecursively(fullPath));
    } else if (file.endsWith('.csv') || file.endsWith('.txt')) {
      results.push(fullPath);
    }
  }

  return results;
}

async function main() {
  const args = process.argv.slice(2);
  let targetPath = '';

  // 解析 --dir 参数或位置参数
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir' || args[i] === '-d') {
      targetPath = args[i + 1] || '';
      break;
    } else if (!args[i].startsWith('-') && !targetPath) {
      targetPath = args[i];
    }
  }

  if (!targetPath) {
    console.log(`
====================================================================
 🏢 Kinginsun Enterprise Registration Data Importer
====================================================================
 数据来源与致谢:
   https://github.com/kinginsun/Enterprise-Registration-Data-of-Chinese-Mainland

 使用说明:
   1. 使用 --dir 选项导入目录下所有 CSV:
      bun run scripts/import-kinginsun.ts --dir <目录路径>

   2. 导入单个 CSV 文件:
      bun run scripts/import-kinginsun.ts <文件路径>

 示例:
   bun run scripts/import-kinginsun.ts --dir /path/to/enterprise_csv_dir
   bun run import:kinginsun --dir ./data/kinginsun
====================================================================
`);
    process.exit(1);
  }

  const absolutePath = path.resolve(targetPath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ 指定的文件或目录不存在: ${absolutePath}`);
    process.exit(1);
  }

  const stat = fs.statSync(absolutePath);
  let csvFiles: string[] = [];

  if (stat.isFile()) {
    if (absolutePath.endsWith('.csv') || absolutePath.endsWith('.txt')) {
      csvFiles.push(absolutePath);
    } else {
      console.error('❌ 指定的文件必须是 .csv 或 .txt 格式');
      process.exit(1);
    }
  } else if (stat.isDirectory()) {
    csvFiles = scanDirectoryRecursively(absolutePath);
  }

  if (csvFiles.length === 0) {
    console.error(`❌ 在目录 [${absolutePath}] 中未找到可处理的 CSV / TXT 数据文件`);
    process.exit(1);
  }

  console.log(`🚀 找到 ${csvFiles.length} 个待导入的数据文件，开始解析转换...\n`);

  const converter = new KinginsunEnterpriseConverter();
  let grandTotalParsed = 0;
  let grandTotalSuccess = 0;
  let grandTotalSkipped = 0;

  for (let idx = 0; idx < csvFiles.length; idx++) {
    const filePath = csvFiles[idx];
    console.log(`[${idx + 1}/${csvFiles.length}] 读取并解析文件: ${path.relative(process.cwd(), filePath)}`);
    const startTime = Date.now();

    try {
      const csvContent = fs.readFileSync(filePath, 'utf-8');
      const parseResult = await converter.parse(csvContent);

      grandTotalParsed += parseResult.totalParsed;
      grandTotalSuccess += parseResult.success.length;
      grandTotalSkipped += parseResult.skipped.length;

      console.log(`   └─ 共解析 ${parseResult.totalParsed} 行, 有效数据: ${parseResult.success.length} 条, 跳过无效: ${parseResult.skipped.length} 条 (耗时 ${Date.now() - startTime}ms)`);

      if (parseResult.success.length > 0) {
        console.log(`   └─ 开始按 统一社会信用代码 执行数据库批量 Upsert 增量更新...`);
        const importSummary = await importCompanyData(parseResult.success, {
          batchSize: 500,
          onProgress: (processed, total) => {
            const pct = Math.round((processed / total) * 100);
            process.stdout.write(`\r      进度: ${processed}/${total} (${pct}%)`);
          },
        });
        process.stdout.write('\n');
        console.log(`   ✅ 文件导入完成! 成功入库/更新: ${importSummary.insertedOrUpdated} 条, 失败: ${importSummary.failedCount} 条\n`);
      }
    } catch (err: any) {
      console.error(`❌ 解析/导入文件失败 [${filePath}]:`, err.message || err);
    }
  }

  console.log(`
====================================================================
 🎉 批量数据导入完成!
 ------------------------------------------------------------------
  总处理记录数 : ${grandTotalParsed}
  成功解析校验 : ${grandTotalSuccess}
  跳过无效行数 : ${grandTotalSkipped}
====================================================================
`);

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ 执行企业数据导入脚本失败:', err);
  process.exit(1);
});
