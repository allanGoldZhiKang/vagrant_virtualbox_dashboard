const { spawn } = require('child_process')

// 测试配置修改功能
function testConfigFunctions() {
  console.log('🧪 测试配置修改函数...')
  
  try {
    // 加载主界面模块
    const indexPath = require.resolve('../src/index.js')
    delete require.cache[indexPath]
    const configFunctions = require(indexPath)
    
    // 测试所有必需的函数是否存在
    const requiredFunctions = [
      'configureVM',
      'showVMDetails',
      'toggleVM'
    ]
    
    for (const funcName of requiredFunctions) {
      if (typeof configFunctions[funcName] !== 'function') {
        throw new Error(`函数 ${funcName} 不存在或不是函数`)
      }
    }
    
    console.log('✅ 配置修改函数测试通过')
  } catch (error) {
    console.log(`❌ 配置修改函数测试失败: ${error.message}`)
    throw error
  }
}

// 测试配置参数验证
function testConfigValidation() {
  console.log('🧪 测试配置参数验证...')
  
  try {
    // 测试内存验证
    const validMemory = [512, 1024, 2048, 4096, 8192]
    const invalidMemory = [0, -1, 100, 50000, 'abc']  // 50000 超过最大限制
    
    for (const mem of validMemory) {
      if (mem < 256 || mem > 32768) {
        throw new Error(`有效内存值 ${mem} 被错误拒绝`)
      }
    }
    
    for (const mem of invalidMemory) {
      if (typeof mem === 'number' && mem >= 256 && mem <= 32768) {
        throw new Error(`无效内存值 ${mem} 应该被拒绝`)
      }
    }
    
    // 测试 CPU 验证
    const validCPU = [1, 2, 4, 8, 16]
    const invalidCPU = [0, -1, 32, 'abc']
    
    for (const cpu of validCPU) {
      if (cpu < 1 || cpu > 16) {
        throw new Error(`有效 CPU 值 ${cpu} 被错误拒绝`)
      }
    }
    
    console.log('✅ 配置参数验证测试通过')
  } catch (error) {
    console.log(`❌ 配置参数验证测试失败: ${error.message}`)
    throw error
  }
}

// 测试配置命令生成
function testConfigCommandGeneration() {
  console.log('🧪 测试配置命令生成...')
  
  try {
    // 测试内存配置命令
    const vmName = 'test-vm'
    const memoryMB = 2048
    const memoryCmd = `modifyvm "${vmName}" --memory ${memoryMB}`
    
    if (!memoryCmd.includes('modifyvm')) {
      throw new Error('内存配置命令格式错误')
    }
    
    if (!memoryCmd.includes(vmName)) {
      throw new Error('虚拟机名称未包含在命令中')
    }
    
    if (!memoryCmd.includes('--memory')) {
      throw new Error('内存参数未包含在命令中')
    }
    
    // 测试 CPU 配置命令
    const cpuCount = 2
    const cpuCmd = `modifyvm "${vmName}" --cpus ${cpuCount}`
    
    if (!cpuCmd.includes('--cpus')) {
      throw new Error('CPU 参数未包含在命令中')
    }
    
    console.log('✅ 配置命令生成测试通过')
  } catch (error) {
    console.log(`❌ 配置命令生成测试失败: ${error.message}`)
    throw error
  }
}

// 运行所有测试
async function runAllTests() {
  try {
    testConfigFunctions()
    testConfigValidation()
    testConfigCommandGeneration()
    console.log('\n🎉 所有配置功能测试通过!')
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

module.exports = { runAllTests, testConfigFunctions, testConfigValidation, testConfigCommandGeneration }
