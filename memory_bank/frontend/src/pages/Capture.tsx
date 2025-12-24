import { Link } from 'react-router-dom'

const CapturePage = () => {
  const placeholderObjects = Array.from({ length: 6 }, (_, index) => index + 1)

  return (
    <div className="page capture-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">捕物界面</p>
          <h1>捕物工作台骨架</h1>
          <p className="lede">
            左侧预览约占 60%，右侧编辑约占 40%，底部预留物品栏，后续再填交互。
          </p>
        </div>
        <Link className="ghost-button" to="/">
          返回主页
        </Link>
      </header>

      <div className="capture-layout">
        <div className="workspace">
          <section className="pane preview-pane">
            <div className="pane-title">左侧预览区</div>
            <div className="canvas-placeholder">
              <p>上传占位 / 像素预览 / 识别框层</p>
              <p>标签层与拖拽区域后续补上</p>
            </div>
          </section>

          <section className="pane editor-pane">
            <div className="pane-title">右侧编辑面板</div>
            <div className="editor-stacks">
              <div className="panel-card">
                标签表单与时间组件占位（名称/类别/描述/数值/时间）
              </div>
              <div className="panel-card muted">
                操作提示区：生成描述按钮、同步时间、保存状态等放这里
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
            {placeholderObjects.map((id) => (
              <div key={id} className="object-slot">
                <div className="slot-thumb" />
                <div className="slot-label">物体 {id}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default CapturePage
