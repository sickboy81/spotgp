// Script para gerar ícones PWA a partir de uma imagem base
// Requer: npm install --save-dev sharp

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tamanhos necessários para PWA
const sizes = [
  16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512
];

// Caminho da imagem base (ajuste conforme necessário)
const inputImage = path.join(__dirname, '../public/logo-base.svg'); // ou .svg, .jpg, etc.
const outputDir = path.join(__dirname, '../public/icons');

// Criar diretório se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Verificar se a imagem base existe
if (!fs.existsSync(inputImage)) {
  console.error(`❌ Imagem base não encontrada: ${inputImage}`);
  console.log('📝 Por favor, coloque sua imagem base em:', inputImage);
  console.log('   Ou ajuste o caminho no script.');
  process.exit(1);
}

console.log('🎨 Gerando ícones PWA...\n');

// Gerar cada tamanho
Promise.all(
  sizes.map(size => {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    
    return sharp(inputImage)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(outputPath)
      .then(() => {
        console.log(`✅ Gerado: icon-${size}x${size}.png`);
      })
      .catch(err => {
        console.error(`❌ Erro ao gerar ${size}x${size}:`, err.message);
      });
  })
)
.then(() => {
  // Gerar favicon.ico (usando o 32x32)
  const faviconPath = path.join(outputDir, 'favicon.ico');
  return sharp(path.join(outputDir, 'icon-32x32.png'))
    .toFile(faviconPath)
    .then(() => {
      console.log('✅ Gerado: favicon.ico\n');
      console.log('✨ Todos os ícones foram gerados com sucesso!');
      console.log(`📁 Localização: ${outputDir}`);
    });
})
.catch(err => {
  console.error('❌ Erro ao gerar ícones:', err);
  process.exit(1);
});
