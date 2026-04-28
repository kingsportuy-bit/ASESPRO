"use client";

import { useId, useState } from "react";

import { buildInquiryMessage, buildWhatsAppUrl, type InquiryType } from "@/lib/whatsapp";

import styles from "./WhatsAppInquiryForm.module.css";

type WhatsAppInquiryFormProps = {
  whatsappPhone: string;
  title: string;
  hint: string;
  submitLabel: string;
  defaultInquiryType?: InquiryType;
  allowInquiryTypeSelection?: boolean;
};

export function WhatsAppInquiryForm({
  whatsappPhone,
  title,
  hint,
  submitLabel,
  defaultInquiryType = "general",
  allowInquiryTypeSelection = true,
}: WhatsAppInquiryFormProps): JSX.Element {
  const formId = useId();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [inquiryType, setInquiryType] = useState<InquiryType>(defaultInquiryType);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const nameFieldId = `${formId}-name`;
  const phoneFieldId = `${formId}-phone`;
  const inquiryTypeFieldId = `${formId}-type`;
  const messageFieldId = `${formId}-message`;
  const errorId = `${formId}-error`;
  const statusId = `${formId}-status`;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedPhone) {
      setError("Completa nombre y telefono para continuar.");
      setStatusMessage(null);
      return;
    }

    setError(null);

    const text = buildInquiryMessage({
      name: trimmedName,
      phone: trimmedPhone,
      inquiryType,
      message,
    });
    const url = buildWhatsAppUrl(whatsappPhone, text);
    window.open(url, "_blank", "noopener,noreferrer");
    setStatusMessage("Se abrio WhatsApp en una nueva pestana con el mensaje listo para enviar.");
  };

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.hint}>{hint}</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label htmlFor={nameFieldId} className={styles.field}>
          Nombre
          <input
            id={nameFieldId}
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Tu nombre"
            autoComplete="name"
            required
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? errorId : undefined}
          />
        </label>

        <label htmlFor={phoneFieldId} className={styles.field}>
          Telefono
          <input
            id={phoneFieldId}
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Tu telefono"
            autoComplete="tel"
            required
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? errorId : undefined}
          />
        </label>

        {allowInquiryTypeSelection ? (
          <label htmlFor={inquiryTypeFieldId} className={styles.field}>
            Tipo de consulta
            <select
              id={inquiryTypeFieldId}
              value={inquiryType}
              onChange={(event) => setInquiryType(event.target.value as InquiryType)}
            >
              <option value="general">General</option>
              <option value="alquiler">Alquiler</option>
              <option value="venta">Venta</option>
              <option value="limpieza">Limpieza</option>
            </select>
          </label>
        ) : null}

        <label htmlFor={messageFieldId} className={`${styles.field} ${styles.fullWidth}`}>
          Mensaje
          <textarea
            id={messageFieldId}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Contanos que estas buscando"
            aria-describedby={statusMessage ? statusId : undefined}
          />
        </label>

        {error ? (
          <p id={errorId} className={`${styles.error} ${styles.fullWidth}`} role="alert">
            {error}
          </p>
        ) : null}

        {statusMessage ? (
          <p id={statusId} className={`${styles.status} ${styles.fullWidth}`} role="status" aria-live="polite">
            {statusMessage}
          </p>
        ) : null}

        <div className={styles.fullWidth}>
          <button type="submit" className={styles.submit}>
            {submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}
