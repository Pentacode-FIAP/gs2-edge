import { createBrowserRouter, RouterProvider } from 'react-router'
import { Carregando } from './components/Estados'
import Layout from './components/Layout'
import ToastProvider from './components/ToastProvider'

// Cada página é carregada só quando o usuário entra nela (code splitting por rota).
const pagina = (importar) => () => importar().then((modulo) => ({ Component: modulo.default }))

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    hydrateFallbackElement: <Carregando />,
    children: [
      { index: true, lazy: pagina(() => import('./pages/Mapa')) },
      { path: 'avisar', lazy: pagina(() => import('./pages/Avisar')) },
      { path: 'relatos/:id', lazy: pagina(() => import('./pages/DetalheRelato')) },
      { path: 'relatos/:id/editar', lazy: pagina(() => import('./pages/Avisar')) },
      { path: 'alertas/:id', lazy: pagina(() => import('./pages/DetalheAlertaSensor')) },
      { path: 'bairro', lazy: pagina(() => import('./pages/Bairro')) },
      { path: 'relatorio', lazy: pagina(() => import('./pages/Relatorio')) },
      { path: '*', lazy: pagina(() => import('./pages/NaoEncontrado')) },
    ],
  },
])

export default function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  )
}
