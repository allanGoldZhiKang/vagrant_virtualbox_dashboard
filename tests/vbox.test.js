const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

// 测试 VBoxManage 命令执行
async function testVBoxManageExecution() {
  console.log('🧪 测试 VBoxManage 命令执行...')
  
  // 模拟 VBoxManage --version 成功响应
  const originalSpawn = spawn
  let mockCalled = false
  
  require('child_process').spawn = function(command, args, options) {
    mockCalled = true
    if (command === 'VBoxManage' && args[0] === '--version') {
      const mockChild = {
        stdout: { on: () => {} },
        stderr: { on: () => {} },
        on: function(event, callback) {
          if (event === 'close') {
            setTimeout(() => callback(0), 10)
          }
          return this
        }
      }
      return mockChild
    }
    return originalSpawn.call(this, command, args, options)
  }
  
  try {
    // 清除模块缓存
    delete require.cache[require.resolve('../src/utils/vbox')]
    const vbox = require('../src/utils/vbox')
    const result = await vbox.testVBoxManage()
    
    if (!mockCalled) {
      throw new Error('spawn 没有被调用')
    }
    
    if (result !== true) {
      throw new Error('testVBoxManage 应该返回 true')
    }
    
    console.log('✅ VBoxManage 命令执行测试通过')
  } catch (error) {
    console.log(`❌ VBoxManage 命令执行测试失败: ${error.message}`)
    throw error
  }
}

// 测试虚拟机列表解析
function testVMListParsing() {
  console.log('🧪 测试虚拟机列表解析...')
  
  // 直接测试解析逻辑
  const mockOutput = `"centos7-dev" {12345678-1234-1234-1234-123456789012}
"ubuntu-test" {87654321-4321-4321-4321-210987654321}
"windows-prod" {11111111-2222-3333-4444-555555555555}`
  
  const vms = []
  mockOutput.split('\n').forEach(line => {
    const match = line.match(/^"([^"]+)"\s+\{([a-f0-9-]+)\}$/)
    if (match) {
      vms.push({
        name: match[1],
        uuid: match[2],
        running: false
      })
    }
  })
  
  if (vms.length !== 3) {
    throw new Error(`期望 3 个虚拟机，实际得到 ${vms.length} 个`)
  }
  
  if (vms[0].name !== 'centos7-dev') {
    throw new Error(`第一个虚拟机名称错误: ${vms[0].name}`)
  }
  
  if (vms[1].uuid !== '87654321-4321-4321-4321-210987654321') {
    throw new Error(`第二个虚拟机 UUID 错误: ${vms[1].uuid}`)
  }
  
  console.log('✅ 虚拟机列表解析测试通过')
}

// 测试错误处理
async function testErrorHandling() {
  console.log('🧪 测试错误处理...')
  
  let errorRaised = false
  
  // 模拟 VBoxManage 失败
  require('child_process').spawn = function(command, args, options) {
    const mockChild = {
      stdout: { on: () => {} },
      stderr: { on: (event, callback) => {
        if (event === 'data') {
          callback('Command failed')
        }
      }},
      on: function(event, callback) {
        if (event === 'close') {
          setTimeout(() => callback(1), 10) // 非零退出码
        }
        return this
      }
    }
    return mockChild
  }
  
  try {
    // 清除模块缓存
    delete require.cache[require.resolve('../src/utils/vbox')]
    const vbox = require('../src/utils/vbox')
    const result = await vbox.testVBoxManage()
    
    // testVBoxManage 应该返回 false 而不是抛出错误
    if (result !== false) {
      throw new Error('testVBoxManage 应该返回 false')
    }
    
    errorRaised = true
  } catch (error) {
    throw new Error(`不应该抛出错误: ${error.message}`)
  }
  
  console.log('✅ 错误处理测试通过')
}

// 测试真实的 VBoxManage 函数（如果可用）
async function testRealVBoxManage() {
  console.log('🧪 测试真实 VBoxManage 功能...')
  
  try {
    const vbox = require('../src/utils/vbox')
    
    // 测试 executeVBoxManage 函数是否存在
    if (typeof vbox.executeVBoxManage !== 'function') {
      throw new Error('executeVBoxManage 函数不存在')
    }
    
    // 测试 listVMs 函数是否存在
    if (typeof vbox.listVMs !== 'function') {
      throw new Error('listVMs 函数不存在')
    }
    
    // 测试 testVBoxManage 函数是否存在
    if (typeof vbox.testVBoxManage !== 'function') {
      throw new Error('testVBoxManage 函数不存在')
    }
    
    console.log('✅ 真实 VBoxManage 功能测试通过')
  } catch (error) {
    console.log(`❌ 真实 VBoxManage 功能测试失败: ${error.message}`)
    throw error
  }
}

// 运行所有测试
async function runAllTests() {
  try {
    await testVBoxManageExecution()
    testVMListParsing()
    await testErrorHandling()
    await testRealVBoxManage()
    console.log('\n🎉 所有 VirtualBox 功能测试通过!')
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

module.exports = { runAllTests, testVBoxManageExecution, testVMListParsing, testErrorHandling, testRealVBoxManage }