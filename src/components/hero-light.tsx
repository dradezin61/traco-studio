/**
 * Luz de esquadria: três faixas diagonais e uma travessa, como o sol
 * atravessando uma janela e batendo na parede. Puramente decorativa — sai da
 * árvore acessível e não recebe cliques —, entra uma vez e fica parada.
 *
 * No celular a geometria é simplificada e empurrada para o alto, longe dos
 * parágrafos e dos botões.
 */
export function HeroLight() {
  const faixas = [
    { left: "52%", width: "16%", atraso: "0ms", opacidade: 1 },
    { left: "68%", width: "9%", atraso: "160ms", opacidade: 0.85 },
    { left: "80%", width: "22%", atraso: "320ms", opacidade: 0.7 },
  ];

  return (
    <div aria-hidden="true" className="luz-janela">
      {faixas.map((faixa, indice) => (
        <span
          key={faixa.left}
          className={`luz-faixa ${indice === 1 ? "hidden sm:block" : ""}`}
          style={{
            left: faixa.left,
            width: faixa.width,
            opacity: faixa.opacidade,
            animationDelay: faixa.atraso,
          }}
        />
      ))}

      <span
        className="luz-travessa hidden sm:block"
        style={{ top: "38%", left: "46%", width: "62%", animationDelay: "240ms" }}
      />

      {/* Clareia o canto superior direito, dando direção à luz. */}
      <span
        className="absolute -right-24 -top-32 size-[28rem] rounded-full opacity-70"
        style={{ background: "radial-gradient(closest-side, rgba(248,245,239,0.9), transparent)" }}
      />
    </div>
  );
}
