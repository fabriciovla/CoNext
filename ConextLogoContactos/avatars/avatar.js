// conext — avatar por defecto, siempre el mismo para el mismo contacto
export const GHOSTS = ["a","b","c","d","e","f","g","h","i","j","k","l"];

export function ghostFor(key = '') {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 100000;
  return GHOSTS[h % GHOSTS.length];
}

// uso: <img src={`/avatars/ghost-${ghostFor(contact.phone || contact.name)}.svg`} />
export function ghostSrc(key, ext = 'svg') {
  return `/avatars/ghost-${ghostFor(key)}.${ext}`;
}
