#!/usr/bin/env node

/**
 * 开发环境启动脚本
 * 提供更好的开发体验和错误处理
 */

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

// 检查Node.js版本
const nodeVersion = process.version
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])

if (majorVersion < 16) {
  console.error('❌ 需要 Node.js 16 或更高版本')
  console.error(`当前版本: ${nodeVersion}`)
  process.exit(1)
}

// 检查项目文件
const requiredFiles = [
  'package.json',
  'nuxt.config.ts',
  'app.vue'
]

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(process.cwd(), file))) {
    console.error(`❌ 缺少必要文件: ${file}`)
    process.exit(1)
  }
}

// 检查依赖是否安装
if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
  console.log('📦 检测到未安装依赖，正在安装...')
  
  const installProcess = spawn('pnpm', ['install'], {
    stdio: 'inherit',
    shell: true
  })
  
  installProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ 依赖安装完成')
      startDev()
    } else {
      console.error('❌ 依赖安装失败')
      process.exit(1)
    }
  })
} else {
  startDev()
}

function startDev() {
  console.log('🚀 启动开发服务器...')
  console.log('📱 支持设备: PC、手机、平板')
  console.log('🌐 网络模式: 局域网访问已启用')
  console.log('')
  
  const devProcess = spawn('pnpm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  })
  
  devProcess.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ 开发服务器异常退出')
      process.exit(code)
    }
  })
  
  // 优雅退出
  process.on('SIGINT', () => {
    console.log('\n👋 正在关闭开发服务器...')
    devProcess.kill('SIGINT')
    process.exit(0)
  })
}
