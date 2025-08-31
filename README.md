# Keycloak Identity Provider Setup

Esta documentação detalha como configurar o Keycloak para usar qualquer Identity Provider externo com redirecionamento automático. O exemplo utiliza GitHub, mas pode ser adaptado para Google, Facebook, Azure AD, etc.

## Arquitetura do Fluxo

```
Next.js App → NextAuth → Keycloak → Identity Provider (auto) → Keycloak → NextAuth → App

```


## 1. Configuração no Identity Provider (GitHub)

### 1.1 Criar OAuth App no GitHub

1.  Acesse **GitHub** → **Settings** → **Developer settings** → **OAuth Apps**
2.  Clique em **"New OAuth App"**
3.  Preencha os dados:

    ```
    Application name: Seu App NameHomepage URL: http://localhost:3000
    Authorization callback URL: http://localhost:5050/realms/example/broker/github/endpoint
    ```


### 1.2 Obter Credenciais

Após criar o OAuth App, anote:

-   **Client ID**
-   **Client Secret**

## 2. Configuração no Keycloak

### 2.1 Verificar Client do NextAuth

Confirme que o client `next` está configurado corretamente:

1.  **Keycloak Admin Console** → **Clients** → **next**
2.  Verificar configurações:

```yaml
Client ID: next
Client Protocol: openid-connect
Access Type: confidential
Standard Flow Enabled: ON
Valid Redirect URIs: http://localhost:3000/api/auth/callback/keycloak
Web Origins: http://localhost:3000

```

### 2.2 Adicionar GitHub Identity Provider

1.  Vá em **Identity Providers**
2.  Clique em **"Add provider..."** → **GitHub**
3.  Configure:

```yaml
Alias: github
Display Name: Login with GitHub
Enabled: ON
Store Tokens: ON
Trust Email: ON
Account Linking Only: OFF
Hide on Login Page: OFF
First Login Flow: first broker login
Sync Mode: IMPORT

# OAuth Settings
Client ID: [GITHUB_CLIENT_ID]
Client Secret: [GITHUB_CLIENT_SECRET]
Default Scopes: user:email read:user

# URLs (preenchidas automaticamente pelo Keycloak)
Authorization URL: https://github.com/login/oauth/authorize
Token URL: https://github.com/login/oauth/access_token
User Info URL: https://api.github.com/user

```

### 2.3 Configurar Redirecionamento Automático

Para que os usuários sejam automaticamente redirecionados para o GitHub:

#### Método 1: Fluxo de Autenticação Personalizado

1.  **Authentication** → **Flows**
2.  Selecione **"Browser"** → **Copy**
3.  Nome: `browser-auto-github`
4.  No novo fluxo, encontre **"Identity Provider Redirector"**
5.  **Actions** → **Config**:

    ```yaml
    Alias: github-auto-redirectDefault Identity Provider: github

    ```

6.  **Realm Settings** → **Login** → **Browser Flow**: `browser-auto-github`

#### Método 2: Via NextAuth (Recomendado)

O NextAuth já está configurado para usar o parâmetro `kc_idp_hint=github` que força o redirecionamento automático.

## 3. Configuração para Outros Identity Providers

### 3.1 Google

```yaml
# No Google Cloud Console
Authorized redirect URIs: http://localhost:5050/realms/example/broker/google/endpoint

# No Keycloak
Alias: google
Client ID: [GOOGLE_CLIENT_ID]
Client Secret: [GOOGLE_CLIENT_SECRET]
Default Scopes: openid profile email

```

### 3.2 Microsoft Azure AD

```yaml
# No Azure AD
Redirect URI: http://localhost:5050/realms/example/broker/microsoft/endpoint

# No Keycloak
Alias: microsoft
Client ID: [AZURE_CLIENT_ID]
Client Secret: [AZURE_CLIENT_SECRET]
Default Scopes: openid profile email
Authorization URL: https://login.microsoftonline.com/common/oauth2/v2.0/authorize
Token URL: https://login.microsoftonline.com/common/oauth2/v2.0/token
User Info URL: https://graph.microsoft.com/oidc/userinfo

```

