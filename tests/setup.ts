import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { servidor } from './mocks/servidor.ts'

configure({ asyncUtilTimeout: 3000 })

beforeAll(() => {
  servidor.listen({ onUnhandledFrame: 'error' })
})

afterEach(() => {
  cleanup()
  servidor.resetHandlers()
})

afterAll(() => {
  servidor.close()
})

if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
}
