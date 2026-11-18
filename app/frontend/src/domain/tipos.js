// Tipos de problema do Vizi, conforme docs/contrato-dados.md do projeto de Edge.
// energia, sinal, alagamento e sensor vêm do sensor; agua e transito só de relato de morador.

export const TIPOS = {
  energia: { id: 'energia', rotulo: 'Energia', titulo: 'Sem energia', cor: 'var(--energia)', icone: 'energia' },
  sinal: { id: 'sinal', rotulo: 'Sinal', titulo: 'Sem sinal de celular', cor: 'var(--sinal)', icone: 'sinal' },
  agua: { id: 'agua', rotulo: 'Água', titulo: 'Falta d’água', cor: 'var(--agua)', icone: 'agua' },
  alagamento: { id: 'alagamento', rotulo: 'Alagamento', curto: 'Alag.', titulo: 'Alagamento', cor: 'var(--alag)', icone: 'alagamento' },
  transito: { id: 'transito', rotulo: 'Trânsito', titulo: 'Trânsito parado', cor: 'var(--trans)', icone: 'transito' },
  sensor: { id: 'sensor', rotulo: 'Sensor', titulo: 'Sensor sem comunicação', cor: 'var(--sensor)', icone: 'sensor' },
}

// Tipos que o morador pode relatar (o tipo "sensor" é só automático).
export const TIPOS_RELATO = ['energia', 'sinal', 'agua', 'alagamento', 'transito']

// Filtros do mapa, na ordem do protótipo.
export const FILTROS_MAPA = ['todos', 'energia', 'sinal', 'agua', 'alagamento', 'transito']

export const GRAVIDADES = {
  baixa: { id: 'baixa', rotulo: 'Leve' },
  media: { id: 'media', rotulo: 'Média' },
  alta: { id: 'alta', rotulo: 'Alta' },
}

export const STATUS = {
  detectado: { rotulo: 'Detectado pelo sensor', tom: 'warn' },
  aberto: { rotulo: 'Aguardando vizinhos', tom: 'warn' },
  confirmado: { rotulo: 'Confirmado', tom: 'ok' },
  resolvido: { rotulo: 'Já voltou', tom: 'neutro' },
}

export function infoTipo(tipo) {
  return TIPOS[tipo] ?? TIPOS.sensor
}