### 3.3 Facebook

```yaml
# No Facebook Developers
Valid OAuth Redirect URIs: http://localhost:5050/realms/example/broker/facebook/endpoint

# No Keycloak
Alias: facebook
Client ID: [FACEBOOK_APP_ID]
Client Secret: [FACEBOOK_APP_SECRET]
Default Scopes: email public_profile

```

## 4. Configurações Avançadas

### 4.1 Mapeamento de Atributos

Configure mappers para capturar dados específicos do Identity Provider:

**Identity Providers** → **[Provider]** → **Mappers**:

```yaml
# Username
Name: provider-username
Mapper Type: Attribute Importer
Claim: login (GitHub) / preferred_username (outros)
User Attribute Name: username

# Avatar/Foto
Name: provider-avatar
Mapper Type: Attribute Importer
Claim: avatar_url (GitHub) / picture (Google/Facebook)
User Attribute Name: avatar_url

# Nome Completo
Name: provider-name
Mapper Type: Attribute Importer
Claim: name
User Attribute Name: firstName

```

### 4.2 Configuração de Roles Automáticas

```yaml
# Role padrão para usuários externos
Name: default-external-role
Mapper Type: Hardcoded Role
Role: user

# Role baseada em domínio de email
Name: domain-based-role
Mapper Type: Advanced Attribute to Role
Attribute Name: email
Attribute Value: @suaempresa.com
Role: employee

```

### 4.3 Configuração de First Login Flow

Para customizar o que acontece no primeiro login:

1.  **Authentication** → **Flows** → **First Broker Login**
2.  Adicione execuções conforme necessário:
    -   **Create User If Unique**: Criar usuário se único
    -   **Automatically Set Existing User**: Vincular automaticamente
    -   **Prompt for Username**: Solicitar username


## 5. Configuração para Produção

### 5.1 Variáveis de Ambiente Produção

```env
NEXTAUTH_URL=https://seu-dominio.com
NEXTAUTH_SECRET=[NOVO_SECRET_SEGURO]
KEYCLOAK_CLIENT_ID=next
KEYCLOAK_CLIENT_SECRET=[NOVO_CLIENT_SECRET]
KEYCLOAK_ISSUER=https://keycloak.seu-dominio.com/realms/example

```

### 5.2 URLs de Callback Produção

Atualizar nos respectivos providers:

```yaml
GitHub: https://keycloak.seu-dominio.com/realms/example/broker/github/endpoint
Google: https://keycloak.seu-dominio.com/realms/example/broker/google/endpoint
NextAuth: https://seu-dominio.com/api/auth/callback/keycloak

```

### 5.3 Configurações de Segurança

```yaml
# Keycloak Realm Settings
SSL Required: external requests
Login Theme: keycloak (ou customizado)
Access Token Lifespan: 5 minutes
SSO Session Idle: 30 minutes
SSO Session Max: 10 hours

# Client Settings
Access Token Lifespan: 1 minute
Client Session Idle: 30 minutes
Client Session Max: 10 hours

```

## 6. Conclusão

Esta configuração permite:

-   ✅ **Flexibilidade**: Suporte a qualquer Identity Provider OAuth2/OpenID
-   ✅ **Transparência**: Redirecionamento automático sem interação do usuário
-   ✅ **Segurança**: Tokens gerenciados pelo Keycloak
-   ✅ **Escalabilidade**: Múltiplos providers simultâneos
-   ✅ **Manutenibilidade**: Configuração centralizada no Keycloak

O Keycloak atua como um broker de identidade, permitindo trocar ou adicionar novos providers sem alterar o código da aplicação.

----------

**Última atualização**: Agosto 2025
**Versões testadas**: Keycloak 22+, NextAuth 4.24+
