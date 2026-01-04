# Instruções para Gerar Ícones PWA

## Opções para Gerar Ícones

### Opção 1: Usar Ferramenta Online (Recomendado)
1. Acesse: https://realfavicongenerator.net/ ou https://www.pwabuilder.com/imageGenerator
2. Faça upload do logo (imagem em anexo ou exporte o SVG do componente Logo)
3. Configure os tamanhos necessários
4. Baixe os ícones gerados
5. Coloque todos os arquivos na pasta `public/icons/`

### Opção 2: Usar Node.js com sharp
```bash
npm install --save-dev sharp
node scripts/generate-icons.js
```

### Opção 3: Usar ImageMagick (se instalado)
```bash
# Converter SVG para PNG em múltiplos tamanhos
convert logo.svg -resize 16x16 public/icons/icon-16x16.png
convert logo.svg -resize 32x32 public/icons/icon-32x32.png
convert logo.svg -resize 72x72 public/icons/icon-72x72.png
convert logo.svg -resize 96x96 public/icons/icon-96x96.png
convert logo.svg -resize 128x128 public/icons/icon-128x128.png
convert logo.svg -resize 144x144 public/icons/icon-144x144.png
convert logo.svg -resize 152x152 public/icons/icon-152x152.png
convert logo.svg -resize 180x180 public/icons/icon-180x180.png
convert logo.svg -resize 192x192 public/icons/icon-192x192.png
convert logo.svg -resize 384x384 public/icons/icon-384x384.png
convert logo.svg -resize 512x512 public/icons/icon-512x512.png
```

## Tamanhos Necessários

- 16x16 (favicon)
- 32x32 (favicon)
- 72x72 (Android)
- 96x96 (Android)
- 128x128 (Android)
- 144x144 (Windows)
- 152x152 (iOS)
- 180x180 (iOS - apple-touch-icon)
- 192x192 (Android - mínimo PWA)
- 384x384 (Android)
- 512x512 (Android - splash screen)

## Nota
Se você tiver a imagem do logo em anexo, use-a como base. Caso contrário, exporte o SVG do componente `src/components/ui/Logo.tsx` e use como base.






