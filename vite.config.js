// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // 需要引入 path 模块
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [vue(), Components({
    resolvers: [VantResolver()]
  })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src') // 设置 @ 指向 src 目录
    }
  }
})
