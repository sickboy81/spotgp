# Guia de Deploy com Coolify + Nixpacks - VDS Alexhost

> **Ambiente:** VDS Alexhost  
> **Recursos:** 4GB RAM, 40GB SSD, 2 cores  
> **Plataforma:** Coolify (gerencia deploy, containers, e servidor web)  
> **Build Tool:** Nixpacks (via Coolify)  
> **Aplicação:** Vite + React (SPA)

---

## 📋 Informações do Ambiente

### **Especificações do Servidor:**
- **RAM:** 4GB
- **Armazenamento:** 40GB SSD
- **CPU:** 2 cores
- **Plataforma:** Coolify (self-hosted)
- **Build:** Nixpacks (gerenciado pelo Coolify)
- **Servidor Web:** Caddy ou Traefik (gerenciado pelo Coolify)

### **Aplicação:**
- **Framework:** React 19 + Vite 7
- **Backend:** Directus (externo - `https://base.spotgp.com`)
- **Armazenamento:** Cloudflare R2
- **Tipo:** SPA (Single Page Application)

---

## 🔧 Configuração do Coolify + Nixpacks

### **Como o Coolify Funciona:**

O Coolify detecta automaticamente o `nixpacks.toml` na raiz do projeto e usa para fazer o build. Você já tem esse arquivo configurado! ✅

### **1. Arquivo de Configuração Nixpacks**

Você já tem o arquivo `nixpacks.toml` na raiz do projeto configurado assim:

```toml
[phases.setup]
nixPkgs = ["nodejs_20", "npm"]

[phases.install]
cmds = ["npm ci --prefer-offline --no-audit"]

[phases.build]
cmds = ["NODE_OPTIONS='--max-old-space-size=3072' npm run build"]

[start]
cmd = "npm run start"
```

**Nota:** A configuração já está otimizada para seus recursos limitados (4GB RAM, 2 cores). O Coolify detecta automaticamente este arquivo e usa para fazer o build.

### **2. Variáveis de Ambiente no Coolify**

Configure as seguintes variáveis na interface do Coolify (seção "Environment Variables"):

```bash
# Directus
VITE_DIRECTUS_URL=https://base.spotgp.com

# R2 (Cloudflare)
VITE_R2_ACCOUNT_ID=seu_account_id
VITE_R2_ACCESS_KEY_ID=sua_access_key
VITE_R2_SECRET_ACCESS_KEY=sua_secret_key
VITE_R2_BUCKET_NAME=seu_bucket_name
VITE_R2_PUBLIC_URL=https://seu_dominio.r2.dev

# Node
NODE_ENV=production
PORT=3000
```

---

## 🌐 Configuração de Headers de Segurança no Coolify

### **Como o Coolify Funciona:**

