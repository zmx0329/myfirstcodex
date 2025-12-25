import { Link } from 'react-router-dom'

const sampleSlots = Array.from({ length: 8 }, (_, index) => index + 1)

const CollectionPage = () => {
  return (
    <div className="page collection-page">
      <div className="collection-room">
        <header className="collection-header">
          <div className="collection-plaque">
            <span className="plaque-title">珍藏室</span>
            <span className="plaque-sub">2D 像素 RPG 图鉴风</span>
          </div>
          <Link className="ghost-button" to="/">
            返回主页
          </Link>
        </header>

        <section className="collection-grid">
          {sampleSlots.map((slot) => (
            <div key={slot} className="collection-card" tabIndex={0}>
              <div className="card-number">{slot}</div>
              <div className="card-frame">
                <div className="card-paper">
                  <div className="card-thumb">缩略图 {slot}</div>
                  <div className="card-meta">
                    <span className="card-title">作品标题占位</span>
                    <span className="card-info">保存时间 / 标签 / 固定金币</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}

export default CollectionPage
