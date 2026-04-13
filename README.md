# Nokite Hub - Gestão de Barbearia

Este é o sistema completo para gestão de barbearias e salões, construído com React, Vite, Tailwind CSS e Firebase.

## Como rodar localmente

1.  Clone o repositório:
    ```bash
    git clone <url-do-seu-repositorio>
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```

## Como fazer o Deploy na Vercel (Recomendado)

1.  Crie uma conta na [Vercel](https://vercel.com).
2.  Conecte sua conta do GitHub.
3.  Importe este repositório.
4.  A Vercel detectará automaticamente que é um projeto **Vite**.
5.  Clique em **Deploy**.

### Configuração Importante:
O arquivo `vercel.json` já está incluído para garantir que as rotas do React (como `/admin`, `/login`) funcionem corretamente ao atualizar a página.

## Firebase
O sistema utiliza o Firebase para autenticação e banco de dados. As configurações estão no arquivo `firebase-applet-config.json`. 

**Dica de Segurança:** No futuro, você pode mover essas chaves para as **Environment Variables** da Vercel para maior segurança.

---
Desenvolvido com ❤️ por Nokite Hub.
