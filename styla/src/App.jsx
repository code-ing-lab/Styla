import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Login from './pages/Login'
import Subscribe from './pages/Subscribe'
import MyPage from './pages/MyPage'

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/subscribe" element={<Subscribe />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
    </div>
  )
}

export default App
