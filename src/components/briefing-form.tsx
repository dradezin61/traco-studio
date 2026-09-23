"use client";

import { useState } from "react";

import { prepareUpload, registerUpload, removeUpload, submitBriefing } from "@/app/briefing-actions";
import { SubmitButton } from "@/components/submit-button";
import { btnGhost, btnPrimary, btnSecondary, eyebrow, input, label } from "@/components/ui";
import { briefingSteps, deadlines, environmentTypes } from "@/lib/studio";

type Anexo = {
  id: string;
  nome: string;
  tamanho: number;
  progresso: number;
  estado: "enviando" | "pronto" | "erro";
  caminho?: string;
  erro?: string;
};

const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const TAMANHO_MAXIMO = 6 * 1024 * 1024;
const MAXIMO_ARQUIVOS = 6;

const tamanhoLegivel = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

/** Envia o arquivo direto ao Storage pela URL assinada, relatando o progresso. */
function enviarComProgresso(url: string, arquivo: File, aoProgredir: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const pedido = new XMLHttpRequest();
    pedido.open("PUT", url);
    pedido.setRequestHeader("content-type", arquivo.type);
    pedido.upload.addEventListener("progress", (evento) => {
      if (evento.lengthComputable) aoProgredir(Math.round((evento.loaded / evento.total) * 100));
    });
    pedido.addEventListener("load", () =>
      pedido.status >= 200 && pedido.status < 300 ? resolve() : reject(new Error(`HTTP ${pedido.status}`)),
    );
    pedido.addEventListener("error", () => reject(new Error("rede")));
    pedido.addEventListener("abort", () => reject(new Error("cancelado")));
    pedido.send(arquivo);
  });
}

