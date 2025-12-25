import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from 'react'
import { Link } from 'react-router-dom'
import { useCaptureStore } from '../state/capture-store'

const mockBoxes = [
  { id: 'largest', label: '最大物体', size: '约 50% 画面', style: { top: '10%', left: '12%', width: '60%', height: '55%' } },
  { id: 'mid', label: '次大物体', size: '约 25% 画面', style: { top: '22%', left: '10%', width: '32%', height: '28%' } },
  { id: 'small', label: '小物体', size: '约 12% 画面', style: { top: '62%', left: '54%', width: '20%', height: '16%' } },
]

const placeholderObjects = [
  { id: 'largest', label: '最大物体', hint: '默认选中' },
  { id: 'mid', label: '次大物体', hint: '点击可切换' },
  { id: 'small', label: '小物体', hint: '点击可切换' },
  { id: 'empty-1', label: '空格子', hint: '待识别' },
  { id: 'empty-2', label: '空格子', hint: '待识别' },
  { id: 'empty-3', label: '空格子', hint: '待识别' },
]

const CapturePage = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const uploadFile = useCaptureStore((state) => state.uploadFile)
  const previewUrl = useCaptureStore((state) => state.previewUrl)
  const setUpload = useCaptureStore((state) => state.setUpload)

  const previewUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (previewUrlRef.current && previewUrlRef.current !== previewUrl) {
      URL.revokeObjectURL(previewUrlRef.current)
    }
    previewUrlRef.current = previewUrl
  }, [previewUrl])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const acceptFile = useCallback(
    (file: File | null) => {
      if (!file) return

      if (!file.type.startsWith('image/')) {
        setError('只能上传图片文件，换一张试试吧')
        return
      }

      const nextUrl = URL.createObjectURL(file)
      setUpload(file, nextUrl)
      setError(null)
    },
    [setUpload],
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
    acceptFile(file)
  }

  const handleEmptyKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleBrowseClick()
    }
  }

  const dropHint = isDragging
    ? '松手放进木框，让像素画登场'
    : previewUrl
      ? '拖拽图片替换画布，或点击重新选择'
      : '拖拽或点击上传照片 / 拍照'

  return (
    <div className="page capture-page">
      <header className="page-header capture-header">
        <div>
          <p className="eyebrow">捕物界面</p>
          <h1>捕物工作台骨架</h1>
          <p className="lede">
            左侧预览约占 60%，右侧编辑约占 40%，底部预留物品栏与更换/保存按钮；当前为未上传的空态占位。
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
                {uploadFile ? `已选择：${uploadFile.name}` : '状态：未上传'}
              </span>
            </div>

            <div className="preview-stage">
              <div
                className={`preview-canvas ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {!previewUrl && (
                  <div
                    className="empty-canvas interactive"
                    onClick={handleBrowseClick}
                    onKeyDown={handleEmptyKeyDown}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="wooden-frame">
                      <div className="frame-title">空画布</div>
                      <p className="frame-desc">上传/拍照后，这里会出现像素化预览与识别框</p>
                      <button className="pixel-button muted" type="button">
                        上传照片
                      </button>
                      <p className="frame-helper">支持拖拽图片直接放入</p>
                    </div>
                  </div>
                )}

                {previewUrl && <img alt="上传预览" className="preview-image" src={previewUrl} />}

                <div className="box-layer">
                  {mockBoxes.map((box, index) => (
                    <div
                      key={box.id}
                      className={`box-outline ${index === 0 ? 'active' : ''}`}
                      style={box.style}
                    >
                      <span className="box-label">{box.label}</span>
                    </div>
                  ))}
                </div>

                <div className="tag-layer">
                  <div className="tag-placeholder">
                    <div className="tag-header">
                      <span className="tag-name">星露谷标签占位</span>
                      <span className="tag-category">菜品</span>
                    </div>
                    <div className="tag-body">
                      <p>1–2 句描述会显示在这里，点击输入或生成后实时同步。</p>
                    </div>
                    <div className="tag-stats">
                      <span>+能量 80</span>
                      <span>+生命值 45</span>
                    </div>
                  </div>
                </div>

                <div className="time-coin-placeholder">
                  <div className="time-widget">时间组件占位</div>
                  <div className="coin-chip">88888888</div>
                </div>

                <div className={`drop-hint ${isDragging ? 'active' : ''}`}>
                  {dropHint}
                </div>
                {error && <div className="upload-error">{error}</div>}
                {uploadFile && (
                  <div className="upload-file-info">
                    <span className="file-name">{uploadFile.name}</span>
                    <button className="text-button" type="button" onClick={handleBrowseClick}>
                      重新选择
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden-file-input"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </section>

          <section className="pane editor-pane">
            <div className="pane-top">
              <div className="pane-title">右侧编辑面板</div>
              <span className="helper-text subtle">仅展示布局，不含交互</span>
            </div>
            <div className="editor-stacks">
              <div className="panel-card form-placeholder">
                <div className="form-grid">
                  <div className="form-row">
                    <span>名称</span>
                    <div className="field-with-action">
                      <div className="input-ghost">输入框占位</div>
                      <div className="mini-chip">更新</div>
                    </div>
                  </div>
                  <div className="form-row">
                    <span>类别</span>
                    <div className="input-ghost">下拉占位</div>
                  </div>
                  <div className="form-row">
                    <span>描述</span>
                    <div className="field-with-action">
                      <div className="input-ghost tall">多行文本占位</div>
                      <div className="mini-chip">重生</div>
                    </div>
                  </div>
                  <div className="form-row split">
                    <div className="stat-ghost">
                      <span>能量</span>
                      <div className="input-ghost">数值占位</div>
                    </div>
                    <div className="stat-ghost">
                      <span>生命值</span>
                      <div className="input-ghost">数值占位</div>
                    </div>
                  </div>
                  <div className="form-row">
                    <span>时间</span>
                    <div className="field-with-action">
                      <div className="input-ghost">同步按钮/时间输入占位</div>
                      <div className="mini-chip">同步</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="object-bar">
          <div className="object-bar-header">
            <span>物品栏占位</span>
            <span className="helper-text">预留识别到的物体列表，仅单选</span>
          </div>
          <div className="object-grid">
            {placeholderObjects.map((obj, index) => (
              <div key={obj.id} className={`object-slot ${index === 0 ? 'active' : ''}`}>
                <div className="slot-thumb" />
                <div className="slot-label">{obj.label}</div>
                <div className="slot-hint">{obj.hint}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="bottom-actions">
          <button className="pixel-button secondary" type="button">
            更换照片
          </button>
          <button className="pixel-button primary" type="button" disabled>
            保存至珍藏箱
          </button>
        </div>
      </div>
    </div>
  )
}

export default CapturePage