O **Coolify** é uma plataforma de deploy self-hosted que:
- ✅ Gerencia containers Docker automaticamente
- ✅ Faz build com Nixpacks
- ✅ Configura HTTPS automaticamente (Let's Encrypt)
- ✅ Gerencia servidor web (Caddy ou Traefik)
- ✅ Tem interface web para configurações

### **Status Atual:**

✅ **Seu servidor já está funcionando com Coolify!**

Agora você só precisa **adicionar os headers de segurança**. Existem 3 formas de fazer isso:

---

### **Opção 1: Via Interface do Coolify (Mais Fácil) 🎯**

1. Acesse a interface do Coolify no seu servidor
2. Vá até a aplicação (resource)
3. Procure por **"Headers"** ou **"HTTP Headers"** nas configurações
4. Adicione os seguintes headers:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://base.spotgp.com https://*.r2.cloudflarestorage.com https://*.cloudflarestorage.com; media-src 'self' blob: https:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests;
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Permissions-Policy: geolocation=(self), microphone=(self), camera=(self)
```

5. Salve e recarregue a aplicação

---

### **Opção 2: Via Caddyfile (Se Estiver Usando Caddy)**

Se o Coolify estiver usando Caddy, você pode criar um arquivo `Caddyfile` na raiz do projeto:

```caddy
yourdomain.com {
    # ============================================
    # ADICIONAR ESTA SEÇÃO DE HEADERS DE SEGURANÇA
    # ============================================
    header {
        # CSP (Content Security Policy)
        Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://base.spotgp.com https://*.r2.cloudflarestorage.com https://*.cloudflarestorage.com; media-src 'self' blob: https:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests;"
        
        # Frame Options (protege contra clickjacking)
        X-Frame-Options "SAMEORIGIN"
        
        # Content Type (previne MIME sniffing)
        X-Content-Type-Options "nosniff"
        
        # XSS Protection
        X-XSS-Protection "1; mode=block"
        
        # Referrer Policy
        Referrer-Policy "strict-origin-when-cross-origin"
        
        # HSTS (força HTTPS - apenas se já estiver usando HTTPS)
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        
        # Permissions Policy
        Permissions-Policy "geolocation=(self), microphone=(self), camera=(self)"
        
        # Remove Server header (não expor versão do Caddy)
        -Server
    }
    
    # ============================================
    # SUA CONFIGURAÇÃO EXISTENTE (manter como está)
    # ============================================
    # Exemplo do que você provavelmente já tem:
    root * /app/dist
    file_server
    try_files {path} /index.html
    encode gzip
    
    # Cache estático (opcional, mas recomendado)
    @static {
        file
        path *.js *.css *.png *.jpg *.jpeg *.gif *.svg *.ico *.woff *.woff2 *.ttf *.eot
    }
    header @static Cache-Control "public, max-age=31536000, immutable"
}
```

**Como usar:**
1. Crie o arquivo `Caddyfile` na raiz do projeto (se não existir)
2. O Coolify pode detectar automaticamente e usar
3. Ou adicione a seção `header { ... }` ao Caddyfile existente
4. Faça commit e push - o Coolify vai recarregar automaticamente

---

### **Opção 3: Via Labels Docker (Se Estiver Usando Traefik)**

Se o Coolify estiver usando Traefik (padrão), você pode adicionar labels no `docker-compose.yml` ou via interface do Coolify:

```yaml
labels:
  - "traefik.http.middlewares.security-headers.headers.customrequestheaders.Content-Security-Policy=default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://base.spotgp.com https://*.r2.cloudflarestorage.com https://*.cloudflarestorage.com; media-src 'self' blob: https:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests;"
  - "traefik.http.middlewares.security-headers.headers.customrequestheaders.X-Frame-Options=SAMEORIGIN"
  - "traefik.http.middlewares.security-headers.headers.customrequestheaders.X-Content-Type-Options=nosniff"
  - "traefik.http.middlewares.security-headers.headers.customrequestheaders.X-XSS-Protection=1; mode=block"
  - "traefik.http.middlewares.security-headers.headers.customrequestheaders.Referrer-Policy=strict-origin-when-cross-origin"
  - "traefik.http.middlewares.security-headers.headers.customrequestheaders.Strict-Transport-Security=max-age=31536000; includeSubDomains; preload"
```

---

## 🎯 **Recomendação:**

**Use a Opção 1 (Interface do Coolify)** - É a mais fácil e não requer editar arquivos!

Se não encontrar a opção de headers na interface, use a **Opção 2 (Caddyfile)** se estiver usando Caddy, ou **Opção 3 (Labels)** se estiver usando Traefik.

### **Opção 2: Usando Nginx (Se configurado manualmente)**

Se você configurar Nginx manualmente no VDS:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com;
    
    # SSL configuration (usar Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security Headers
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://base.spotgp.com https://*.r2.cloudflarestorage.com https://*.cloudflarestorage.com; media-src 'self' blob: https:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests;" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Permissions-Policy "geolocation=(self), microphone=(self), camera=(self)" always;
    
    # Root
    root /app/dist;
    index index.html;
    
    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache estático
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

---

## ⚡ Otimizações para Recursos Limitados (4GB RAM, 2 cores)

### **1. Otimizar Build do Vite**

Atualize `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Otimizações para produção
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log em produção
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendor chunks para melhor cache
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'framer-motion'],
          'map-vendor': ['leaflet', 'react-leaflet'],
        },
      },
    },
    // Limitar chunk size
    chunkSizeWarningLimit: 1000,
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://base.spotgp.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
})
```

### **2. Configurar Limites de Memória no Nixpacks**

No `nixpacks.toml`:

```toml
[phases.setup]
nixPkgs = ["nodejs_20", "npm"]

[phases.install]
cmds = ["npm ci --prefer-offline --no-audit"]

[phases.build]
cmds = ["NODE_OPTIONS='--max-old-space-size=3072' npm run build"]

[start]
cmd = "npm run start"
```

**Nota:** `--max-old-space-size=3072` limita Node.js a 3GB de RAM (deixando 1GB para o sistema).

### **3. Otimizar package.json**

Adicione scripts otimizados:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "build:prod": "NODE_OPTIONS='--max-old-space-size=3072' npm run build",
    "lint": "eslint .",
    "preview": "vite preview",
    "start": "vite preview --host 0.0.0.0 --port ${PORT:-3000}",
    "db:setup": "node scripts/setup-directus.js"
  }
}
```

---

## 🚀 Processo de Deploy

### **1. Build Local (Teste)**

