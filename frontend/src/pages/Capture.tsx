import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Link } from 'react-router-dom'
import {
  useCaptureStore,
  type DetectionBoxInput,
  type LabelDraft,
} from '../state/capture-store'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const categoryOptions = ['菜品', '食物', '采集', '家具', '手工艺品', '杂物']
const namePool = ['暖黄色吊灯', '旧木箱', '陶罐', '青草茶', '野莓', '木椅', '罐装果酱']
const descriptionPool = [
  '带着太阳晒过的温热气息，闻起来像夏天的谷仓。',
  '边角有些磕碰，却让人想起旧日的集市。',
  '甜香绕着鼻尖打转，像刚出炉的面包。',
  '表面覆着微尘，仿佛等待被再次使用。',
  '轻轻摇晃能听到松散的谷粒声，像在低语。',
]

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min

const createMockBoxes = (): DetectionBoxInput[] => {
  const count = 3 + Math.floor(Math.random() * 3)
  const boxes: DetectionBoxInput[] = []

  for (let index = 0; index < count; index += 1) {
    const isLargest = index === 0
    const width = isLargest ? randomBetween(0.44, 0.58) : randomBetween(0.2, 0.35)
    const height = isLargest ? randomBetween(0.32, 0.48) : randomBetween(0.16, 0.32)
    const x = randomBetween(0.04, 0.96 - width)
    const y = randomBetween(0.06, 0.95 - height)

    boxes.push({
      id: `box-${index + 1}`,
      label: isLargest ? '最大物体' : '物体',
      bounds: { x, y, width, height },
      confidence: randomBetween(0.55, 0.92),
    })
  }

  return boxes
}

const defaultTime = (): LabelDraft['time'] => {
  const now = new Date()
  return {
    hour: now.getHours(),
    minute: now.getMinutes(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  }
}

const buildInitialDraft = (box: DetectionBoxInput, index: number): LabelDraft => {
  const category = categoryOptions[index % categoryOptions.length]
  const description = descriptionPool[index % descriptionPool.length]
  const x = clamp(box.bounds.x + box.bounds.width * 0.65, 0.16, 0.84)
  const y = clamp(box.bounds.y + box.bounds.height + 0.12, 0.22, 0.9)

  return {
    name: namePool[index % namePool.length],
    category,
    description,
    energy: 60 + Math.floor(Math.random() * 60),
    health: 40 + Math.floor(Math.random() * 60),
    time: defaultTime(),
    tagPosition: { xPercent: x, yPercent: y },
    tagScale: 1,
  }
}

const clampLongEdge = (value: number) => {
  if (value < 720) return 720
  if (value > 1600) return 1600
  return 1280
}

const loadImageFromUrl = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })

const resizeImageToBounds = async (file: File) => {
  const tempUrl = URL.createObjectURL(file)
  const img = await loadImageFromUrl(tempUrl)
  URL.revokeObjectURL(tempUrl)

  const longEdge = Math.max(img.width, img.height)
  const targetLongEdge = clampLongEdge(longEdge)
  const scale = targetLongEdge / longEdge
  const targetWidth = Math.round(img.width * scale)
  const targetHeight = Math.round(img.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unsupported')
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('无法生成预览'))
          return
        }
        resolve(result)
      },
      file.type || 'image/png',
      0.92,
    )
  })

  const resizedFile = new File([blob], file.name, { type: blob.type })
  const previewUrl = URL.createObjectURL(blob)
  return { file: resizedFile, url: previewUrl, width: targetWidth, height: targetHeight }
}

const pixelateFromUrl = async (url: string, blockSize = 10) => {
  const img = await loadImageFromUrl(url)
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unsupported')
  ctx.imageSmoothingEnabled = false

  const smallW = Math.max(1, Math.round(img.width / blockSize))
  const smallH = Math.max(1, Math.round(img.height / blockSize))

  ctx.drawImage(img, 0, 0, smallW, smallH)

  const upCanvas = document.createElement('canvas')
  upCanvas.width = img.width
  upCanvas.height = img.height
  const upCtx = upCanvas.getContext('2d')
  if (!upCtx) throw new Error('canvas unsupported')
  upCtx.imageSmoothingEnabled = false
  upCtx.drawImage(canvas, 0, 0, smallW, smallH, 0, 0, img.width, img.height)

  return upCanvas.toDataURL('image/png')
}

