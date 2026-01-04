# Guia de Configuração de Headers de Segurança no Servidor

Este guia explica como configurar os headers de segurança HTTP no servidor para produção.

## Headers Necessários

### 1. Content-Security-Policy
**Status:** ✅ Já adicionado no `index.html` (meta tag)

**Para produção (HTTP Header):**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://base.spotgp.com https://*.r2.cloudflarestorage.com https://*.cloudflarestorage.com; media-src 'self' blob: https:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests;
```

### 2. X-Frame-Options
```
X-Frame-Options: SAMEORIGIN
```
**Nota:** Previne clickjacking. `SAMEORIGIN` permite que o site seja incorporado apenas no mesmo domínio.

### 3. X-Content-Type-Options
```
X-Content-Type-Options: nosniff
```
**Status:** ✅ Já no `index.html`

### 4. X-XSS-Protection
```
X-XSS-Protection: 1; mode=block
```
**Status:** ✅ Já no `index.html`

### 5. Referrer-Policy
```
Referrer-Policy: strict-origin-when-cross-origin
```
**Status:** ✅ Já no `index.html`

### 6. Strict-Transport-Security (HSTS)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
**Nota:** Apenas para HTTPS. Força uso de HTTPS por 1 ano.

### 7. Permissions-Policy
```
Permissions-Policy: geolocation=(self), microphone=(self), camera=(self)
```

---

## Configuração por Servidor

### **Caddy**

Crie ou edite `Caddyfile`:

```caddy
yourdomain.com {
    # Headers de segurança
    header {
        # CSP
        Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://base.spotgp.com https://*.r2.cloudflarestorage.com https://*.cloudflarestorage.com; media-src 'self' blob: https:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests;"
        
        # Frame Options
        X-Frame-Options "SAMEORIGIN"
        
        # Content Type
        X-Content-Type-Options "nosniff"
        
        # XSS Protection
        X-XSS-Protection "1; mode=block"
        
        # Referrer Policy
        Referrer-Policy "strict-origin-when-cross-origin"
        
        # HSTS (apenas HTTPS)
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        
        # Permissions Policy
        Permissions-Policy "geolocation=(self), microphone=(self), camera=(self)"
        
        # Remove Server header
        -Server
    }
    
    # Servir arquivos estáticos
    root * /path/to/dist
    file_server
    
    # Proxy para API se necessário
    handle /api/* {
        reverse_proxy https://base.spotgp.com {
            header_up Host {host}
        }
    }
}
```

### **Nginx**

Adicione ao bloco `server`:

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
    
    # SSL configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Security Headers
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://base.spotgp.com https://*.r2.cloudflarestorage.com https://*.cloudflarestorage.com; media-src 'self' blob: https:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests;" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Permissions-Policy "geolocation=(self), microphone=(self), camera=(self)" always;
    
    # Hide Nginx version
    server_tokens off;
    
    # Root
    root /path/to/dist;
    index index.html;
    
    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API
    location /api/ {
        proxy_pass https://base.spotgp.com/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **Apache (.htaccess)**

Adicione ao `.htaccess` na raiz do site:

```apache
<IfModule mod_headers.c>
    # Content Security Policy
    Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://base.spotgp.com https://*.r2.cloudflarestorage.com https://*.cloudflarestorage.com; media-src 'self' blob: https:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests;"
    
    # Frame Options
    Header set X-Frame-Options "SAMEORIGIN"
    
    # Content Type
    Header set X-Content-Type-Options "nosniff"
    
    # XSS Protection
    Header set X-XSS-Protection "1; mode=block"
    
    # Referrer Policy
    Header set Referrer-Policy "strict-origin-when-cross-origin"
    
    # HSTS (apenas HTTPS)
    Header set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" env=HTTPS
    
    # Permissions Policy
    Header set Permissions-Policy "geolocation=(self), microphone=(self), camera=(self)"
</IfModule>
```

### **Cloudflare (via Dashboard)**

1. Acesse **Security** > **Headers**
2. Adicione cada header individualmente ou use **Transform Rules**

**Ou via Workers (recomendado):**

```javascript
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
    const response = await fetch(request)
    
    // Clone response to modify headers
    const newResponse = new Response(response.body, response)
    
    // Add security headers
    newResponse.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://base.spotgp.com https://*.r2.cloudflarestorage.com https://*.cloudflarestorage.com; media-src 'self' blob: https:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests;")
    newResponse.headers.set('X-Frame-Options', 'SAMEORIGIN')
    newResponse.headers.set('X-Content-Type-Options', 'nosniff')
    newResponse.headers.set('X-XSS-Protection', '1; mode=block')
    newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    newResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    newResponse.headers.set('Permissions-Policy', 'geolocation=(self), microphone=(self), camera=(self)')
    
    return newResponse
}
```

---

## Verificação

### Testar Headers

```bash
# Usando curl
curl -I https://yourdomain.com

# Usando online tools
# https://securityheaders.com
# https://observatory.mozilla.org
```

### Score Esperado

- **SecurityHeaders.com:** A+ (com todos os headers)
- **Mozilla Observatory:** 100+ pontos

---

## Notas Importantes

1. **CSP pode quebrar funcionalidades:** Teste cuidadosamente após implementar
2. **HSTS apenas em HTTPS:** Não adicione em HTTP
3. **Ajuste CSP conforme necessário:** Se alguma funcionalidade quebrar, ajuste as políticas
4. **Teste em staging primeiro:** Sempre teste em ambiente de staging antes de produção

---

## Troubleshooting

### Erro: "Refused to load script"
**Causa:** CSP bloqueando scripts
**Solução:** Adicionar origem ao `script-src` no CSP

### Erro: "Refused to connect"
**Causa:** CSP bloqueando conexões
**Solução:** Adicionar origem ao `connect-src` no CSP

### Erro: "Refused to load image"
**Causa:** CSP bloqueando imagens
**Solução:** Adicionar origem ao `img-src` no CSP

