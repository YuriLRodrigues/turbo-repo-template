/**
 * The words of the page in Brazilian Portuguese, the default language. The `Dictionary` type comes from this object:
 * every other language must have exactly the same keys (TypeScript says which one is missing).
 */
export const pt = {
  meta: {
    tagline: 'comece o produto, não o encanamento',
    description:
      'Contas, sessões, preferências e um design system já prontos, para que o primeiro dia vá para o que torna o seu produto diferente.',
    ogImageAlt: 'O nome do produto e a frase "Comece o produto, não o encanamento." sobre um fundo escuro',
  },
  nav: {
    home: 'voltar ao início',
    sections: 'Seções',
    footer: 'Rodapé',
    features: 'Recursos',
    howItWorks: 'Como funciona',
    faq: 'Perguntas',
    signIn: 'Entrar',
    start: 'Comece grátis',
    language: 'Idioma',
    useLight: 'Usar o tema claro',
    useDark: 'Usar o tema escuro',
  },
  hero: {
    badge: 'Acesso antecipado aberto',
    title: 'Comece o produto,',
    titleAccent: 'não o encanamento.',
    lead: 'Contas, sessões, preferências e um design system já prontos, para que o primeiro dia vá para o que torna o seu produto diferente.',
    primary: 'Comece grátis',
    secondary: 'Veja o que já vem pronto',
  },
  features: {
    eyebrow: 'Recursos',
    title: 'O que já está lá no primeiro dia',
    lead: 'As partes que todo produto precisa e ninguém quer construir duas vezes.',
    items: [
      {
        title: 'Contas prontas',
        text: 'Cadastro, login, confirmação de e-mail, troca de senha e sessões que você vê e encerra.',
      },
      {
        title: 'Seguro por padrão',
        text: 'Token de acesso curto, token de renovação rotativo em cookie httpOnly e detecção de reuso.',
      },
      {
        title: 'O visual que a pessoa escolhe',
        text: 'Claro e escuro, seis cores de destaque e duas densidades, salvos na conta e aplicados antes da primeira pintura.',
      },
      {
        title: 'Arquitetura limpa',
        text: 'Casos de uso, entidades e portas na API; cada regra testada sem um framework no caminho.',
      },
      {
        title: 'Gráficos que seguem o tema',
        text: 'Nove gráficos configuráveis em Recharts, com as mesmas cores do resto da interface.',
      },
      {
        title: 'Rápido de publicar',
        text: 'Export estático para o app e para esta página, uma API e checagens em todo commit.',
      },
    ],
  },
  howItWorks: {
    eyebrow: 'Como funciona',
    title: 'Três passos, um minuto',
    steps: [
      { title: 'Crie sua conta', text: 'Um nome, um e-mail e uma senha. Sem cartão.' },
      { title: 'Deixe do seu jeito', text: 'Escolha o tema e a cor: eles acompanham você em todo aparelho.' },
      {
        title: 'Comece a trabalhar',
        text: 'Tudo o que você escreve é seu: baixe ou apague quando quiser.',
      },
    ],
  },
  faq: {
    eyebrow: 'Perguntas',
    title: 'As perguntas de sempre',
    items: [
      {
        question: 'Existe um plano grátis?',
        answer: 'Sim. Comece grátis e decida depois; nada é cobrado sem perguntar.',
      },
      {
        question: 'Posso levar meus dados comigo?',
        answer: 'Sempre. Um botão baixa tudo o que a conta tem em um arquivo JSON.',
      },
      {
        question: 'O que acontece quando eu apago a conta?',
        answer: 'Tudo o que pertence a ela é apagado de vez, na hora. Não dá para desfazer.',
      },
    ],
  },
  closing: {
    title: 'Pronto quando você estiver.',
    cta: 'Crie sua conta',
  },
  footer: {
    rights: 'Todos os direitos reservados.',
  },
  notFound: {
    title: 'Esta página não existe',
    text: 'O endereço pode estar errado, ou a página mudou de lugar.',
    back: 'Voltar ao início',
  },
}

export type Dictionary = typeof pt
