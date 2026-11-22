import type { Dictionary } from './pt'

export const es: Dictionary = {
  meta: {
    tagline: 'empieza el producto, no la fontanería',
    description:
      'Cuentas, sesiones, preferencias y un sistema de diseño ya listos, para que el primer día vaya a lo que hace distinto a tu producto.',
    ogImageAlt: 'El nombre del producto y la frase "Empieza el producto, no la fontanería." sobre un fondo oscuro',
  },
  nav: {
    home: 'volver al inicio',
    sections: 'Secciones',
    footer: 'Pie de página',
    features: 'Funciones',
    howItWorks: 'Cómo funciona',
    faq: 'Preguntas',
    signIn: 'Iniciar sesión',
    start: 'Empieza gratis',
    language: 'Idioma',
    useLight: 'Usar el tema claro',
    useDark: 'Usar el tema oscuro',
  },
  hero: {
    badge: 'Acceso anticipado abierto',
    title: 'Empieza el producto, no la fontanería.',
    lead: 'Cuentas, sesiones, preferencias y un sistema de diseño ya listos, para que el primer día vaya a lo que hace distinto a tu producto.',
    primary: 'Empieza gratis',
    secondary: 'Mira lo que ya viene incluido',
  },
  features: {
    eyebrow: 'Funciones',
    title: 'Lo que ya está ahí el primer día',
    lead: 'Las piezas que todo producto necesita y nadie quiere construir dos veces.',
    items: [
      {
        title: 'Cuentas resueltas',
        text: 'Registro, inicio de sesión, confirmación de correo, cambio de contraseña y sesiones que puedes ver y cerrar.',
      },
      {
        title: 'Seguro por defecto',
        text: 'Token de acceso corto, token de renovación rotativo en una cookie httpOnly y detección de reutilización.',
      },
      {
        title: 'El aspecto que cada persona elige',
        text: 'Claro y oscuro, seis colores de acento y dos densidades, guardados en la cuenta y aplicados antes del primer pintado.',
      },
      {
        title: 'Arquitectura limpia',
        text: 'Casos de uso, entidades y puertos en la API; cada regla probada sin un framework en medio.',
      },
      {
        title: 'Gráficos que siguen el tema',
        text: 'Nueve gráficos configurables sobre Recharts, con los mismos colores que el resto de la interfaz.',
      },
      {
        title: 'Rápido de publicar',
        text: 'Exportación estática para la app y para esta página, una API y comprobaciones en cada commit.',
      },
    ],
  },
  howItWorks: {
    eyebrow: 'Cómo funciona',
    title: 'Tres pasos, un minuto',
    steps: [
      { title: 'Crea tu cuenta', text: 'Un nombre, un correo y una contraseña. Sin tarjeta.' },
      { title: 'Hazla tuya', text: 'Elige el tema y el color: te acompañan en cada dispositivo.' },
      {
        title: 'Empieza a trabajar',
        text: 'Todo lo que escribes es tuyo: descárgalo o bórralo cuando quieras.',
      },
    ],
  },
  faq: {
    eyebrow: 'Preguntas',
    title: 'Las preguntas de siempre',
    items: [
      {
        question: '¿Hay un plan gratuito?',
        answer: 'Sí. Empieza gratis y decide después; nada se cobra sin preguntar.',
      },
      {
        question: '¿Puedo llevarme mis datos?',
        answer: 'Siempre. Un botón descarga todo lo que tiene la cuenta en un archivo JSON.',
      },
      {
        question: '¿Qué pasa cuando borro mi cuenta?',
        answer: 'Todo lo que le pertenece se borra para siempre, al instante. No se puede deshacer.',
      },
    ],
  },
  closing: {
    title: 'Listo cuando tú lo estés.',
    cta: 'Crea tu cuenta',
  },
  footer: {
    rights: 'Todos los derechos reservados.',
  },
  notFound: {
    title: 'Esta página no existe',
    text: 'La dirección puede estar mal escrita, o la página cambió de lugar.',
    back: 'Volver al inicio',
  },
}
