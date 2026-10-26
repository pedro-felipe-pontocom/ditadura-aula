# Ditadura 1964–1985 — aula em slides

Apresentação animada sobre a ditadura civil-militar no Brasil, do golpe de 1964 à Constituição de 1988. São 24 slides (uma capa e 23 cenas) com animação, efeitos de som sintetizados no navegador (sem arquivos de áudio) e notas para quem dá a aula.

## Como usar na aula

1. Abra o link publicado (GitHub Pages) no Chrome ou no Edge.
2. Aperte **F** para tela cheia. O primeiro slide é a **capa**: ela fica parada na tela enquanto o projetor é ajustado. A animação só começa quando você apertar →.
3. Avance com **→**, **espaço**, **PageDown** ou com um clique. Volte com **←**.
4. Aperte **N** para abrir o **modo apresentador** numa segunda janela. Ele mostra as notas de cada slide, o próximo slide e um cronômetro. Se o navegador bloquear a janela, permita pop-ups para o site.
5. **M** liga/desliga os efeitos de som. **B** apaga a tela (aperte de novo para voltar).

Alguns slides têm vários passos: cada → revela a próxima parte. No slide 12 (“O milagre”), dá para **arrastar a linha** do meio com o mouse e **clicar na TV** para mudar de canal.

Depois da primeira visita, a apresentação funciona mesmo se a internet cair.

## Rodar no próprio computador

As páginas leem arquivos JSON, então precisam de um servidor local (abrir o `index.html` direto não funciona):

```
npx serve .
```

Depois abra o endereço que aparecer (normalmente http://localhost:3000).

## Onde fica cada coisa

| Arquivo | O que tem |
|---|---|
| `content/slides.json` | Todos os textos dos slides e as notas da professora (`notas`). |
| `content/fontes.json` | As fontes de cada informação (aparecem no rodapé de cada slide). |
| `content/vitimas.json` | Os 430 nomes do memorial, da lista baseada no relatório da Comissão Nacional da Verdade (2014). |
| `css/` | Visual e animações. |
| `js/` | Navegação, efeitos e som. |

Para corrigir um texto, edite `content/slides.json` (mantenha as aspas duplas e as vírgulas) e publique de novo.

## Sobre o conteúdo

Datas, números e citações vêm das fontes que aparecem no rodapé de cada slide (lista completa em `content/fontes.json`). O que não pôde ser confirmado ficou de fora. Tanques, TV, avião, a animação “O caminho do preso”, lâmpada e vela são desenhos feitos em código. Os versos de *Os Lusíadas* são de domínio público.

### Fotos

Só fotos de arquivo com licença que permite o uso, com o crédito na tela (em `assets/fotos/`):

| Foto | Origem | Licença |
|---|---|---|
| Rubens Paiva, Vladimir Herzog e Carlos Marighella (retratos) | [Comissão da Verdade do Estado de São Paulo](https://commons.wikimedia.org/wiki/Category:Documents_relating_to_victims_of_the_repression_of_the_Brazilian_Military_Dictatorship), via Wikimedia Commons | CC BY 4.0 |
| Página do laudo de 25/10/1975 sobre a morte de Herzog (Divisão de Criminalística, SSP-SP) | [Dossiê de Vladimir Herzog da Comissão da Verdade do Estado de São Paulo](https://commons.wikimedia.org/wiki/File:001_-_Vladimir_Herzog_CEMDP_001,_CNV-SP.pdf), página 48 | CC BY 4.0 |
| Zuzu Angel em Nova York, 1972 | [Arquivo Nacional, Fundo Correio da Manhã](https://commons.wikimedia.org/wiki/File:Zuzu_Angel_durante_o_lan%C3%A7amento_de_sua_cole%C3%A7%C3%A3o_em_Nova_York,_1972.jpg), via Wikimedia Commons | domínio público |

A página do laudo mostra o corpo de Herzog na cela. Ela só aparece num passo próprio do slide 17, e as notas do modo apresentador avisam antes.

Tipografia: Big Shoulders Display, Newsreader e Courier Prime (SIL Open Font License; licenças em `assets/fonts/`).
