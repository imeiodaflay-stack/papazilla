import { NavLink } from 'react-router-dom';
import petsIcon from '../assets/icons/zilla.png';
import papaIcon from '../assets/icons/potinho.png';
import curiosidadesIcon from '../assets/icons/mensagem.png';
import salvasIcon from '../assets/icons/salvo.png';

/** Navegação principal flutuante — fiel a `.app-nav` do protótipo. */
const items = [
  { to: '/zilla', label: 'Pets', icon: petsIcon },
  { to: '/papa', label: 'Papá', icon: papaIcon },
  { to: '/curiosidades', label: 'Curiosidades', icon: curiosidadesIcon },
  { to: '/receitas', label: 'Salvas', icon: salvasIcon },
] as const;

export function AppNav() {
  return (
    <nav className="app-nav" aria-label="Navegação principal">
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} className="app-nav__item">
          <img src={it.icon} alt="" />
          <span>{it.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
