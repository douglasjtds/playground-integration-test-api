import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mdToPdf } from 'md-to-pdf';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const ebookDir = join(rootDir, 'docs', 'ebook');
const outputPath = join(rootDir, 'docs', 'taskflow-api-poc.pdf');

const chapters = [
  '00-introducao.md',
  '01-arquitetura.md',
  '02-api-e-rotas.md',
  '03-estrategia-de-testes.md',
  '04-ia-nos-testes.md',
  '05-conclusao-e-proximos-passos.md',
];

const coverPage = `
<div style="text-align: center; padding-top: 200px;">
  <h1 style="font-size: 36px; margin-bottom: 10px;">TaskFlow API</h1>
  <h2 style="font-size: 24px; color: #666; margin-bottom: 40px;">POC de Testes de Integração com IA</h2>
  <p style="font-size: 14px; color: #999;">Versão 1.0.0</p>
  <p style="font-size: 14px; color: #999;">Gerado em: ${new Date().toLocaleDateString('pt-BR')}</p>
  <p style="font-size: 14px; color: #999; margin-top: 20px;">Douglas Tertuliano + Claude Code (Opus 4.6)</p>
</div>

<div style="page-break-after: always;"></div>
`;

async function generateEbook() {
  console.log('📖 Gerando ebook TaskFlow API...\n');

  const chapterContents: string[] = [];

  for (const chapter of chapters) {
    const filePath = join(ebookDir, chapter);
    try {
      const content = readFileSync(filePath, 'utf-8');
      chapterContents.push(content);
      console.log(`  ✓ ${chapter} (${content.split('\n').length} linhas)`);
    } catch {
      console.error(`  ✗ ${chapter} — arquivo não encontrado`);
      process.exit(1);
    }
  }

  const separator = '\n\n<div style="page-break-after: always;"></div>\n\n';
  const fullMarkdown = coverPage + chapterContents.join(separator);

  console.log('\n📝 Convertendo para PDF...');

  const pdf = await mdToPdf(
    { content: fullMarkdown },
    {
      pdf_options: {
        format: 'A4',
        margin: {
          top: '2cm',
          right: '2cm',
          bottom: '2cm',
          left: '2cm',
        },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 9px; color: #999; width: 100%; text-align: center; padding: 0 2cm;">
            TaskFlow API — POC de Testes com IA
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 9px; color: #999; width: 100%; text-align: center; padding: 0 2cm;">
            <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        `,
        printBackground: true,
      },
      stylesheet: join(ebookDir, 'styles.css'),
      launch_options: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    }
  );

  if (pdf?.content) {
    writeFileSync(outputPath, pdf.content);

    const stats = statSync(outputPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`\n✅ Ebook gerado com sucesso!`);
    console.log(`   📄 Arquivo: ${outputPath}`);
    console.log(`   📦 Tamanho: ${sizeMB} MB`);
  } else {
    console.error('\n❌ Falha ao gerar o PDF');
    process.exit(1);
  }
}

generateEbook().catch((err) => {
  console.error('Erro ao gerar ebook:', err);
  process.exit(1);
});
