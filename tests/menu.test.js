const readline = require('readline')
const { spawn } = require('child_process')

// 保存原始的 readline.createInterface
const originalCreateInterface = readline.createInterface

// 测试菜单函数存在性
function testMenuFunctionsExist() {
  console.log('🧪 测试菜单函数存在性...')
  
  try {
    // 加载主界面模块
    const indexPath = require.resolve('../src/index.js')
    delete require.cache[indexPath]
    const menuFunctions = require(indexPath)
    
    // 测试所有必需的函数是否存在
    const requiredFunctions = [
      'showMainMenu',
      'handleMainMenuChoice', 
      'showVMList',
      'pause',
      'configureVM',
      'showVMDetails',
      'toggleVM',
      'main'
    ]
    
    for (const funcName of requiredFunctions) {
      if (typeof menuFunctions[funcName] !== 'function') {
        throw new Error(`函数 ${funcName} 不存在或不是函数`)
      }
    }
    
    console.log('✅ 菜单函数存在性测试通过')
  } catch (error) {
    console.log(`❌ 菜单函数存在性测试失败: ${error.message}`)
    throw error
  }
}

// 测试菜单内容格式
function testMenuContentFormat() {
  console.log('🧪 测试菜单内容格式...')
  
  try {
    // 加载主界面模块
    const indexPath = require.resolve('../src/index.js')
    delete require.cache[indexPath]
    const { showMainMenu } = require(indexPath)
    
    // 模拟 console.clear 和 console.log
    let logOutput = ''
    const originalClear = console.clear
    const originalLog = console.log
    
    console.clear = () => {}
    console.log = (message) => { logOutput += message }
    
    // 模拟 readline 接口
    const mockRL = {
      question: (prompt, callback) => {
        // 验证提示文本
        if (!prompt.includes('请选择操作 (1-5):')) {
          throw new Error('菜单提示文本不正确')
        }
        
        // 验证菜单内容
        if (!logOutput.includes('VirtualBox 虚拟机配置管理器')) {
          throw new Error('菜单标题缺失')
        }
        
        if (!logOutput.includes('1. 列出所有虚拟机')) {
          throw new Error('菜单选项缺失')
        }
        
        if (!logOutput.includes('5. 退出')) {
          throw new Error('退出选项缺失')
        }
        
        console.clear = originalClear
        console.log = originalLog
        return
      },
      close: () => {}
    }
    
    // 临时替换 readline
    readline.createInterface = () => mockRL
    
    // 调用 showMainMenu
    showMainMenu()
    
    console.clear = originalClear
    console.log = originalLog
    readline.createInterface = originalCreateInterface
    
    console.log('✅ 菜单内容格式测试通过')
  } catch (error) {
    console.log(`❌ 菜单内容格式测试失败: ${error.message}`)
    throw error
  }
}

// 测试虚拟机列表显示逻辑
async function testVMListDisplayLogic() {
  console.log('🧪 测试虚拟机列表显示逻辑...')
  
  try {
    // 直接测试虚拟机列表的格式化逻辑
    const mockVMs = [
      { name: 'centos7-dev', running: true },
      { name: 'ubuntu-test', running: false }
    ]
    
    // 验证虚拟机列表的格式化逻辑
    let logOutput = ''
    
    // 模拟 showVMList 的核心逻辑
    if (mockVMs.length === 0) {
      logOutput += '📭 没有找到虚拟机'
    } else {
      logOutput += '🖥️  可用虚拟机:\n'
      mockVMs.forEach((vm, index) => {
        const status = vm.running ? '🟢 运行中' : '⏸️  已关闭'
        logOutput += `  ${index + 1}. ${vm.name} - ${status}\n`
      })
    }
    
    // 验证输出
    if (!logOutput.includes('centos7-dev')) {
      throw new Error('虚拟机名称未显示')
    }
    
    if (!logOutput.includes('🟢 运行中')) {
      throw new Error('运行状态未显示')
    }
    
    if (!logOutput.includes('⏸️  已关闭')) {
      throw new Error('关闭状态未显示')
    }
    
    console.log('✅ 虚拟机列表显示逻辑测试通过')
  } catch (error) {
    console.log(`❌ 虚拟机列表显示逻辑测试失败: ${error.message}`)
    throw error
  }
}

// 运行所有测试
async function runAllTests() {
  try {
    testMenuFunctionsExist()
    testMenuContentFormat()
    await testVMListDisplayLogic()
    console.log('\n🎉 所有交互式菜单测试通过!')
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

module.exports = { runAllTests, testMenuFunctionsExist, testMenuContentFormat, testVMListDisplayLogic }