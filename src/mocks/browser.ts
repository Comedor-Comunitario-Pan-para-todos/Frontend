import { setupWorker } from 'msw/browser'
import { handlers } from './handlers.ts'

export async function iniciarMocks(): Promise<void> {
  await setupWorker(...handlers).start({ onUnhandledFrame: 'bypass' })
}
