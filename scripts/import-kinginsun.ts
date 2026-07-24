import fs from 'fs';
import path from 'path';
import { KinginsunEnterpriseConverter } from '../lib/converters/kinginsun-converter';
import { importCompanyData } from '../lib/converters/importer';

async function main() {
  const targetPath = process.argv[2];

  if (!targetPath) {
    console.log(`
====================================================================
 🏢 Kinginsun Enterprise Registration Data Importer
====================================================================
 使用说明:
   bun run scripts/import-kinginsun.ts <CSV文件路径 或 文件夹路径>

 示例:
   1. 导入单个 CSV 文件:
      bun run scripts/import-kinginsun.ts /path/to/enterprise.csv

   2. 批量导入包含 CSV 的文件夹:
      bun run scripts/import-kinginsun.ts /path/to/csv_folder
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
  const csvFiles: string[] = [];

  if (stat.isFile()) {
    if (absolutePath.endsWith('.csv') || absolutePath.endsWith('.txt')) {
      csvFiles.push(absolutePath);
    } else {
      console.error('❌ 指定的文件必须是 .csv 扩展名');
      process.exit(1);
    }
  } else if (stat.isDirectory()) {
    const files = fs.readdirSync(absolutePath);
    for (const f of files) {
      if (f.endsWith('.csv') || f.endsWith('.txt')) {
        csvFiles.push(path.join(absolutePath, f));
      }
    }
  }

  if (csvFiles.length === 0) {
    console.error('❌ 未找到可处理的 CSV 数据文件');
    process.exit(1);
  }

  console.log(`🚀 找到 ${csvFiles.length} 个待导入的数据文件，开始解析转换...\n`);

  const converter = new KinginsunEnterpriseConverter();
  let grandTotalParsed = 0;
  let grandTotalSuccess = 0;
  let grandTotalSkipped = 0;

  for (let idx = 0; idx < csvFiles.length; idx++) {
    const filePath = csvFiles[idx];
    console.log(`[${idx + 1}/${csvFiles.length}] 读取并解析文件: ${path.basename(filePath)}`);
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
