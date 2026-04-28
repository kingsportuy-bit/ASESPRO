import Link from "next/link";

type HeaderLink = {
  href: string;
  label: string;
};

type SiteHeaderProps = {
  title: string;
  subtitle: string;
  links?: HeaderLink[];
};

export function SiteHeader({ title, subtitle, links = [] }: SiteHeaderProps): JSX.Element {
  return (
    <header className="top-bar">
      <div>
        <p className="brand">ASESPRO</p>
        <h1>{title}</h1>
        <p className="subtitle">{subtitle}</p>
      </div>
      {links.length > 0 ? (
        <nav className="top-nav" aria-label="Navegacion principal">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="top-link">
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
