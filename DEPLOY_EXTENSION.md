# Guia de Instalação: Extensão de Segurança (Passo a Passo Simplificado)

Este guia vai te ajudar a colocar a extensão de segurança no seu servidor AlexHost. Escolha o **Método 1 (Visual)** se você prefere usar o mouse e janelas, ou o **Método 2 (Rápido)** se prefere linha de comando.

---

## Método 1: Usando FileZilla (Recomendado / Visual) 🖱️

Se você não tem o FileZilla instalado, baixe-o (o "Client") em: https://filezilla-project.org/

### Passo 1: Conectar no Servidor
1.  Abra o FileZilla.
2.  Preencha os campos no topo:
    *   **Host:** `sftp://base.spotgp.com` (ou coloque o IP do seu servidor)
    *   **Usuário:** `root`
    *   **Senha:** (Sua senha de root da AlexHost)
    *   **Porta:** `22`
3.  Clique em **Conexão Rápida**. (Aceite o aviso de chave de host se aparecer).

### Passo 2: Localizar a pasta do Directus
No lado **Direito** (Site Remoto - Servidor), você precisa achar onde o Directus está instalado.
*   Geralmente fica em `/var/www/directus`, `/opt/directus` ou `/root/directus`.
*   Procure por uma pasta chamada `extensions`.
*   Dentro de `extensions`, procure (ou crie) uma pasta chamada `endpoints`.

O caminho final deve ser algo como: `.../directus/extensions/endpoints`

### Passo 3: Enviar os Arquivos
1.  No lado **Esquerdo** (Site Local - Seu PC), navegue até a pasta do seu projeto Saphira:
    `e:\Vibecode apps\Saphira\directus-extension`
2.  Arraste a pasta `saphira-signer` do lado esquerdo para dentro da pasta `endpoints` no lado direito.

### Passo 4: Instalar (O único passo comando)
Agora precisamos "ligar" a extensão.
1.  No seu computador, abra o terminal (PowerShell).
2.  Conecte no servidor: `ssh root@base.spotgp.com` (digite a senha quando pedir).
3.  Entre na pasta que você acabou de enviar:
    *   Dica: Use `cd` para navegar. Ex: `cd /caminho/que/voce/achou/directus/extensions/endpoints/saphira-signer`
4.  Rode o comando: `npm install`
    *   Isso vai baixar as bibliotecas necessárias.

### Passo 5: Configurar Chaves
1.  Ainda no terminal (ou baixando o arquivo `.env` pelo FileZilla, editando e subindo de volta):
2.  Abra o arquivo `.env` principal do Directus.
3.  Adicione no final:
    ```env
    R2_ACCOUNT_ID=25a9f8a087b586ab2701d04b76e78579
    R2_ACCESS_KEY_ID=0fe0495e73754ce23eae5d147a670b51
    R2_SECRET_ACCESS_KEY=e9ec1fb2a072b839a02014ab68197f1d9e1045c6cbabea4aac7dc3712edd888d
    R2_BUCKET_NAME=spotgp
    ```
4.  Reinicie o Directus (`pm2 restart directus` ou `docker restart directus`).

---

## Método 2: Via Comando (PowerShell) ⌨️

Se você quer tentar apenas com comandos, siga estes 3 passos exatos:

**1. Enviar a pasta (Do seu PC)**
Abra o PowerShell na pasta do projeto Saphira e rode (copie e cole):
```powershell
scp -r ".\directus-extension\saphira-signer" root@base.spotgp.com:/root/
```
*(Isso vai colocar a pasta na raiz do usuário root no servidor)*

**2. Mover e Instalar (No Servidor)**
Acesse o servidor:
```powershell
ssh root@base.spotgp.com
```
Lá dentro, descubra onde está o Directus e mova a pasta:
```bash
# Exemplo (ajuste o caminho de destino '/directus/extensions...' conforme sua instalação):
mv /root/saphira-signer /directus/extensions/endpoints/

# Entra na pasta
cd /directus/extensions/endpoints/saphira-signer

# Instala
npm install
```

**3. Configurar e Reiniciar**
Edite o `.env` do Directus (`nano .env`) para adicionar as chaves R2 e reinicie o serviço.

---

### Se tiver problemas:
*   **"Permission denied":** Verifique se o usuário `root` tem senha certa.
*   **"Folder not found":** Você precisa descobrir onde sua AlexHost instalou o Directus. Tente rodar `find / -type d -name "extensions"` no servidor para achar.
