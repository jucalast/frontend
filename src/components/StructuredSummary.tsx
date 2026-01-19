import { Fragment } from "react"

type Props = {
  data: Record<string, any>
}

export function StructuredSummary({ data }: Props) {
  const renderValue = (key: string, value: any) => {
    if (typeof value === 'string') {
      return <p className="text-zinc-100">{value}</p>
    }
    if (Array.isArray(value)) {
      return (
        <ul className="list-disc list-inside space-y-1 text-zinc-200">
          {value.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      )
    }
    if (typeof value === 'object' && value !== null) {
      return (
        <div className="ml-4 space-y-2">
          {Object.entries(value).map(([subKey, subValue]) => (
            <div key={subKey}>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{subKey.replace(/_/g, ' ')}</p>
              {renderValue(subKey, subValue)}
            </div>
          ))}
        </div>
      )
    }
    return <p className="text-zinc-300">{String(value)}</p>
  }

  const fieldOrder = [
    'posicionamento',
    'principais_concorrentes',
    'diferenciais',
    'preco_medio',
    'dores_clientes',
    'pitch_rapido',
    'objections_comuns',
    'entregaveis',
    'processo_basico',
    'garantias',
    'tamanho_estimado',
    'principais_players',
    'tendencias',
    'oportunidades',
    'barreiras_entrada',
    'pitch_oportunidade',
    'historia',
    'valores',
    'market_share',
    'reputacao',
    'pitch_marca',
    'resumo',
    'tipo',
    'aviso',
  ]

  const orderedEntries = fieldOrder
    .filter(key => key in data)
    .map(key => [key, data[key]])
    .concat(
      Object.entries(data).filter(([key]) => !fieldOrder.includes(key))
    )

  return (
    <div className="space-y-4">
      {orderedEntries.map(([key, value]) => (
        <div key={key} className="border-l-2 border-emerald-400 pl-4">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-400 mb-1">
            {key.replace(/_/g, ' ')}
          </p>
          {renderValue(key, value)}
        </div>
      ))}
    </div>
  )
}