const simulateNanoBanana = async (url: string) => {
  await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 600))
  if (Math.random() < 0.2) {
    throw new Error('模型超时')
  }
  return pixelateFromUrl(url, 8)
}

const formatTime = (hour: number, minute: number) => {
  const suffix = hour < 12 ? '上午' : '下午'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  const paddedMinute = minute.toString().padStart(2, '0')
  return `${suffix} ${displayHour}:${paddedMinute}`
}

const CapturePage = () => {
  const fileInputId = 'capture-upload-input'
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const tagRef = useRef<HTMLDivElement | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const pixelPreviewRef = useRef<string | null>(null)
  const taskRef = useRef(0)

  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [pixelPreviewUrl, setPixelPreviewUrl] = useState<string | null>(null)
  const [isGeneratingPixel, setIsGeneratingPixel] = useState(false)
  const [generationNote, setGenerationNote] = useState<string | null>(null)
  const [descriptionLoading, setDescriptionLoading] = useState(false)
  const [resizeInfo, setResizeInfo] = useState<{ width: number; height: number } | null>(null)
  const [tagDragging, setTagDragging] = useState(false)

  const uploadFile = useCaptureStore((state) => state.uploadFile)
  const previewUrl = useCaptureStore((state) => state.previewUrl)
  const detectionBoxes = useCaptureStore((state) => state.detectionBoxes)
  const selectedBoxId = useCaptureStore((state) => state.selectedBoxId)
  const labelDrafts = useCaptureStore((state) => state.labelDrafts)
  const saveStatus = useCaptureStore((state) => state.saveStatus)
  const setUpload = useCaptureStore((state) => state.setUpload)
  const setDetectionBoxes = useCaptureStore((state) => state.setDetectionBoxes)
  const selectBox = useCaptureStore((state) => state.selectBox)
  const updateLabelDraft = useCaptureStore((state) => state.updateLabelDraft)
  const resetCapture = useCaptureStore((state) => state.resetCapture)
  const setSaveStatus = useCaptureStore((state) => state.setSaveStatus)

  const selectedDraft = useMemo(
    () => (selectedBoxId ? labelDrafts[selectedBoxId] : null),
    [labelDrafts, selectedBoxId],
  )

  useEffect(() => {
    if (previewUrlRef.current && previewUrlRef.current !== previewUrl && previewUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrlRef.current)
    }
    previewUrlRef.current = previewUrl
  }, [previewUrl])

  useEffect(() => {
    if (pixelPreviewRef.current && pixelPreviewRef.current !== pixelPreviewUrl && pixelPreviewRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(pixelPreviewRef.current)
    }
    pixelPreviewRef.current = pixelPreviewUrl
  }, [pixelPreviewUrl])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current && previewUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
      if (pixelPreviewRef.current && pixelPreviewRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(pixelPreviewRef.current)
      }
    }
  }, [])

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const runPixelPreview = useCallback(
    async (sourceUrl: string, taskId: number) => {
      setIsGeneratingPixel(true)
      setGenerationNote('Nano Banana 生图中...')
      try {
        const result = await simulateNanoBanana(sourceUrl)
        if (taskRef.current !== taskId) return
        setPixelPreviewUrl(result)
        setGenerationNote(null)
      } catch (error) {
        if (taskRef.current !== taskId) return
        const fallback = await pixelateFromUrl(sourceUrl, 12)
        setPixelPreviewUrl(fallback)
        setGenerationNote('模型有点忙，已切换本地像素滤镜兜底')
        console.error('Nano Banana 生成失败，使用本地像素滤镜回退', error)
      } finally {
        if (taskRef.current === taskId) {
          setIsGeneratingPixel(false)
        }
      }
    },
    [],
  )

  const acceptFile = useCallback(
    async (file: File | null) => {
      if (!file) return
      if (!file.type.startsWith('image/')) {
        setUploadError('只能上传图片文件，换一张试试吧')
        return
      }

      const newTaskId = taskRef.current + 1
      taskRef.current = newTaskId
      setGenerationNote('正在压缩尺寸并召唤像素风...')
      setUploadError(null)
      setPixelPreviewUrl(null)
      setResizeInfo(null)
      resetCapture()

      try {
        const resized = await resizeImageToBounds(file)
        if (taskRef.current !== newTaskId) return

        setResizeInfo({ width: resized.width, height: resized.height })
        setUpload(resized.file, resized.url)
        const boxes = createMockBoxes()
        setDetectionBoxes(boxes)
        boxes.forEach((box, index) => {
          updateLabelDraft(box.id, buildInitialDraft(box, index))
        })
        setSaveStatus('idle')
        await runPixelPreview(resized.url, newTaskId)
      } catch (error) {
        if (taskRef.current === newTaskId) {
          setUploadError('处理图片时出了点小差，换一张试试吧')
          setDetectionBoxes([])
          setSaveStatus('idle')
          setGenerationNote(null)
          console.error('压缩或生成预览失败', error)
        }
      }
    },
    [resetCapture, runPixelPreview, setDetectionBoxes, setSaveStatus, setUpload, updateLabelDraft],
  )

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    acceptFile(file)
    event.target.value = ''
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node)) {
      return
    }
    setIsDragging(false)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0] ?? null
    void acceptFile(file)
  }

  const handleEmptyKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleBrowseClick()
    }
  }

  const displayedPreview = pixelPreviewUrl ?? previewUrl

  const handleNameSuggestion = () => {
    if (!selectedBoxId) return
    const nextName = namePool[Math.floor(Math.random() * namePool.length)]
    updateLabelDraft(selectedBoxId, { name: nextName })
  }

  const handleCategoryChange = (category: string) => {
    if (!selectedBoxId) return
    updateLabelDraft(selectedBoxId, { category })
  }

  const handleDescriptionGenerate = async () => {
    if (!selectedBoxId) return
    setDescriptionLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 480))
    const descriptor = descriptionPool[Math.floor(Math.random() * descriptionPool.length)]
    updateLabelDraft(selectedBoxId, { description: descriptor })
    setDescriptionLoading(false)
  }

  const handleStatChange = (field: 'energy' | 'health', value: number) => {
    if (!selectedBoxId) return
    const nextValue = clamp(Math.round(value), 0, 200)
    updateLabelDraft(selectedBoxId, { [field]: nextValue })
  }

  const adjustStat = (field: 'energy' | 'health', delta: number) => {
    if (!selectedBoxId) return
    const current = selectedDraft ? selectedDraft[field] : 0
    handleStatChange(field, current + delta)
  }

  const handleTimeChange = (field: 'hour' | 'minute' | 'month' | 'day', value: number) => {
    if (!selectedBoxId) return
    const isHour = field === 'hour'
    const isMinute = field === 'minute'
    const min = field === 'month' || field === 'day' ? 1 : 0
    const max = isHour ? 23 : isMinute ? 59 : field === 'month' ? 12 : 31
    const nextValue = clamp(Math.round(value), min, max)
    const nextTime = { ...(selectedDraft?.time ?? defaultTime()), [field]: nextValue }
    updateLabelDraft(selectedBoxId, { time: nextTime })
  }

  const syncCurrentTime = () => {
    if (!selectedBoxId) return
    updateLabelDraft(selectedBoxId, { time: defaultTime() })
  }

  const handleTagPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!selectedBoxId || !previewRef.current || !tagRef.current || !selectedDraft) return
    event.preventDefault()
    const containerRect = previewRef.current.getBoundingClientRect()
    const tagRect = tagRef.current.getBoundingClientRect()
    const startX = event.clientX
    const startY = event.clientY
    const startPos = selectedDraft.tagPosition

    const halfWidthPercent = (tagRect.width / containerRect.width) / 2
    const halfHeightPercent = (tagRect.height / containerRect.height) / 2

    const handleMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      const absoluteX = startPos.xPercent * containerRect.width + deltaX
      const absoluteY = startPos.yPercent * containerRect.height + deltaY
      const nextXPercent = clamp(absoluteX / containerRect.width, halfWidthPercent, 1 - halfWidthPercent)
      const nextYPercent = clamp(absoluteY / containerRect.height, halfHeightPercent, 1 - halfHeightPercent)
      updateLabelDraft(selectedBoxId, {
        tagPosition: { xPercent: nextXPercent, yPercent: nextYPercent },
      })
    }

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      setTagDragging(false)
    }

    setTagDragging(true)
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  const handleScaleHandleDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!selectedBoxId || !previewRef.current || !tagRef.current || !selectedDraft) return
    event.preventDefault()
    event.stopPropagation()
    const containerRect = previewRef.current.getBoundingClientRect()
    const tagRect = tagRef.current.getBoundingClientRect()
    const baseWidth = tagRect.width / selectedDraft.tagScale
    const baseHeight = tagRect.height / selectedDraft.tagScale
    const startScale = selectedDraft.tagScale
    const startX = event.clientX
    const startY = event.clientY

    const handleMove = (moveEvent: PointerEvent) => {
      const delta = (moveEvent.clientX - startX + (moveEvent.clientY - startY)) / 220
      const nextScale = clamp(startScale + delta, 0.7, 1.6)
      const scaledWidth = baseWidth * nextScale
      const scaledHeight = baseHeight * nextScale
      const halfWidthPercent = scaledWidth / containerRect.width / 2
      const halfHeightPercent = scaledHeight / containerRect.height / 2

      const currentPos = useCaptureStore.getState().labelDrafts[selectedBoxId]?.tagPosition ?? {
        xPercent: 0.5,
        yPercent: 0.5,
      }

      const clampedX = clamp(currentPos.xPercent, halfWidthPercent, 1 - halfWidthPercent)
      const clampedY = clamp(currentPos.yPercent, halfHeightPercent, 1 - halfHeightPercent)

      updateLabelDraft(selectedBoxId, {
        tagScale: nextScale,
        tagPosition: { xPercent: clampedX, yPercent: clampedY },
      })
    }

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  const handleSave = () => {
    if (!displayedPreview || detectionBoxes.length === 0) return
    setSaveStatus('saving')
    setTimeout(() => {
      setSaveStatus('success')
    }, 600)
  }

  const canSave = detectionBoxes.length > 0 && !!displayedPreview && !isGeneratingPixel

  const timeState = selectedDraft?.time ?? defaultTime()
  const hourAngle = ((timeState.hour % 12) + timeState.minute / 60) * 30
  const minuteAngle = timeState.minute * 6

  return (
    <div className="page capture-page">
      <header className="page-header capture-header">
        <div>
          <p className="eyebrow">捕物界面</p>
          <h1>像素预览与三联动</h1>
          <p className="lede">
            上传后自动压缩到 720–1600px，调用 Nano Banana 模型生成像素预览；识别 mock 框默认选中最大物体，物品栏/框/表单实时联动，便签可拖拽缩放且不越界。
          </p>
        </div>
        <Link className="ghost-button return-button" to="/">
          返回主页
        </Link>
      </header>

      <div className="capture-layout">
        <div className="workspace">
          <section className="pane preview-pane">
            <div className="pane-top">
              <div className="pane-title">左侧预览区</div>
              <span className="helper-text subtle">
                {uploadFile ? `已压缩：${uploadFile.name}` : '状态：未上传'}
              </span>
            </div>

            <div className="preview-stage wood-frame">
              <div className="preview-paper paper-sheet">
                <div
                  className={`preview-canvas ${isDragging ? 'dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  ref={previewRef}
                >
                  {!displayedPreview && (
                    <div
                      className="empty-canvas interactive"
                      onKeyDown={handleEmptyKeyDown}
                      role="button"
                      tabIndex={0}
                    >
                      <label className="pixel-button primary" htmlFor={fileInputId}>
                        上传图片
                      </label>
                    </div>
                  )}

                  {displayedPreview && (
                    <img alt="上传预览" className="preview-image" src={displayedPreview} />
                  )}

                  <div className="box-layer">
                    {detectionBoxes.map((box) => (
                      <button
                        key={box.id}
                        type="button"
                        className={`box-outline ${box.id === selectedBoxId ? 'active' : ''}`}
                        style={{
                          top: `${box.bounds.y * 100}%`,
                          left: `${box.bounds.x * 100}%`,
                          width: `${box.bounds.width * 100}%`,
                          height: `${box.bounds.height * 100}%`,
                        }}
                        onClick={() => selectBox(box.id)}
                      >
                        <span className="box-label">
                          {box.label ?? '物体'} · {((box.confidence ?? 0.8) * 100).toFixed(0)}%
                        </span>
                      </button>
                    ))}
                  </div>

                  {selectedDraft && (
                    <div className="tag-layer">
                      <div
                        ref={tagRef}
                        className={`tag-card ${tagDragging ? 'dragging' : ''}`}
                        style={{
                          left: `${(selectedDraft.tagPosition?.xPercent ?? 0.5) * 100}%`,
                          top: `${(selectedDraft.tagPosition?.yPercent ?? 0.5) * 100}%`,
                          transform: `translate(-50%, -50%) scale(${selectedDraft.tagScale})`,
                        }}
                        onPointerDown={handleTagPointerDown}
                      >
                        <div className="tag-name-row">{selectedDraft.name || '未命名物品'}</div>
                        <div className="tag-divider" />
                        <div className="tag-category-text">{selectedDraft.category || '类别'}</div>
                        <div className="tag-divider thick" />
                        <div className="tag-body">
                          <p>{selectedDraft.description || '在这里写下物品的故事，或点击右侧重生按钮。'}</p>
                        </div>
                        {(selectedDraft.category === '菜品' || selectedDraft.category === '食物') && (
                          <div className="tag-stats">
                            <div className="tag-stat">
                              <span className="stat-icon energy" />
                              <span className="stat-label">+{selectedDraft.energy} 能量</span>
                            </div>
                            <div className="tag-stat">
                              <span className="stat-icon health" />
                              <span className="stat-label">+{selectedDraft.health} 生命值</span>
                            </div>
                          </div>
                        )}
                        <div className="tag-handle" onPointerDown={handleScaleHandleDown}>
                          ⤢
                        </div>
                      </div>
                    </div>
                  )}

                  {displayedPreview && (
                    <div className="time-coin-placeholder">
                      <div className="time-widget">
                        <div className="time-meta">
                          <span className="time-day">
                            {timeState.month ?? 1}月{timeState.day ?? 1}日
                          </span>
                          <span className="time-text">{formatTime(timeState.hour, timeState.minute)}</span>
                        </div>
                        <div className="clock-face">
                          <div className="clock-hand hour" style={{ transform: `rotate(${hourAngle}deg)` }} />
                          <div className="clock-hand minute" style={{ transform: `rotate(${minuteAngle}deg)` }} />
                          <div className="clock-center" />
                        </div>
                      </div>
                      <div className="coin-chip">88888888</div>
                    </div>
                  )}

                  {isGeneratingPixel && (
                    <div className="preview-status floating">
                      <span className="status-dot" />
                      正在生成像素预览...
                    </div>
                  )}

                  {generationNote && <div className="preview-status subtle">{generationNote}</div>}
                  {uploadError && <div className="upload-error">{uploadError}</div>}
                  {uploadFile && (
                    <div className="upload-file-info">
                      <span className="file-name">
                        {uploadFile.name}
                        {resizeInfo ? ` · ${resizeInfo.width}×${resizeInfo.height}` : ''}
                      </span>
                      <button className="text-button" type="button" onClick={handleBrowseClick}>
                        换图
                      </button>
                    </div>
                  )}
                  <input
                    id={fileInputId}
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className={displayedPreview ? 'sr-only' : 'file-overlay'}
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="pane editor-pane">
            <div className="pane-top">
              <div className="pane-title">右侧编辑面板</div>
              <span className="helper-text subtle">
                {selectedDraft ? '改动后左侧立即同步' : '选中一个识别框后开始编辑'}
              </span>
            </div>
            <div className="editor-stacks">
              <div className="panel-card form-placeholder rpg-panel">
                <div className="paper-sheet">
                  {selectedDraft ? (
                    <div className="form-grid">
                      <div className="form-row paper-field">
                        <span>名称</span>
                        <div className="field-with-action">
                          <input
                            className="input-wood"
                            value={selectedDraft.name}
                            onChange={(event) => updateLabelDraft(selectedBoxId!, { name: event.target.value })}
                            placeholder="给物品起个星露谷名字"
                          />
                          <button className="mini-chip" type="button" onClick={handleNameSuggestion}>
                            取名
                          </button>
                        </div>
                      </div>
                      <div className="form-row paper-field">
                        <span>类别</span>
                        <select
                          className="input-wood"
                          value={selectedDraft.category}
                          onChange={(event) => handleCategoryChange(event.target.value)}
                        >
                          {categoryOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-row paper-field">
                        <span>描述</span>
                        <div className="field-with-action">
                          <textarea
                            className="input-wood tall"
                            value={selectedDraft.description}
                            onChange={(event) => updateLabelDraft(selectedBoxId!, { description: event.target.value })}
                            placeholder="写 1–2 句星露谷口吻的描述"
                          />
                          <button
                            className="mini-chip"
                            type="button"
                            onClick={handleDescriptionGenerate}
                            disabled={descriptionLoading}
                          >
                            {descriptionLoading ? '生成中...' : '重生'}
                          </button>
                        </div>
                      </div>
                      {(selectedDraft.category === '菜品' || selectedDraft.category === '食物') && (
                        <div className="form-row split paper-field">
                          <div className="stat-ghost">
                            <span>能量</span>
                            <div className="stat-field">
                              <button
                                className="mini-chip ghost"
                                type="button"
                                onClick={() => adjustStat('energy', -5)}
                              >
                                -
                              </button>
                              <input
                                className="input-wood"
                                type="number"
                                value={selectedDraft.energy}
                                min={0}
                                max={200}
                                onChange={(event) => handleStatChange('energy', Number(event.target.value))}
                              />
                              <button
                                className="mini-chip ghost"
                                type="button"
                                onClick={() => adjustStat('energy', 5)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className="stat-ghost">
                            <span>生命值</span>
                            <div className="stat-field">
                              <button
                                className="mini-chip ghost"
                                type="button"
                                onClick={() => adjustStat('health', -5)}
                              >
                                -
                              </button>
                              <input
                                className="input-wood"
                                type="number"
                                value={selectedDraft.health}
                                min={0}
                                max={200}
                                onChange={(event) => handleStatChange('health', Number(event.target.value))}
                              />
                              <button
                                className="mini-chip ghost"
                                type="button"
                                onClick={() => adjustStat('health', 5)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="form-row paper-field">
                        <span>时间</span>
                        <div className="field-with-action">
                          <div className="time-inputs">
                            <div className="time-row">
                              <label className="time-chip">
                                <span>月</span>
                                <input
                                  className="input-wood"
                                  type="number"
                                  min={1}
                                  max={12}
                                  value={timeState.month}
                                  onChange={(event) => handleTimeChange('month', Number(event.target.value))}
                                />
                              </label>
                              <label className="time-chip">
                                <span>日</span>
                                <input
                                  className="input-wood"
                                  type="number"
                                  min={1}
                                  max={31}
                                  value={timeState.day}
                                  onChange={(event) => handleTimeChange('day', Number(event.target.value))}
                                />
                              </label>
                            </div>
                            <div className="time-row">
                              <label className="time-chip">
                                <span>时</span>
                                <input
                                  className="input-wood"
                                  type="number"
                                  min={0}
                                  max={23}
                                  value={timeState.hour}
                                  onChange={(event) => handleTimeChange('hour', Number(event.target.value))}
                                />
                              </label>
                              <label className="time-chip">
                                <span>分</span>
                                <input
                                  className="input-wood"
                                  type="number"
                                  min={0}
                                  max={59}
                                  value={timeState.minute}
                                  onChange={(event) => handleTimeChange('minute', Number(event.target.value))}
                                />
                              </label>
                            </div>
                          </div>
                          <button className="mini-chip" type="button" onClick={syncCurrentTime}>
                            同步当前时间
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="form-grid placeholder-grid">
                      <p className="helper-text">等待上传照片并选择识别框后，可在此编辑标签内容。</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="object-bar">
              <div className="object-bar-header">
                <span>物品栏</span>
                <span className="helper-text">
                  {detectionBoxes.length > 0 ? `识别到 ${detectionBoxes.length} 个物体` : '等待识别结果'}
                </span>
              </div>
          <div className="object-grid">
            {detectionBoxes.map((box, index) => (
              <button
                key={box.id}
                type="button"
                className={`object-slot ${box.id === selectedBoxId ? 'active' : ''}`}
                onClick={() => selectBox(box.id)}
              >
                <div
                  className="slot-thumb with-progress"
                  style={
                    displayedPreview
                      ? {
                          backgroundImage: `url(${displayedPreview})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }
                      : undefined
                  }
                >
                  <div className="slot-progress" style={{ width: `${Math.min(100, (box.confidence ?? 0.8) * 100)}%` }} />
                  <span className="slot-index">#{index + 1}</span>
                </div>
                <div className="slot-label">{labelDrafts[box.id]?.name || '未命名'}</div>
                <div className="slot-hint">{box.id === selectedBoxId ? '当前选中' : '点击切换'}</div>
              </button>
            ))}
          </div>
        </section>

        <div className="bottom-actions solo">
          <button
            className="pixel-button primary"
            type="button"
            onClick={handleSave}
            disabled={!canSave}
          >
            {saveStatus === 'saving' ? '保存中...' : saveStatus === 'success' ? '已保存' : '保存至珍藏箱'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CapturePage
