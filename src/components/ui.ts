// Classes compartilhadas de botões, campos e superfícies.
// Cantos de 10 px, altura confortável para toque e transição de 180 ms: a
// resposta de clique é uma pressão curta, que não desloca o que está ao redor.
const base =
  "inline-flex items-center justify-center gap-2 rounded-[10px] px-5 py-3 text-sm font-medium transition-[background-color,border-color,color,transform] duration-[180ms] ease-out active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

export const btnPrimary = `${base} bg-brand text-white hover:bg-brand-strong`;
export const btnSecondary = `${base} border border-border bg-surface text-foreground hover:border-foreground/30 hover:bg-surface-muted`;
export const btnGhost = `${base} text-foreground hover:bg-surface-muted`;
export const btnDanger = `${base} border border-danger/30 bg-surface text-danger hover:bg-danger-soft`;

export const card = "rounded-[10px] border border-border bg-surface shadow-[0_1px_2px_rgba(37,43,39,0.04)]";

export const input =
  "w-full rounded-[10px] border border-border bg-surface px-3.5 py-3 text-base text-foreground shadow-[inset_0_1px_2px_rgba(37,43,39,0.05)] placeholder:text-muted/70 focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand";

export const label = "text-sm font-medium text-foreground";

/** Rótulo em caixa alta, usado com parcimônia. */
export const eyebrow = "text-xs font-semibold uppercase tracking-[0.14em] text-muted";
