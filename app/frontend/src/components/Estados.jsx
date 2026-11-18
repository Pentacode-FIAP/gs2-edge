import Botao from './Botao'
import Icone from './Icone'

// Estados de tela reutilizáveis: carregando, erro e vazio.

export function Carregando({ texto = 'Carregando…' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-10 text-mut">
      <span className="size-5 animate-spin rounded-full border-2 border-line border-t-pri" aria-hidden="true" />
      {texto}
    </div>
  )
}

export function Erro({ erro, aoTentarDeNovo, compacto = false }) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-start gap-3 rounded-lg border border-bad/30 bg-badbg text-bad ${compacto ? 'p-3' : 'p-5'}`}
    >
      <p className="flex items-start gap-2 text-sm font-semibold">
        <Icone nome="alerta" className="mt-0.5 size-4 shrink-0" />
        {erro?.message ?? 'Algo deu errado.'}
      </p>
      {aoTentarDeNovo && (
        <Botao variante="contorno" className="min-h-10 bg-card py-2 text-sm" onClick={aoTentarDeNovo}>
          <Icone nome="recarregar" className="size-4" />
          Tentar de novo
        </Botao>
      )}
    </div>
  )
}

export function Vazio({ titulo, children }) {
  return (
    <div className="rounded-lg border border-dashed border-line px-5 py-8 text-center">
      <p className="font-bold">{titulo}</p>
      {children && <div className="mt-1 text-sm text-mut">{children}</div>}
    </div>
  )
}
