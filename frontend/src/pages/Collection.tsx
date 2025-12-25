import { Link } from 'react-router-dom'

const sampleSlots = Array.from({ length: 8 }, (_, index) => index + 1)

const CollectionPage = () => {
  return (
    <div className="page collection-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">珍藏界面</p>
          <h1>珍藏网格占位</h1>
          <p className="lede">预留作品网格和放大查看入口，后续接入真实数据。</p>
        </div>
        <Link className="ghost-button" to="/">
          返回主页
        </Link>
      </header>

      <section className="gallery-grid">
        {sampleSlots.map((slot) => (
          <div key={slot} className="gallery-card">
            <div className="gallery-thumb">缩略图 {slot}</div>
            <div className="gallery-meta">
              <span className="title">作品标题占位</span>
              <span className="helper-text">保存时间 / 标签 / 固定金币</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

export default CollectionPage
