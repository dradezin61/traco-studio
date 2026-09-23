const success = {
  briefing_enviado: "Recebemos seu pedido. O estúdio responde em até dois dias úteis.",
  briefing_atualizado: "Andamento atualizado.",
  aviso_reenviado: "Aviso reenviado para o estúdio.",
  projeto_salvo: "Projeto salvo.",
  projeto_removido: "Projeto removido.",
  foto_enviada: "Fotografia enviada.",
  foto_removida: "Fotografia removida.",
  capa_definida: "Capa atualizada.",
} as const;

const errors = {
  dados_invalidos: "Confira os dados do formulário.",
  nome_invalido: "Informe seu nome completo.",
  email_invalido: "Informe um e-mail válido.",
  mensagem_curta: "Conte um pouco mais sobre o que você precisa.",
  muitas_mensagens: "Você acabou de enviar um pedido. Aguarde alguns minutos para enviar outro.",
  arquivo_invalido: "Envie imagens em JPG, PNG, WebP ou AVIF, de até 6 MB cada.",
  muitos_arquivos: "Anexe no máximo 6 imagens.",
  briefing_nao_encontrado: "Pedido não encontrado.",
  projeto_nao_encontrado: "Projeto não encontrado.",
  imagem_nao_encontrada: "Fotografia não encontrada.",
  titulo_invalido: "Dê um título ao projeto.",
  forbidden: "Você não tem permissão para essa ação.",
  credenciais: "E-mail ou senha incorretos.",
  erro_inesperado: "Algo deu errado. Tente de novo em instantes.",
} as const;

export type SuccessCode = keyof typeof success;
export type ErrorCode = keyof typeof errors;

export function successMessage(code: string | undefined) {
  return code && code in success ? success[code as SuccessCode] : null;
}

export function errorMessage(code: string | undefined) {
  if (!code) return null;
  return code in errors ? errors[code as ErrorCode] : errors.erro_inesperado;
}

/** As funções do banco lançam o código da regra violada como mensagem de erro. */
export function errorCodeFrom(error: { message?: string } | null): ErrorCode {
  const message = error?.message ?? "";
  const code = (Object.keys(errors) as ErrorCode[]).find((key) => message.includes(key));
  return code ?? "erro_inesperado";
}
