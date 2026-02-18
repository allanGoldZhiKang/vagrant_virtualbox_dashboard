const fs = require('fs')
const path = require('path')

// 测试项目基础结构
function testProjectStructure() {
  console.log('🧪 测试项目基础结构...')
  
  // 测试 package.json 存在
  const packageJsonPath = path.join(__dirname, '../package.json')
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json 文件不存在')
  }
  
  // 测试 package.json 内容
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  if (packageJson.name !== 'vbox-config') {
    throw new Error('package.json 名称不正确')
  }
  if (packageJson.main !== 'src/index.js') {
    throw new Error('package.json main 入口不正确')
  }
  if (!packageJson.bin || packageJson.bin['vbox-config'] !== './vbox-config') {
    throw new Error('package.json bin 配置不正确')
  }
  
  // 测试可执行脚本存在
  const vboxConfigPath = path.join(__dirname, '../vbox-config')
  if (!fs.existsSync(vboxConfigPath)) {
    throw new Error('vbox-config 可执行脚本不存在')
  }
  
  // 测试脚本权限
  const stats = fs.statSync(vboxConfigPath)
  if (!(stats.mode & parseInt('111', 8))) {
    throw new Error('vbox-config 脚本没有执行权限')
  }
  
  // 测试 src 目录结构
  const srcIndexPath = path.join(__dirname, '../src/index.js')
  const srcUtilsPath = path.join(__dirname, '../src/utils/vbox.js')
  
  if (!fs.existsSync(srcIndexPath)) {
    throw new Error('src/index.js 文件不存在')
  }
  
  if (!fs.existsSync(path.dirname(srcUtilsPath))) {
    throw new Error('src/utils 目录不存在')
  }
  
  console.log('✅ 项目基础结构测试通过')
}

// 测试 package.json 脚本
function testPackageScripts() {
  console.log('🧪 测试 package.json 脚本...')
  
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'))
  
  if (!packageJson.scripts || packageJson.scripts.start !== 'node src/index.js') {
    throw new Error('start 脚本配置不正确')
  }
  
  if (!packageJson.scripts || packageJson.scripts.test !== 'node src/utils/vbox.js') {
    throw new Error('test 脚本配置不正确')
  }
  
  console.log('✅ package.json 脚本测试通过')
}

// 测试可执行脚本内容
function testExecutableScript() {
  console.log('🧪 测试可执行脚本内容...')
  
  const scriptContent = fs.readFileSync(path.join(__dirname, '../vbox-config'), 'utf8')
  
  if (!scriptContent.includes('#!/usr/bin/env node')) {
    throw new Error('可执行脚本缺少 shebang')
  }
  
  if (!scriptContent.includes("require('./src/index.js')")) {
    throw new Error('可执行脚本内容不正确')
  }
  
  console.log('✅ 可执行脚本内容测试通过')
}

// 运行所有测试
async function runAllTests() {
  try {
    testProjectStructure()
    testPackageScripts()
    testExecutableScript()
    console.log('\n🎉 所有基础结构测试通过!')
    return true
  } catch (error) {
    console.log(`\n❌ 测试失败: ${error.message}`)
    return false
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1)
  })
}

module.exports = { runAllTests, testProjectStructure, testPackageScripts, testExecutableScript }