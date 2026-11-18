import Botao from '../components/Botao'

export default function NaoEncontrado() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-5xl font-extrabold text-pri">404</p>
      <h1 className="mt-2 text-xl font-bold">Essa página não existe</h1>
      <p className="mt-1 text-mut">O endereço pode estar errado ou o aviso foi apagado.</p>
      <Botao para="/" className="mt-6">
        Voltar para o mapa
      </Botao>
    </div>
  )
}
