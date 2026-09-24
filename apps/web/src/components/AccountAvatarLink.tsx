import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserProfile } from '../lib/userProfile.js';

/** Avatar do tutor compartilhado por todos os cabeçalhos do app. */
export function AccountAvatarLink() {
  const profile = getUserProfile();
  const [imageFailed, setImageFailed] = useState(false);
  const avatarUrl = profile?.avatarUrl ?? '';
  const initial = (profile?.name || 'F').trim().charAt(0).toUpperCase() || 'F';
  const showImage = Boolean(avatarUrl) && !imageFailed;

  return (
    <Link to="/conta" className="avatar-button" aria-label="Abrir Minha conta">
      {showImage ? (
        <img src={avatarUrl} alt="" onError={() => setImageFailed(true)} />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </Link>
  );
}
