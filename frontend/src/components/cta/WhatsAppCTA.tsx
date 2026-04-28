import styles from "./WhatsAppCTA.module.css";

type WhatsAppCTAProps = {
  href: string;
  label?: string;
};

export function WhatsAppCTA({ href, label = "Consultar por WhatsApp" }: WhatsAppCTAProps): JSX.Element {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={styles.button}>
      {label}
    </a>
  );
}
