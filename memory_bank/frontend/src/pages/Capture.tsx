import { Link } from 'react-router-dom'

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
              <span className="helper-text subtle">状态：未上传</span>
            </div>

            <div className="preview-stage">
              <div className="preview-canvas">
                <div className="empty-canvas">
                  <div className="wooden-frame">
                    <div className="frame-title">空画布</div>
                    <p className="frame-desc">上传/拍照后，这里会出现像素化预览与识别框</p>
                    <div className="pixel-button muted">上传入口占位</div>
                  </div>
                </div>

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
