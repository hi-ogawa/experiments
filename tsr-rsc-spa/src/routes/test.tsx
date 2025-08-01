import { createFileRoute } from '@tanstack/react-router'
import { tsrRscComponent, tsrRscLoader } from '../framework/client'

export const Route = createFileRoute('/test')({
  loader: tsrRscLoader as any,
  component: tsrRscComponent,
})
