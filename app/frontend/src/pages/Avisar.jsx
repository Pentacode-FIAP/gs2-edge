import { useNavigate, useParams } from 'react-router'
import CabecalhoPagina from '../components/CabecalhoPagina'
import { Carregando, Erro, Vazio } from '../components/Estados'
import FormularioRelato from '../components/FormularioRelato'
import { REGRAS } from '../config'
import { aplicarEdicao, ehAutor, estaAtivo, relatoParaForm } from '../domain/relatos'
import { useAparelho } from '../hooks/useAparelho'
import { useNovoRelato } from '../hooks/useNovoRelato'
import { useRelato } from '../hooks/useRelato'
import { useToast } from '../hooks/useToast'

// A mesma tela cria (/avisar) e edita (/relatos/:id/editar) um aviso.
export default function Avisar() {
  const { id } = useParams()
  return id ? <EditarAviso id={id} /> : <NovoAviso />
}

function NovoAviso() {
  const { criar, salvando } = useNovoRelato()
  const mostrarToast = useToast()
  const navegar = useNavigate()

  async function enviar(form) {
    try {
      const criado = await criar(form)
      mostrarToast('Pronto! Seu aviso já está no mapa.')
      navegar(`/relatos/${criado.id}`)
    } catch (erro) {
      mostrarToast(erro.message, 'erro')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <CabecalhoPagina titulo="Avisar um problema" subtitulo="Leva menos de 1 minuto." voltarPara="/" />
      <FormularioRelato
        rotuloEnviar="Enviar aviso"
        salvando={salvando}
        aoEnviar={enviar}
        rodape={
          <p className="text-center text-sm text-mut">
            Seu aviso aparece no mapa na hora. Se mais {REGRAS.confirmacoesParaConfirmar} vizinhos confirmarem, ele fica
            marcado como confirmado.
          </p>
        }
      />
    </div>
  )
}

function EditarAviso({ id }) {
  const { relato, carregando, erro, salvando, recarregar, salvar } = useRelato(id)
  const { aparelhoId } = useAparelho()
  const mostrarToast = useToast()
  const navegar = useNavigate()

  async function enviar(form) {
    try {
      await salvar(aplicarEdicao(relato, form))
      mostrarToast('Aviso atualizado.')
      navegar(`/relatos/${id}`)
    } catch (e) {
      mostrarToast(e.message, 'erro')
    }
  }

  let conteudo
  if (carregando) conteudo = <Carregando />
  else if (erro) conteudo = <Erro erro={erro} aoTentarDeNovo={recarregar} />
  else if (!ehAutor(relato, aparelhoId)) {
    conteudo = <Vazio titulo="Só quem fez o aviso pode editar">Você ainda pode confirmar ou negar na tela do aviso.</Vazio>
  } else if (!estaAtivo(relato)) {
    conteudo = <Vazio titulo="Esse aviso já foi encerrado">Se o problema voltou, faça um aviso novo.</Vazio>
  } else {
    conteudo = (
      <FormularioRelato key={relato.id} inicial={relatoParaForm(relato)} rotuloEnviar="Salvar alterações" salvando={salvando} aoEnviar={enviar} />
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <CabecalhoPagina titulo="Editar aviso" subtitulo="Corrija o tipo, a gravidade ou o lugar." voltarPara={`/relatos/${id}`} rotuloVoltar="Aviso" />
      {conteudo}
    </div>
  )
}
