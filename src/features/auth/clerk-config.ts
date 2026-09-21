// Apariencia y textos de los componentes de Clerk (ingreso y registro).
//
// Vive en un solo lugar para que el login y el registro sean idénticos: antes
// el registro caía en la página hospedada de Clerk, en inglés y sin marca.

import type { ComponentProps } from "react";
import type { ClerkProvider } from "@clerk/clerk-react";
import { esUY } from "@clerk/localizations/es-UY";

type Apariencia = ComponentProps<typeof ClerkProvider>["appearance"];

// Uruguay y no España o México: es la única variante con voseo ("Iniciá
// sesión", "¿No tenés una cuenta?"), que es como hablamos acá.
export const localizacion: typeof esUY = {
  ...esUY,
  signIn: {
    ...esUY.signIn,
    start: {
      ...esUY.signIn?.start,
      title: "Ingresá a tu cuenta",
      subtitle: "Qué bueno verte de nuevo.",
    },
  },
  signUp: {
    ...esUY.signUp,
    start: {
      ...esUY.signUp?.start,
      title: "Abrí tu cuenta",
      subtitle: "Es gratis y te lleva menos de un minuto.",
    },
  },
};

export const aparienciaClerk: Apariencia = {
  // Con Tailwind v4 los estilos de Clerk quedan fuera de las capas y les ganan
  // a nuestras clases. Metiéndolos en una capa propia, declarada antes de
  // `utilities` en tailwind.css, las clases de abajo sí se aplican.
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "#A855F7",
    colorBackground: "#1C0B2E",
    colorText: "#F5F3FF",
    colorTextSecondary: "#C4B5FD",
    colorInputBackground: "#2D1548",
    colorInputText: "#F5F3FF",
    colorNeutral: "#E9D5FF",
    colorDanger: "#F87171",
    borderRadius: "0.75rem",
    fontFamily: "inherit",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-2xl shadow-black/40 border border-primary/25",
    card: "bg-[#1C0B2E]",
    headerTitle: "text-xl",
    formFieldInput: "border-primary/25 focus:border-primary",
    formButtonPrimary:
      "bg-gradient-to-r from-[#A855F7] to-[#7C3AED] hover:from-[#9333EA] hover:to-[#6D28D9] shadow-lg shadow-purple-900/40",
    footer: "bg-[#170926]",
    footerActionLink: "text-purple-300 hover:text-purple-200 font-medium",
  },
};
