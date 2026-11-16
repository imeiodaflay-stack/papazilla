"""Gera as páginas papazilla.app/guias/<slug>/ a partir do dicionário GUIAS.

Uso (na raiz do repositório):  python3 scripts/gerar-guias.py
Veja GUIAS.md para o passo a passo de um guia novo.
"""
import html, os, sys

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'apps', 'web', 'public', 'guias')

GUIAS = {
    'chihuahua': dict(
        image='guia-porcoes-chihuahua',
        download='papazilla-guia-porcoes-chihuahua.png',
        title='Guia de porções: Chihuahua',
        kicker='Guia de porções',
        h1='Chihuahua: quanto servir em cada fase da vida',
        description='Quanto servir para um Chihuahua em cada fase da vida: referência de volume, fórmula para filhotes e porção diária do adulto em alimentação natural.',
        og_description='Quanto servir em cada fase da vida. Grátis, para salvar e consultar na cozinha.',
        lede='Referência de volume do estômago, fórmula da porção do filhote e quanto oferecer por dia ao adulto em alimentação natural. Salve e deixe à mão na cozinha.',
        pitch_title='Quer a conta pronta para o seu cão?',
        pitch='O Papazilla organiza a cozinha de quem é chef do próprio cão: receita na medida de cada pet, lista de compras, pesos crus e prontos e a porção de cada refeição.',
        note='Referência educativa. Cada cão tem suas particularidades: ajuste conforme o escore corporal e a orientação do médico-veterinário.',
        alt='Guia de porções do Papazilla para Chihuahua. Referência de volume: 50 ml é a capacidade confortável do estômago, que pode dilatar até 8 vezes. Filhote até 4 meses: 4 ml vezes o peso em gramas dividido por 100 dá a porção por refeição; comer a cada 2 a 3 horas, por risco de hipoglicemia. Adulto em alimentação natural: 7 a 10% do peso ideal por dia, divididos em no mínimo 2 refeições; exemplo, um cão de 2 kg come de 140 a 200 g por dia. Use balança de cozinha para aplicar a fórmula.',
    ),
    'escala-de-bristol': dict(
        image='escala-de-bristol',
        download='papazilla-escala-de-bristol.png',
        title='Escala de Bristol: o guia visual do cocô',
        kicker='Guia visual',
        h1='Escala de Bristol: o que o cocô do seu cão está contando',
        description='Guia visual da Escala de Bristol para cães: os 7 tipos de fezes, do ressecado ao líquido, e quando falar com o veterinário.',
        og_description='Os 7 tipos de cocô, do ressecado ao líquido. Grátis, para salvar e consultar todo dia.',
        lede='Os sete tipos de fezes, do ressecado ao líquido, para você olhar o cocô todo dia e perceber quando o padrão muda. Salve e deixe à mão.',
        pitch_title='Mudou a comida, mudou o cocô?',
        pitch='No Papazilla você avalia cada fornalha, anota e fotografa. Antes de cozinhar de novo, consulta o que caiu bem e o que não caiu, com a receita na medida de cada pet.',
        note='Referência educativa de observação, não diagnóstico. Mudança de padrão por mais de 2 dias, sangue ou muco: fale com o médico-veterinário.',
        alt='Guia visual do Papazilla: Escala de Bristol para avaliar o formato das fezes. Tipo 1, bolinhas duras, ressecado. Tipo 2, em salsicha grumosa, ressecado. Tipo 3, em salsicha com rachaduras, ideal. Tipo 4, em salsicha lisa e macia, ideal. Tipo 5, pedaços macios, mole. Tipo 6, pastoso, mole. Tipo 7, líquido, diarreia. O ideal é entre o 3 e o 4. Mudou o padrão por mais de 2 dias, ou tem sangue ou muco? Fale com o veterinário.',
    ),
}

TEMPLATE = '''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} · Papazilla</title>
<meta name="description" content="{description}">
<meta name="theme-color" content="#FFF8F3">
<link rel="canonical" href="https://papazilla.app/guias/{slug}/">
<meta property="og:type" content="article">
<meta property="og:url" content="https://papazilla.app/guias/{slug}/">
<meta property="og:title" content="{title} · Papazilla">
<meta property="og:description" content="{og_description}">
<meta property="og:image" content="https://papazilla.app/guias/{slug}/{image}.png">
<meta property="og:image:width" content="1080">
<meta property="og:image:height" content="1350">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/icons/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Inter:wght@400;500;600&family=Nunito:wght@700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/guias/assets/guias.css">
<script>window.va=window.va||function(){{(window.vaq=window.vaq||[]).push(arguments)}};</script>
<script defer src="/_vercel/insights/script.js"></script>
</head>
<body>
<header class="top">
  <a href="/" aria-label="Papazilla, página inicial"><img src="/landing/v2/logo.png" alt="Papazilla"></a>
  <a class="enter" href="/signup">Cadastrar grátis</a>
</header>

<main>
  <div class="side">
    <p class="kicker">{kicker}</p>
    <h1>{h1}</h1>
    <p class="lede">{lede}</p>
    <div class="actions">
      <a class="btn btn-primary" href="/guias/{slug}/{image}.png" download="{download}">Baixar o guia</a>
    </div>

    <section class="pitch" aria-labelledby="pitch-title">
      <div class="pitch-copy">
      <h2 id="pitch-title">{pitch_title}</h2>
      <p>{pitch}</p>
      <a class="btn" href="/signup">Cadastrar meu cão grátis</a>
      <small>Grátis para começar. Assine só quando for cozinhar.</small>
      </div>
      <figure class="pitch-phone"><img src="/guias/assets/papazilla-receita-pronta.webp" width="572" height="1150" alt="Tela de receita pronta do app Papazilla: a fornalha da Mocha, com total da receita e quanto pesar de cada ingrediente, cru e pronto." loading="lazy" decoding="async"></figure>
    </section>

    <p class="note">{note}</p>
  </div>

  <figure class="guide" id="guia">
    <picture>
      <source srcset="/guias/{slug}/{image}.webp" type="image/webp">
      <img src="/guias/{slug}/{image}.png" width="1080" height="1350" alt="{alt}">
    </picture>
  </figure>
</main>

<footer>
  <span>© Papazilla</span>
  <a href="/">papazilla.app</a>
  <a href="https://www.instagram.com/papazilla.app/">@papazilla.app</a>
  <a href="mailto:hello@papazilla.app">Contato</a>
  <a href="/termos">Termos</a>
  <a href="/privacidade">Privacidade</a>
</footer>
</body>
</html>
'''

for slug, g in GUIAS.items():
    data = {k: html.escape(v, quote=True) for k, v in g.items()}
    os.makedirs(f'{OUT}/{slug}', exist_ok=True)
    open(f'{OUT}/{slug}/index.html', 'w', encoding='utf-8').write(TEMPLATE.format(slug=slug, **data))
    print('ok', slug)
