import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 3D 지도(three.js)는 /map 에 들어갈 때만 따로 내려받는 큰 덩어리라서, 크기 경고 기준만 올려 둡니다
  build: { chunkSizeWarningLimit: 1000 },
})
