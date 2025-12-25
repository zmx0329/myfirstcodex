import { Link } from 'react-router-dom'

const HomePage = () => {
  return (
    <div className="page home-page">
      <div className="home-overlay">
        <div className="home-stage">
          <h1 className="sr-only">星露谷物集图鉴</h1>
          <Link className="hero-hotspot capture" to="/capture">
            <span className="sr-only">捕物</span>
          </Link>
          <Link className="hero-hotspot collection" to="/collection">
            <span className="sr-only">珍藏</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HomePage
