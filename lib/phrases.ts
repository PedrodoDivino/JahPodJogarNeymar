export const NAO_JOGANDO_PHRASES = [
  "Neymar tá 'se poupando' pro próximo treino de embaixadinhas",
  "O menino tá com dor no dedinho do pé esquerdo",
  "Tá negociando contrato novo com o PSG... de novo",
  "Ficou preso no trânsito da Marginal Tietê",
  "O pai não deixou sair hoje",
  "Tá treinando chute de bicicleta no quintal de casa",
  "Só joga se tiver chuva de glitter no estádio",
  "Tá assistindo reprise do 7x1 pra se inspirar",
  "O cabelo ainda não tá no ponto, espera o gel secar",
  "Tá fazendo live de CS:GO, não perturba",
  "O Peixe tá no aquário, mas o tubarão tá de molho",
  "Vila Belmiro fechada pra balanço... de novo",
  "Tá esperando o juiz autorizar o uso de capacete",
  "O Santos tá jogando, mas o Neymar tá no modo espectador",
  "Neymar: *existe* | Técnico: *não escala*",
  "Status: 'Disponível no banco' (modo FIFA)",
  "Tá no modo 'só entro se for pênalti'",
  "CT do Santos virou spa, ele tá na sauna",
  "VAR ainda analisando se ele pode jogar hoje",
  "O coração santista bate mais forte... mas o Neymar não",
  "A nação santista espera, o Menino da Vila dorme",
  "Hoje não, amanhã talvez, semana que vem quem sabe",
  "Tá de molho pra não sujar a chuteira nova",
  "Médico disse: 'só se for no videogame'",
  "Tá assistindo tutorial de como driblar o VAR",
];

export function getRandomPhrase(): string {
  const idx = Math.floor(Math.random() * NAO_JOGANDO_PHRASES.length);
  return NAO_JOGANDO_PHRASES[idx];
}