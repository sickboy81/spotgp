# Progressive Web App (PWA) - ACOMPANHANTES AGORA

## Status
✅ PWA implementado e configurado

## Funcionalidades Implementadas

### 1. Manifest.json
- ✅ Configurado com nome, descrição, ícones, cores de tema
- ✅ Display mode: standalone
- ✅ Shortcuts para Buscar e Favoritos
- ✅ Cores: Theme #cd0e2d, Background #ffffff

### 2. Service Worker
- ✅ Cache de recursos estáticos
- ✅ Estratégia Cache First para assets
- ✅ Estratégia Network First para páginas HTML
- ✅ Atualização automática
- ✅ Suporte offline básico

### 3. Instalação
- ✅ Prompt automático para Android (Chrome)
- ✅ Instruções manuais para iOS (Safari)
- ✅ Componente InstallPrompt integrado
- ✅ Hook usePWAInstall para gerenciar estado

### 4. Meta Tags
- ✅ Meta tags PWA (theme-color, mobile-web-app-capable)
- ✅ Meta tags iOS (apple-mobile-web-app-*)
- ✅ Meta tags Android (application-name, msapplication-*)
- ✅ Links para manifest e ícones

### 5. Ícones
- ⚠️ SVG base criado (`public/logo-base.svg`)
- ⚠️ Script de geração criado (`scripts/generate-icons.js`)
- ⚠️ **AÇÃO NECESSÁRIA**: Gerar ícones PNG em múltiplos tamanhos

## Como Gerar os Ícones

### Opção 1: Ferramenta Online (Mais Fácil)
1. Acesse https://realfavicongenerator.net/
2. Faça upload de `public/logo-base.svg` ou da imagem do logo
3. Configure os tamanhos necessários
4. Baixe e coloque os arquivos em `public/icons/`

### Opção 2: Script Node.js
```bash
# Instalar dependência
npm install --save-dev sharp

# Colocar imagem base em public/logo-base.png (ou ajustar caminho no script)
# Executar script
node scripts/generate-icons.js
```

### Opção 3: ImageMagick
```bash
# Converter SVG para PNGs
convert public/logo-base.svg -resize 192x192 public/icons/icon-192x192.png
convert public/logo-base.svg -resize 512x512 public/icons/icon-512x512.png
# ... (repetir para todos os tamanhos)
```

## Tamanhos de Ícone Necessários

Todos os arquivos devem estar em `public/icons/`:
- `icon-16x16.png`
- `icon-32x32.png`
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-180x180.png` (iOS apple-touch-icon)
- `icon-192x192.png` (mínimo PWA)
- `icon-384x384.png`
- `icon-512x512.png` (splash screen)
- `favicon.ico`

## Testando o PWA

### Android (Chrome)
1. Abra o site no Chrome Android
2. Deve aparecer banner "Adicionar à tela inicial"
3. Ou use o componente InstallPrompt
4. Após instalar, abra o app da tela inicial
5. Deve abrir em modo standalone (sem barra do navegador)

### iOS (Safari)
1. Abra o site no Safari iOS
2. Toque no botão de compartilhar
3. Selecione "Adicionar à Tela de Início"
4. Confirme
5. Abra o app da tela inicial
6. Deve abrir em modo standalone

### Teste Offline
1. Instale o app
2. Abra o app
3. Ative modo avião
4. O app deve continuar funcionando (páginas em cache)

### DevTools
1. Abra Chrome DevTools
2. Vá em Application > Service Workers
3. Verifique se o service worker está registrado
4. Vá em Application > Manifest
5. Verifique se o manifest está correto

## Estrutura de Arquivos

```
public/
  ├── manifest.json          # Manifest do PWA
  ├── sw.js                  # Service Worker
  ├── logo-base.svg          # Logo SVG base para gerar ícones
  └── icons/                 # Ícones PNG (gerar)
    ├── icon-*.png
    └── favicon.ico

src/
  ├── components/features/pwa/
  │   └── InstallPrompt.tsx  # Componente de prompt de instalação
  ├── hooks/
  │   └── usePWAInstall.ts   # Hook para gerenciar instalação
  └── utils/
      └── pwa.ts             # Utilitários PWA
```

## Próximos Passos (Opcional)

- [ ] Adicionar notificações push
- [ ] Melhorar cache offline (cache de imagens de perfis)
- [ ] Adicionar tela de splash personalizada
- [ ] Implementar atualização automática com notificação
- [ ] Adicionar analytics de instalação

## Notas Importantes

1. **HTTPS Obrigatório**: Service Workers só funcionam em HTTPS (ou localhost)
2. **Ícones**: O app funcionará sem os ícones, mas não aparecerá corretamente quando instalado
3. **iOS**: Safari não suporta `beforeinstallprompt`, então mostra instruções manuais
4. **Cache**: O service worker cacheia recursos estáticos, mas APIs externas (Supabase) não são cacheadas








