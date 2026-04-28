import "./status-pages.css";

export default function LoadingPage(): JSX.Element {
  return (
    <main>
      <section className="status-card" role="status" aria-live="polite">
        <h2>Cargando contenido</h2>
        <p>Estamos preparando la informacion para mostrarte las propiedades.</p>
      </section>
    </main>
  );
}
