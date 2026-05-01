export type InquiryType = "general" | "alquiler" | "venta" | "terreno" | "limpieza";

type InquiryPayload = {
  name: string;
  phone: string;
  inquiryType: InquiryType;
  message?: string;
};

const INQUIRY_LABEL: Record<InquiryType, string> = {
  general: "Consulta general",
  alquiler: "Interes en alquiler",
  venta: "Interes en compra/venta",
  terreno: "Interes en terreno",
  limpieza: "Servicio de limpieza",
};

export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const sanitizedPhone = sanitizePhone(phone);
  return `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(message)}`;
}

export function buildInquiryMessage({ name, phone, inquiryType, message }: InquiryPayload): string {
  const messageBody = message?.trim();
  const lines = [
    "Hola ASESPRO, quiero hacer una consulta desde la web.",
    "",
    `Tipo: ${INQUIRY_LABEL[inquiryType]}`,
    `Nombre: ${name.trim()}`,
    `Telefono de contacto: ${phone.trim()}`,
  ];

  if (messageBody) {
    lines.push("", `Detalle: ${messageBody}`);
  }

  return lines.join("\n");
}
