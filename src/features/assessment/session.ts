"use client";
/**
 * Estado del visitante. Vive en sessionStorage: se borra al cerrar la pestaña
 * y nunca se guarda en nuestros servidores sin una cuenta y consentimiento.
 */
import type { Onboarding, ResponseRecord } from "@/domain/methodology/types";

const KEY = "project.assessment.v1";

export type SessionState = { onboarding: Onboarding; responses: ResponseRecord[]; finished?: boolean };

export function loadSession(): SessionState | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionState) : null;
  } catch {
    return null;
  }
}

export function saveSession(s: SessionState) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* modo privado / almacenamiento lleno: el test sigue en memoria */
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}
