import { NavLink } from 'react-router-dom';
import petsIcon from '../assets/icons/zilla.png';
import papaIcon from '../assets/icons/potinho.png';
import salvasIcon from '../assets/icons/salvo.png';
import galeriaIcon from '../assets/icons/galeria.svg';
import artigosIcon from '../assets/icons/artigos.svg';

/** Navegação principal flutuante — fiel a `.app-nav` do protótipo. */
const items = [
  { to: '/zilla', label: 'Pets', icon: petsIcon },
  { to: '/papa', label: 'Papá', icon: papaIcon },
  { to: '/receitas', label: 'Salvas', icon: salvasIcon },
  { to: '/galeria', label: 'Galeria', icon: galeriaIcon },
  { to: '/artigos', label: 'Artigos', icon: artigosIcon },
] as const;

export function AppNav() {
  return (
    <nav className="app-nav" aria-label="Navegação principal">
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} className="app-nav__item" aria-label={it.label}>
          <img src={it.icon} alt="" />
          <span>{it.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
