import { Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { LanguagesProvider } from './components/LanguagesProvider'
import { HomePage } from './pages/HomePage'
import { WorkflowPage } from './pages/WorkflowPage'
import { BatchPage } from './pages/BatchPage'
import { NotFoundPage } from './pages/NotFoundPage'

function App() {
  return (
    <LanguagesProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="check" element={<WorkflowPage />} />
          <Route path="batch" element={<BatchPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </LanguagesProvider>
  )
}

export default App
