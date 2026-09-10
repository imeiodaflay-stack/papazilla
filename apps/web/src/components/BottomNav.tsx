import { NavLink } from 'react-router-dom';

const items = [
  { to: '/zilla', label: 'Zilla' },
  { to: '/papa', label: 'Papá' },
  { to: '/curiosidades', label: 'Curiosidades' },
  { to: '/receitas', label: 'Receitas' },
] as const;

export function BottomNav() {
  return (
    <nav className="pz-bottomnav" aria-label="Navegação principal">
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} className="pz-bottomnav__item">
          <span aria-hidden="true">●</span>
          {it.label}
        </NavLink>
      ))}
    </nav>
  );
}
