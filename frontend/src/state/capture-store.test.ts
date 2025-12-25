import { describe, expect, it } from 'vitest'
import { createCaptureStore, type DetectionBoxInput } from './capture-store'

const mockBoxes: DetectionBoxInput[] = [
  { id: 'small', bounds: { x: 0.1, y: 0.1, width: 0.15, height: 0.12 } },
  { id: 'medium', bounds: { x: 0.2, y: 0.2, width: 0.25, height: 0.3 } },
  { id: 'large', bounds: { x: 0.05, y: 0.05, width: 0.45, height: 0.35 } },
]

describe('capture store selection logic', () => {
  it('selects the box with the largest area by default', () => {
    const store = createCaptureStore()
    store.getState().setDetectionBoxes(mockBoxes)

    expect(store.getState().selectedBoxId).toBe('large')
  })

  it('updates the selected box when a valid ID is chosen', () => {
    const store = createCaptureStore()
    store.getState().setDetectionBoxes(mockBoxes)

    store.getState().selectBox('medium')
    expect(store.getState().selectedBoxId).toBe('medium')

    store.getState().selectBox('missing')
    expect(store.getState().selectedBoxId).toBe('medium')
  })
})

