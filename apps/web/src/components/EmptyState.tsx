import type { ReactNode } from 'react';
import zilla from '../assets/zilla-frente.png';

/** Estado vazio padrão: ilustração do Zilla + mensagem acolhedora + ação. */
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="pz-empty pz-card">
      <img src={zilla} alt="" width={140} height={140} className="pz-empty__art" />
      <h2 className="pz-empty__title">{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  );
}