```bash
# Testar build localmente
npm run build

# Verificar tamanho do bundle
du -sh dist/

# Testar preview
npm run preview
```

### **2. Deploy com Nixpacks**

1. **Commit e Push:**
   ```bash
   git add .
   git commit -m "Deploy: preparado para produção"
   git push origin main
   ```

2. **No painel do Nixpacks/VDS:**
   - Configure variáveis de ambiente
   - Defina porta (3000 ou a que o nixpacks usar)
   - Configure domínio

3. **Verificar Deploy:**
   ```bash
   # Verificar se aplicação está rodando
   curl https://yourdomain.com
   
   # Verificar headers de segurança
   curl -I https://yourdomain.com
   ```

---

## 🔍 Verificações Pós-Deploy

### **1. Verificar Headers de Segurança**

```bash
# Verificar todos os headers
curl -I https://yourdomain.com

# Verificar CSP
curl -I https://yourdomain.com | grep -i "content-security-policy"

# Usar ferramenta online
# https://securityheaders.com
# https://observatory.mozilla.org
```

### **2. Verificar Performance**

```bash
# Verificar tempo de resposta
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com

# curl-format.txt:
#     time_namelookup:  %{time_namelookup}\n
#        time_connect:  %{time_connect}\n
#     time_appconnect:  %{time_appconnect}\n
#    time_pretransfer:  %{time_pretransfer}\n
#       time_redirect:  %{time_redirect}\n
#  time_starttransfer:  %{time_starttransfer}\n
#                     ----------\n
#          time_total:  %{time_total}\n
```

### **3. Verificar Uso de Recursos**

```bash
# Ver uso de memória
free -h

# Ver uso de CPU
top

# Ver processos Node
ps aux | grep node
```

---

## ⚠️ Considerações para Recursos Limitados

### **Limitações do Ambiente (4GB RAM, 2 cores):**

1. **Build:**
   - Build pode demorar mais (5-10 minutos)
   - Use `--max-old-space-size=3072` para evitar OOM
   - Considere build em CI/CD externo se possível

2. **Runtime:**
   - Vite preview é leve (~50-100MB RAM)
   - Aplicação React é estática (servida como arquivos)
   - Não há processamento pesado no servidor

3. **Otimizações:**
   - ✅ Bundle já otimizado com code splitting
   - ✅ Assets comprimidos
   - ✅ Lazy loading implementado
   - ⚠️ Considere CDN para assets estáticos (Cloudflare)

### **Recomendações:**

1. **Usar CDN (Cloudflare):**
   - Cache de assets estáticos
   - Reduz carga no VDS
   - Melhora performance global

2. **Monitorar Recursos:**
   ```bash
   # Instalar htop para monitoramento
   apt install htop
   htop
   ```

3. **Configurar Swap (se necessário):**
   ```bash
   # Criar swap de 2GB (se RAM não for suficiente)
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

---

## 📝 Checklist de Deploy

### **Antes do Deploy:**
- [x] Variáveis de ambiente configuradas
- [x] Build testado localmente
- [x] Bundle size verificado
- [ ] Headers de segurança configurados (Caddy/Nginx)
- [ ] HTTPS configurado
- [ ] Domínio apontado para VDS

### **Durante o Deploy:**
- [ ] Build executado com sucesso
- [ ] Aplicação iniciada sem erros
- [ ] Porta configurada corretamente
- [ ] Logs verificados

### **Após o Deploy:**
- [ ] Aplicação acessível via domínio
- [ ] Headers de segurança verificados
- [ ] HTTPS funcionando
- [ ] Performance testada
- [ ] Recursos do servidor monitorados

---

## 🐛 Troubleshooting

### **Problema: Build falha por falta de memória**

**Solução:**
```toml
# nixpacks.toml
[phases.build]
cmds = ["NODE_OPTIONS='--max-old-space-size=3072' npm run build"]
```

### **Problema: Aplicação não carrega (404 em rotas)**

**Solução:** Configurar SPA fallback no Caddy/Nginx:
```caddy
try_files {path} /index.html
```

### **Problema: Headers de segurança não aparecem**

**Solução:** Verificar se Caddyfile/Nginx está sendo usado e se headers estão configurados corretamente.

### **Problema: Variáveis de ambiente não funcionam**

**Solução:** Verificar se variáveis `VITE_*` estão configuradas no painel do nixpacks.

---

## 📚 Recursos Adicionais

- [Nixpacks Documentation](https://nixpacks.com/docs)
- [Caddy Documentation](https://caddyserver.com/docs/)
- [Vite Production Guide](https://vitejs.dev/guide/build.html)
- [Security Headers Guide](./SECURITY_HEADERS_GUIDE.md)

---

**Última atualização:** Dezembro 2024