export function BriefingForm() {
  const [etapa, setEtapa] = useState(0);
  const [ambiente, setAmbiente] = useState<string>(environmentTypes[0]);
  const [area, setArea] = useState("");
  const [necessidades, setNecessidades] = useState("");
  const [prazo, setPrazo] = useState<string>(deadlines[0]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);

  const prontos = anexos.filter((a) => a.estado === "pronto");
  const enviando = anexos.some((a) => a.estado === "enviando");

  const podeAvancar =
    etapa === 0
      ? Boolean(ambiente)
      : etapa === 1
        ? necessidades.trim().length >= 10 && !enviando
        : etapa === 2
          ? Boolean(prazo)
          : nome.trim().length >= 2 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  async function receberArquivos(lista: FileList | null) {
    if (!lista?.length) return;
    setAviso(null);

    for (const arquivo of Array.from(lista)) {
      if (anexos.length + 1 > MAXIMO_ARQUIVOS) {
        setAviso(`Anexe no máximo ${MAXIMO_ARQUIVOS} imagens.`);
        break;
      }
      if (!TIPOS.includes(arquivo.type)) {
        setAviso(`"${arquivo.name}" não é uma imagem JPG, PNG, WebP ou AVIF.`);
        continue;
      }
      if (arquivo.size > TAMANHO_MAXIMO) {
        setAviso(`"${arquivo.name}" tem ${tamanhoLegivel(arquivo.size)}; o limite é 6 MB.`);
        continue;
      }

      const id = `${arquivo.name}-${arquivo.size}-${Date.now()}`;
      setAnexos((atual) => [...atual, { id, nome: arquivo.name, tamanho: arquivo.size, progresso: 0, estado: "enviando" }]);

      const atualizar = (mudanca: Partial<Anexo>) =>
        setAnexos((atual) => atual.map((a) => (a.id === id ? { ...a, ...mudanca } : a)));

      const alvo = await prepareUpload(arquivo.name, arquivo.size, arquivo.type);
      if (!alvo.ok) {
        atualizar({ estado: "erro", erro: alvo.erro === "muitos_arquivos" ? "Limite de 6 imagens" : "Arquivo recusado" });
        continue;
      }

      try {
        await enviarComProgresso(alvo.signedUrl, arquivo, (pct) => atualizar({ progresso: pct }));
        const registro = await registerUpload(alvo.path, arquivo.name, arquivo.size, arquivo.type);
        if (!registro.ok) throw new Error(registro.erro);
        atualizar({ estado: "pronto", progresso: 100, caminho: alvo.path });
      } catch {
        atualizar({ estado: "erro", erro: "Falhou ao enviar. Tente de novo." });
      }
    }
  }

  async function remover(anexo: Anexo) {
    if (anexo.caminho) await removeUpload(anexo.caminho);
    setAnexos((atual) => atual.filter((a) => a.id !== anexo.id));
  }

  return (
    <form action={submitBriefing} className="mt-8">
      {/* O servidor recebe os valores por campos ocultos; o passo a passo é só da tela. */}
      <input type="hidden" name="environmentType" value={ambiente} />
      <input type="hidden" name="areaM2" value={area} />
      <input type="hidden" name="needs" value={necessidades} />
      <input type="hidden" name="deadline" value={prazo} />
      <input type="hidden" name="name" value={nome} />
      <input type="hidden" name="email" value={email} />

      <ol className="flex flex-wrap gap-x-6 gap-y-2 border-b border-border/70 pb-4">
        {briefingSteps.map((titulo, indice) => (
          <li
            key={titulo}
            aria-current={indice === etapa ? "step" : undefined}
            className={`text-sm ${indice === etapa ? "font-medium text-foreground" : indice < etapa ? "text-muted" : "text-muted/60"}`}
          >
            <span className="tabular-nums">{indice + 1}.</span> {titulo}
          </li>
        ))}
      </ol>

      <div className="mt-8 min-h-72">
        {etapa === 0 ? (
          <fieldset>
            <legend className="font-display text-2xl">Que ambiente você quer projetar?</legend>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {environmentTypes.map((tipo) => (
                <label
                  key={tipo}
                  className={`cursor-pointer rounded-lg border px-4 py-3 text-sm transition-colors ${
                    ambiente === tipo ? "border-brand bg-brand-soft" : "border-border hover:border-foreground/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="ambiente"
                    value={tipo}
                    checked={ambiente === tipo}
                    onChange={() => setAmbiente(tipo)}
                    className="sr-only"
                  />
                  {tipo}
                </label>
              ))}
            </div>

            <div className="mt-6 max-w-48">
              <label htmlFor="area" className={label}>
                Área aproximada (m²)
              </label>
              <input
                id="area"
                inputMode="numeric"
                value={area}
                onChange={(evento) => setArea(evento.target.value.replace(/\D/g, "").slice(0, 5))}
                placeholder="opcional"
                className={`${input} mt-1.5`}
              />
            </div>
          </fieldset>
        ) : null}

        {etapa === 1 ? (
          <div>
            <label htmlFor="necessidades" className="font-display text-2xl">
              O que precisa acontecer nesse espaço?
            </label>
            <p className="mt-2 text-sm text-muted">
              Conte a rotina de quem usa, o que incomoda hoje e o que não pode faltar.
            </p>
            <textarea
              id="necessidades"
              rows={6}
              value={necessidades}
              onChange={(evento) => setNecessidades(evento.target.value.slice(0, 4000))}
              className={`${input} mt-4`}
            />
            <p className="mt-1.5 text-xs text-muted">
              {necessidades.trim().length < 10
                ? "Pelo menos 10 caracteres."
                : `${necessidades.trim().length} caracteres.`}
            </p>

            <div className="mt-8 border-t border-border/70 pt-6">
              <p className={eyebrow}>Referências (opcional)</p>
              <p className="mt-2 text-sm text-muted">
                Até {MAXIMO_ARQUIVOS} imagens de até 6 MB, em JPG, PNG, WebP ou AVIF. Elas ficam privadas: só o estúdio vê.
              </p>

              <label className={`${btnSecondary} mt-4 cursor-pointer`}>
                Escolher imagens
                <input
                  type="file"
                  accept={TIPOS.join(",")}
                  multiple
                  className="sr-only"
                  onChange={(evento) => {
                    void receberArquivos(evento.target.files);
                    evento.target.value = "";
                  }}
                />
              </label>

              {aviso ? (
                <p role="alert" className="mt-3 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
                  {aviso}
                </p>
              ) : null}

              {anexos.length > 0 ? (
                <ul className="mt-4 grid gap-2">
                  {anexos.map((anexo) => (
                    <li key={anexo.id} className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate">{anexo.nome}</span>
                        <span className="shrink-0 text-xs text-muted tabular-nums">{tamanhoLegivel(anexo.tamanho)}</span>
                        <button
                          type="button"
                          onClick={() => void remover(anexo)}
                          className="shrink-0 text-xs font-medium text-muted underline underline-offset-4 hover:text-danger"
                        >
                          Remover
                        </button>
                      </div>

                      {anexo.estado === "enviando" ? (
                        <div className="mt-2">
                          <div
                            role="progressbar"
                            aria-valuenow={anexo.progresso}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Enviando ${anexo.nome}`}
                            className="h-1.5 overflow-hidden rounded-full bg-surface-muted"
                          >
                            <div className="h-full bg-brand transition-[width]" style={{ width: `${anexo.progresso}%` }} />
                          </div>
                          <p className="mt-1 text-xs text-muted tabular-nums">Enviando… {anexo.progresso}%</p>
                        </div>
                      ) : null}

                      {anexo.estado === "pronto" ? <p className="mt-1 text-xs text-success">Enviada.</p> : null}
                      {anexo.estado === "erro" ? <p className="mt-1 text-xs text-danger">{anexo.erro}</p> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        ) : null}

        {etapa === 2 ? (
          <fieldset>
            <legend className="font-display text-2xl">Quando você gostaria de começar?</legend>
            <div className="mt-5 grid gap-2 sm:max-w-md">
              {deadlines.map((opcao) => (
                <label
                  key={opcao}
                  className={`cursor-pointer rounded-lg border px-4 py-3 text-sm transition-colors ${
                    prazo === opcao ? "border-brand bg-brand-soft" : "border-border hover:border-foreground/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="prazo"
                    value={opcao}
                    checked={prazo === opcao}
                    onChange={() => setPrazo(opcao)}
                    className="sr-only"
                  />
                  {opcao}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {etapa === 3 ? (
          <div>
            <h2 className="font-display text-2xl">Como falamos com você?</h2>
            <div className="mt-5 grid gap-4 sm:max-w-md">
              <div>
                <label htmlFor="nome" className={label}>
                  Nome
                </label>
                <input
                  id="nome"
                  value={nome}
                  onChange={(evento) => setNome(evento.target.value.slice(0, 120))}
                  autoComplete="name"
                  className={`${input} mt-1.5`}
                />
              </div>
              <div>
                <label htmlFor="email" className={label}>
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value.slice(0, 200))}
                  autoComplete="email"
                  className={`${input} mt-1.5`}
                />
              </div>
            </div>

            <dl className="mt-8 grid gap-2 border-t border-border/70 pt-5 text-sm">
              <div className="flex gap-3">
                <dt className="w-32 shrink-0 text-muted">Ambiente</dt>
                <dd>
                  {ambiente}
                  {area ? `, ${area} m²` : ""}
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-32 shrink-0 text-muted">Prazo</dt>
                <dd>{prazo}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-32 shrink-0 text-muted">Referências</dt>
                <dd>{prontos.length > 0 ? `${prontos.length} imagem(ns)` : "nenhuma"}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border/70 pt-6">
        {etapa > 0 ? (
          <button type="button" onClick={() => setEtapa((e) => e - 1)} className={btnGhost}>
            Voltar
          </button>
        ) : null}

        {etapa < briefingSteps.length - 1 ? (
          <button
            type="button"
            onClick={() => setEtapa((e) => e + 1)}
            disabled={!podeAvancar}
            className={`${btnPrimary} ${podeAvancar ? "" : "cursor-not-allowed opacity-50"}`}
          >
            Continuar
          </button>
        ) : (
          <SubmitButton className={btnPrimary} pendingLabel="Enviando…" disabled={!podeAvancar}>
            Enviar pedido
          </SubmitButton>
        )}

        {etapa === 1 && enviando ? <span className="text-sm text-muted">Aguarde o envio das imagens…</span> : null}
      </div>
    </form>
  );
}
