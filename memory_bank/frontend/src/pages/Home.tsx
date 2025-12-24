import { Link } from 'react-router-dom'

const HomePage = () => {
  return (
    <div className="page home-page">
      <header className="hero">
        <p className="eyebrow">星露谷物集图鉴</p>
        <h1>捕物与珍藏入口</h1>
        <p className="lede">
          先把主页和两个入口搭好，确保用户只有“捕物”和“珍藏”两个可点的选项。
        </p>
      </header>

      <div className="primary-actions">
        <Link className="action-button primary" to="/capture">
          捕物
        </Link>
        <Link className="action-button secondary" to="/collection">
          珍藏
        </Link>
      </div>

      <p className="helper-text">
        其他元素暂不可交互；点击其中一个按钮即可切换到对应页面。
      </p>
    </div>
  )
}

export default HomePage
