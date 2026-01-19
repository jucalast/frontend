"use client"

import { FormEvent, useState } from "react"
import { StructuredSummary } from "@/components/StructuredSummary"

type SearchResponse = {
  structured: Record<string, any> | null
  sources: string[]
  rawOutput: string
}

export default function Home() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<SearchResponse | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!query.trim()) {
      setError("Informe um termo de pesquisa válido.")
      return
    }
    setLoading(true)
    setError(null)
    setData(null)

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, verbose: false, listSources: true }),
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload?.error || "Falha inesperada")
      }

      const payload: SearchResponse = await response.json()
      console.log('Frontend received:', payload)
      setData(payload)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha na requisição")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
        <header className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-zinc-600">Buscador Resumido</p>
          <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
            Resuma em segundos qualquer assunto com DuckDuckGo + Groq.
          </h1>
          <p className="text-lg text-zinc-400">
            Digite um tema, toque em buscar e receba uma narrativa curta com os links utilizados como fonte.
          </p>
        </header>

        <form
          className="grid gap-4 rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/80"
          onSubmit={handleSubmit}
        >
          <label className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-600" htmlFor="query">
            Termo de busca
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="query"
              value={query}
              placeholder="Ex: tendências de IA para 2026"
              onChange={(event) => setQuery(event.target.value)}
              className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white shadow-inner shadow-black/40 focus:border-emerald-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-lime-400 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-950 transition duration-200 disabled:opacity-60"
            >
              {loading ? "Processando..." : "Buscar"}
            </button>
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
        </form>

        <section className="space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl shadow-black/60">
            <p className="text-xs uppercase tracking-[0.5em] text-zinc-600">Resumo</p>
            <div className="mt-3 min-h-[120px] text-sm leading-relaxed">
              {data ? (
                data.structured ? (
                  <StructuredSummary data={data.structured} />
                ) : (
                  <p className="text-zinc-500">
                    Nenhuma análise estruturada foi gerada. Tente habilitar o Groq ou usar termos mais específicos.
                  </p>
                )
              ) : (
                <p className="text-zinc-500">
                  Nenhum resumo ainda. Envie um termo e aguarde a mágica acontecer.
                </p>
              )}
            </div>
          </div>

          {data && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-lg shadow-black/40">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-zinc-600">Fontes</h2>
                <span className="text-[0.65rem] uppercase tracking-[0.4em] text-emerald-400">
                  {data.sources.length} links
                </span>
              </div>
              {data.sources.length > 0 ? (
                <ul className="space-y-2 text-sm text-zinc-300">
                  {data.sources.map((source) => (
                    <li key={source}>
                      <a href={source} target="_blank" rel="noreferrer" className="text-emerald-300 underline-offset-4 hover:underline">
                        {source}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">Nenhuma fonte foi listada nesta busca.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
