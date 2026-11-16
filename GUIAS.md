# Guias do Papazilla (papazilla.app/guias/<slug>)

Páginas abertas, sem captura de e-mail, para distribuir materiais visuais
(guias de porção, escala de Bristol etc.). Cada guia mostra a imagem, um botão
"Baixar o guia" e o bloco de cadastro com o celular do app.

## Guias publicados

- `/guias/chihuahua`: guia de porções do Chihuahua
- `/guias/escala-de-bristol`: escala de Bristol (cocô)

## Criar um guia novo

1. Exporte a arte em PNG 1080 × 1350 (4:5).
2. Crie `apps/web/public/guias/<slug>/` com `<imagem>.png` e `<imagem>.webp`
   (mesmo nome, só muda a extensão). Slug sem acentos nem espaços.
3. Adicione uma entrada no dicionário `GUIAS` de `scripts/gerar-guias.py`:
   título, chamada, texto do bloco de cadastro, nota e o texto alternativo
   (descrição completa da imagem, para leitores de tela).
4. Rode `python3 scripts/gerar-guias.py` na raiz do repositório. Ele recria o
   `index.html` de todos os guias.
5. Commit e push. O link fica `https://papazilla.app/guias/<slug>`.

O visual compartilhado fica em `apps/web/public/guias/assets/` (`guias.css` e a
imagem do celular). A rota está em `vercel.json` (`/guias/:slug`).
Para não prometer o que o app não faz, o texto do bloco de cadastro só cita
recursos que já estão em produção.
