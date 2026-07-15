// Emoji ilustrativo por tipo de espaço, inferido do nome (não há campo de
// categoria no modelo). Comparação sem acentos para casar "salão"/"salao" etc.

const EMOJI_BY_KEYWORD: [string[], string][] = [
  [['festa', 'salao', 'evento', 'confraterniza'], '🎉'],
  [['churrasqueira', 'churrasco', 'gourmet'], '🍖'],
  [['piscina'], '🏊'],
  [['quadra', 'esporte', 'futebol', 'society'], '⚽'],
  [['tenis'], '🎾'],
  [['academia', 'fitness', 'ginastica'], '🏋️'],
  [['jardim', 'ar livre', 'parque', 'praca', 'externo', 'externa'], '🌳'],
  [['brinquedoteca', 'playground', 'infantil'], '🧸'],
  [['auditorio', 'palestra', 'teatro'], '🎤'],
  [['cinema'], '🎬'],
  [['reuniao', 'reunioes', 'escritorio', 'coworking', 'sala'], '💼'],
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/** Emoji para um espaço a partir do nome; prédio genérico como fallback. */
export function spaceEmoji(name: string | undefined): string {
  if (!name) return '🏢';
  const normalized = normalize(name);
  for (const [keywords, emoji] of EMOJI_BY_KEYWORD) {
    if (keywords.some((keyword) => normalized.includes(keyword))) return emoji;
  }
  return '🏢';
}
