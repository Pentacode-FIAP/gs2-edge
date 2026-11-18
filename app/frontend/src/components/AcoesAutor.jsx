import { useState } from 'react'
import Botao from './Botao'
import Icone from './Icone'

// Ações de quem fez o aviso: editar, encerrar e apagar (com confirmação na própria tela).
export default function AcoesAutor({ relatoId, ativo, salvando, aoEncerrar, aoExcluir }) {
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  return (
    <section aria-labelledby="titulo-autor" className="rounded-lg border border-line bg-card p-4">
      <h2 id="titulo-autor" className="font-bold">
        Seu aviso
      </h2>
      <p className="mb-3 text-sm text-mut">Só este aparelho pode mudar ou apagar este aviso.</p>

      <div className="flex flex-col gap-2">
        {ativo && (
          <>
            <Botao variante="secundario" para={`/relatos/${relatoId}/editar`}>
              <Icone nome="editar" className="size-4" />
              Editar aviso
            </Botao>
            <Botao variante="contorno" onClick={aoEncerrar} disabled={salvando}>
              <Icone nome="check" className="size-4" />
              O serviço voltou, encerrar aviso
            </Botao>
          </>
        )}

        {confirmandoExclusao ? (
          <div role="alert" className="rounded-lg border border-bad/30 bg-badbg p-3">
            <p className="mb-2 text-sm font-semibold text-bad">Apagar este aviso? Isso não pode ser desfeito.</p>
            <div className="grid grid-cols-2 gap-2">
              <Botao variante="contorno" className="bg-card" onClick={() => setConfirmandoExclusao(false)}>
                Cancelar
              </Botao>
              <Botao variante="perigo" className="bg-card" onClick={aoExcluir} disabled={salvando}>
                {salvando ? 'Apagando…' : 'Sim, apagar'}
              </Botao>
            </div>
          </div>
        ) : (
          <Botao variante="perigo" onClick={() => setConfirmandoExclusao(true)}>
            <Icone nome="lixeira" className="size-4" />
            Apagar aviso
          </Botao>
        )}
      </div>
    </section>
  )
}
