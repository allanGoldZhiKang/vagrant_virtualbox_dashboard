# 交互式 VirtualBox 配置工具实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 创建一个简单直观的交互式命令行工具，用于管理 VirtualBox 虚拟机配置

**架构:** 使用 Node.js readline 模块创建 TUI（终端用户界面），通过 spawn 调用 VBoxManage 命令

**技术栈:** Node.js, readline, child_process, ANSI 颜色输出

---

### Task 1: 创建项目基础结构

**文件:**
- Create: `vbox-config` (可执行脚本)
- Create: `package.json`
- Create: `src/index.js`
- Create: `src/utils/vbox.js`

**Step 1: 创建 package.json**

```json
{
  "name": "vbox-config",
  "version": "1.0.0",
  "description": "Interactive VirtualBox VM Configuration Manager",
  "main": "src/index.js",
  "bin": {
    "vbox-config": "./vbox-config"
  },
  "scripts": {
    "start": "node src/index.js",
    "test": "node src/utils/vbox.js"
  },
  "keywords": ["virtualbox", "vm", "configuration", "cli"],
  "author": "VBox Config Tool",
  "license": "MIT"
}
```

**Step 2: 创建可执行入口文件**

```bash
#!/usr/bin/env node
require('./src/index.js')
```

**Step 3: 初始化项目并测试基础结构**

Run: `npm init -y` && `chmod +x vbox-config`
Expected: 创建成功，文件权限正确

**Step 4: 提交基础结构**

```bash
git add package.json vbox-config src/
git commit -m "feat: initialize project structure"
```

### Task 2: 实现 VirtualBox 命令封装

**文件:**
- Modify: `src/utils/vbox.js`

**Step 1: 编写 VirtualBox 基础功能测试**

```javascript
// 测试 VBoxManage 命令执行
async function testVBoxManage() {
  try {
    const result = await executeVBoxManage(['--version'])
    console.log('✓ VirtualBox 可访问:', result.trim())
    return true
  } catch (error) {
    console.log('✗ VirtualBox 不可访问:', error.message)
    return false
  }
}
```

**Step 2: 实现 VBoxManage 命令执行函数**

```javascript
const { spawn } = require('child_process')

function executeVBoxManage(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('VBoxManage', args, {
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim())
      } else {
        reject(new Error(`VBoxManage 失败: ${stderr}`))
      }
    })

    child.on('error', (error) => {
      reject(new Error(`无法执行 VBoxManage: ${error.message}`))
    })
  })
}
```

**Step 3: 实现虚拟机列表功能**

```javascript
async function listVMs() {
  try {
    const output = await executeVBoxManage(['list', 'vms'])
    const vms = []
    output.split('\n').forEach(line => {
      const match = line.match(/^"([^"]+)"\s+([a-f0-9-]+)$/)
      if (match) {
        vms.push({
          name: match[1],
          uuid: match[2],
          running: false
        })
      }
    })
    
    // 检查运行中的虚拟机
    try {
      const runningOutput = await executeVBoxManage(['list', 'runningvms'])
      output.split('\n').forEach(line => {
        const match = line.match(/^"([^"]+)"\s+([a-f0-9-]+)$/)
        if (match) {
          const vm = vms.find(v => v.name === match[1])
          if (vm) vm.running = true
        }
      })
    } catch (error) {
      // 没有运行中的虚拟机，忽略错误
    }
    
    return vms
  } catch (error) {
    throw new Error(`获取虚拟机列表失败: ${error.message}`)
  }
}
```

**Step 4: 测试 VirtualBox 功能**

Run: `node -e "require('./src/utils/vbox.js').testVBoxManage()"`
Expected: 显示 VirtualBox 版本信息

**Step 5: 提交 VirtualBox 封装**

```bash
git add src/utils/vbox.js
git commit -m "feat: implement VirtualBox command wrapper"
```

### Task 3: 创建交互式菜单界面

**文件:**
- Modify: `src/index.js`

**Step 1: 实现基础菜单框架**

```javascript
#!/usr/bin/env node

const readline = require('readline')
const { listVMs, testVBoxManage } = require('./utils/vbox')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function showMainMenu() {
  console.clear()
  console.log(`
┌─────────────────────────────────────────┐
│     VirtualBox 虚拟机配置管理器           │
├─────────────────────────────────────────┤
│ 1. 列出所有虚拟机                        │
│ 2. 修改虚拟机配置                        │
│ 3. 查看虚拟机详情                        │
│ 4. 启动/关闭虚拟机                       │
│ 5. 退出                                 │
└─────────────────────────────────────────┘
  `)
  
  rl.question('请选择操作 (1-5): ', handleMainMenuChoice)
}
```

**Step 2: 实现主菜单选择处理**

```javascript
async function handleMainMenuChoice(choice) {
  switch (choice.trim()) {
    case '1':
      await showVMList()
      break
    case '2':
      await configureVM()
      break
    case '3':
      await showVMDetails()
      break
    case '4':
      await toggleVM()
      break
    case '5':
      console.log('👋 再见!')
      rl.close()
      process.exit(0)
    default:
      console.log('❌ 无效选择，请输入 1-5')
      await pause()
      showMainMenu()
  }
}
```

**Step 3: 实现虚拟机列表显示**

```javascript
async function showVMList() {
  console.clear()
  console.log('📋 正在获取虚拟机列表...\n')
  
  try {
    const vms = await listVMs()
    
    if (vms.length === 0) {
      console.log('📭 没有找到虚拟机')
    } else {
      console.log('🖥️  可用虚拟机:\n')
      vms.forEach((vm, index) => {
        const status = vm.running ? '🟢 运行中' : '⏸️  已关闭'
        console.log(`  ${index + 1}. ${vm.name} - ${status}`)
      })
    }
  } catch (error) {
    console.log(`❌ 错误: ${error.message}`)
  }
  
  await pause()
  showMainMenu()
}

function pause() {
  return new Promise(resolve => {
    rl.question('\n按回车键继续...', resolve)
  })
}
```

**Step 4: 测试基础菜单功能**

Run: `npm start`
Expected: 显示主菜单，可以选择选项

**Step 5: 提交菜单界面**

```bash
git add src/index.js
git commit -m "feat: implement interactive menu interface"
```

### Task 4: 实现虚拟机配置功能

**文件:**
- Modify: `src/utils/vbox.js`
- Modify: `src/index.js`

**Step 1: 实现 VM 信息获取功能**

```javascript
// 在 src/utils/vbox.js 中添加
async function getVMInfo(vmName) {
  try {
    const output = await executeVBoxManage(['showvminfo', vmName, '--machinereadable'])
    const info = {}
    
    output.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^"|"$/g, '')
        info[key] = value
      }
    })
    
    return {
      name: info.name || vmName,
      memory: parseInt(info.memory) || 0,
      cpus: parseInt(info.cpus) || 1,
      storage: await getVMStorage(vmName),
      state: info.VMState || 'unknown'
    }
  } catch (error) {
    throw new Error(`获取虚拟机信息失败: ${error.message}`)
  }
}

async function getVMStorage(vmName) {
  try {
    const output = await executeVBoxManage(['showvminfo', vmName])
    const storageMatch = output.match(/StorageController.*\n.*\n.*\((\d+) bytes\)/)
    return storageMatch ? Math.round(parseInt(storageMatch[1]) / (1024 * 1024 * 1024)) : 0
  } catch (error) {
    return 0
  }
}
```

**Step 2: 实现 VM 配置修改功能**

```javascript
// 在 src/utils/vbox.js 中添加
async function setVMMemory(vmName, memoryMB) {
  try {
    await executeVBoxManage(['modifyvm', vmName, '--memory', memoryMB.toString()])
    return true
  } catch (error) {
    throw new Error(`修改内存失败: ${error.message}`)
  }
}

async function setVMCPUs(vmName, cpuCount) {
  try {
    await executeVBoxManage(['modifyvm', vmName, '--cpus', cpuCount.toString()])
    return true
  } catch (error) {
    throw new Error(`修改CPU失败: ${error.message}`)
  }
}

async function setVMStorage(vmName, storageGB) {
  try {
    // 获取当前存储控制器信息
    const output = await executeVBoxManage(['showvminfo', vmName])
    const controllerMatch = output.match(/StorageControllerNamePort0=(\w+)/)
    if (controllerMatch) {
      const controllerName = controllerMatch[1]
      await executeVBoxManage(['modifyvm', vmName, '--resize', `${storageGB * 1024}`, controllerName])
      return true
    }
    throw new Error('找不到存储控制器')
  } catch (error) {
    throw new Error(`修改存储失败: ${error.message}`)
  }
}
```

**Step 3: 实现配置选择界面**

```javascript
// 在 src/index.js 中添加
async function configureVM() {
  console.clear()
  console.log('🔧 配置虚拟机\n')
  
  try {
    const vms = await listVMs()
    if (vms.length === 0) {
      console.log('📭 没有可配置的虚拟机')
      await pause()
      showMainMenu()
      return
    }
    
    console.log('选择要配置的虚拟机:')
    vms.forEach((vm, index) => {
      const status = vm.running ? '🟢 运行中' : '⏸️  已关闭'
      console.log(`  ${index + 1}. ${vm.name} - ${status}`)
    })
    
    rl.question('\n请选择虚拟机 (1-' + vms.length + '): ', async (choice) => {
      const vmIndex = parseInt(choice) - 1
      if (vmIndex >= 0 && vmIndex < vms.length) {
        await showConfigOptions(vms[vmIndex])
      } else {
        console.log('❌ 无效选择')
        await pause()
        showMainMenu()
      }
    })
  } catch (error) {
    console.log(`❌ 错误: ${error.message}`)
    await pause()
    showMainMenu()
  }
}
```

**Step 4: 实现具体配置选项**

```javascript
// 在 src/index.js 中添加
async function showConfigOptions(vm) {
  console.clear()
  console.log(`🔧 配置虚拟机: ${vm.name}\n`)
  
  try {
    const info = await getVMInfo(vm.name)
    
    console.log(`
┌─────────────────────────────────────────┐
│  当前配置信息                             │
├─────────────────────────────────────────┤
│ 💾 内存: ${info.memory}MB                   │
│ ⚙️  CPU: ${info.cpus}核                      │
│ 💿 存储: ${info.storage}GB                   │
│ 📊 状态: ${info.state}                     │
└─────────────────────────────────────────┘
    `)
    
    console.log('选择要修改的配置:')
    console.log('  1. 💾 内存')
    console.log('  2. ⚙️  CPU')
    console.log('  3. 💿 存储')
    console.log('  4. 🔙 返回主菜单')
    
    rl.question('\n请选择配置项 (1-4): ', async (choice) => {
      switch (choice.trim()) {
        case '1':
          await configureMemory(vm.name, info.memory)
          break
        case '2':
          await configureCPU(vm.name, info.cpus)
          break
        case '3':
          await configureStorage(vm.name, info.storage)
          break
        case '4':
          showMainMenu()
          break
        default:
          console.log('❌ 无效选择')
          await pause()
          showConfigOptions(vm)
      }
    })
  } catch (error) {
    console.log(`❌ 获取虚拟机信息失败: ${error.message}`)
    await pause()
    showMainMenu()
  }
}
```

**Step 5: 测试配置功能**

Run: `npm start`
Expected: 可以选择虚拟机并查看配置选项

**Step 6: 提交配置功能**

```bash
git add src/utils/vbox.js src/index.js
git commit -m "feat: implement VM configuration functionality"
```

### Task 5: 实现具体配置修改界面

**文件:**
- Modify: `src/index.js`

**Step 1: 实现内存配置界面**

```javascript
async function configureMemory(vmName, currentMemory) {
  console.clear()
  console.log(`💾 配置内存 - ${vmName}\n`)
  console.log(`当前内存: ${currentMemory}MB`)
  console.log('建议范围: 1024-8192 MB\n')
  
  rl.question('请输入新的内存大小 (MB): ', async (input) => {
    const newMemory = parseInt(input)
    
    if (isNaN(newMemory) || newMemory < 512 || newMemory > 32768) {
      console.log('❌ 无效的内存大小，请输入 512-32768 之间的数字')
      await pause()
      showConfigOptions({ name: vmName })
      return
    }
    
    rl.question(`\n确认将内存从 ${currentMemory}MB 改为 ${newMemory}MB 吗？ (y/N): `, async (confirm) => {
      if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
        try {
          await setVMMemory(vmName, newMemory)
          console.log('✅ 内存配置更新成功!')
        } catch (error) {
          console.log(`❌ 配置失败: ${error.message}`)
        }
      } else {
        console.log('❌ 操作已取消')
      }
      
      await pause()
      showConfigOptions({ name: vmName })
    })
  })
}
```

**Step 2: 实现 CPU 配置界面**

```javascript
async function configureCPU(vmName, currentCPUs) {
  console.clear()
  console.log(`⚙️ 配置 CPU - ${vmName}\n`)
  console.log(`当前CPU: ${currentCPUs}核`)
  console.log('建议范围: 1-16 核\n')
  
  rl.question('请输入新的CPU核心数: ', async (input) => {
    const newCPUs = parseInt(input)
    
    if (isNaN(newCPUs) || newCPUs < 1 || newCPUs > 16) {
      console.log('❌ 无效的CPU核心数，请输入 1-16 之间的数字')
      await pause()
      showConfigOptions({ name: vmName })
      return
    }
    
    rl.question(`\n确认将CPU从 ${currentCPUs}核 改为 ${newCPUs}核 吗？ (y/N): `, async (confirm) => {
      if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
        try {
          await setVMCPUs(vmName, newCPUs)
          console.log('✅ CPU配置更新成功!')
        } catch (error) {
          console.log(`❌ 配置失败: ${error.message}`)
        }
      } else {
        console.log('❌ 操作已取消')
      }
      
      await pause()
      showConfigOptions({ name: vmName })
    })
  })
}
```

**Step 3: 实现存储配置界面**

```javascript
async function configureStorage(vmName, currentStorage) {
  console.clear()
  console.log(`💿 配置存储 - ${vmName}\n`)
  console.log(`当前存储: ${currentStorage}GB`)
  console.log('建议范围: 20-1000 GB\n')
  console.log('⚠️  注意: 存储扩容可能需要较长时间')
  
  rl.question('请输入新的存储大小 (GB): ', async (input) => {
    const newStorage = parseInt(input)
    
    if (isNaN(newStorage) || newStorage < 20 || newStorage > 1000) {
      console.log('❌ 无效的存储大小，请输入 20-1000 之间的数字')
      await pause()
      showConfigOptions({ name: vmName })
      return
    }
    
    if (newStorage <= currentStorage) {
      console.log('❌ 新的存储大小必须大于当前大小')
      await pause()
      showConfigOptions({ name: vmName })
      return
    }
    
    rl.question(`\n确认将存储从 ${currentStorage}GB 扩容到 ${newStorage}GB 吗？ (y/N): `, async (confirm) => {
      if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
        console.log('🔄 正在扩容存储，请稍候...')
        try {
          await setVMStorage(vmName, newStorage)
          console.log('✅ 存储配置更新成功!')
        } catch (error) {
          console.log(`❌ 配置失败: ${error.message}`)
        }
      } else {
        console.log('❌ 操作已取消')
      }
      
      await pause()
      showConfigOptions({ name: vmName })
    })
  })
}
```

**Step 4: 测试完整配置流程**

Run: `npm start`
Expected: 可以完整地配置虚拟机的内存、CPU和存储

**Step 5: 提交配置界面**

```bash
git add src/index.js
git commit -m "feat: implement configuration UI for memory, CPU, and storage"
```

### Task 6: 添加辅助功能和错误处理

**文件:**
- Modify: `src/index.js`
- Modify: `src/utils/vbox.js`

**Step 1: 实现虚拟机详情显示**

```javascript
// 在 src/index.js 中添加
async function showVMDetails() {
  console.clear()
  console.log('📊 虚拟机详情\n')
  
  try {
    const vms = await listVMs()
    if (vms.length === 0) {
      console.log('📭 没有虚拟机')
      await pause()
      showMainMenu()
      return
    }
    
    console.log('选择要查看的虚拟机:')
    vms.forEach((vm, index) => {
      const status = vm.running ? '🟢 运行中' : '⏸️  已关闭'
      console.log(`  ${index + 1}. ${vm.name} - ${status}`)
    })
    
    rl.question('\n请选择虚拟机 (1-' + vms.length + '): ', async (choice) => {
      const vmIndex = parseInt(choice) - 1
      if (vmIndex >= 0 && vmIndex < vms.length) {
        await displayVMDetails(vms[vmIndex].name)
      } else {
        console.log('❌ 无效选择')
        await pause()
        showMainMenu()
      }
    })
  } catch (error) {
    console.log(`❌ 错误: ${error.message}`)
    await pause()
    showMainMenu()
  }
}

async function displayVMDetails(vmName) {
  console.clear()
  console.log(`📊 虚拟机详情: ${vmName}\n`)
  
  try {
    const info = await getVMInfo(vmName)
    
    console.log(`
┌─────────────────────────────────────────┐
│              虚拟机信息                   │
├─────────────────────────────────────────┤
│ 🏷️  名称: ${info.name.padEnd(25)} │
│ 💾 内存: ${info.memory}MB${' '.repeat(25 - `${info.memory}MB`.length)}│
│ ⚙️  CPU: ${info.cpus}核${' '.repeat(25 - `${info.cpus}核`.length)}│
│ 💿 存储: ${info.storage}GB${' '.repeat(25 - `${info.storage}GB`.length)}│
│ 📊 状态: ${info.state.padEnd(25)} │
└─────────────────────────────────────────┘
    `)
  } catch (error) {
    console.log(`❌ 获取虚拟机详情失败: ${error.message}`)
  }
  
  await pause()
  showMainMenu()
}
```

**Step 2: 实现虚拟机启动/关闭功能**

```javascript
// 在 src/utils/vbox.js 中添加
async function startVM(vmName) {
  try {
    await executeVBoxManage(['startvm', vmName, '--type', 'headless'])
    return true
  } catch (error) {
    throw new Error(`启动虚拟机失败: ${error.message}`)
  }
}

async function stopVM(vmName) {
  try {
    await executeVBoxManage(['controlvm', vmName, 'acpipowerbutton'])
    return true
  } catch (error) {
    throw new Error(`关闭虚拟机失败: ${error.message}`)
  }
}

// 在 src/index.js 中添加
async function toggleVM() {
  console.clear()
  console.log('🔄 启动/关闭虚拟机\n')
  
  try {
    const vms = await listVMs()
    if (vms.length === 0) {
      console.log('📭 没有虚拟机')
      await pause()
      showMainMenu()
      return
    }
    
    console.log('选择要操作的虚拟机:')
    vms.forEach((vm, index) => {
      const status = vm.running ? '🟢 运行中' : '⏸️  已关闭'
      console.log(`  ${index + 1}. ${vm.name} - ${status}`)
    })
    
    rl.question('\n请选择虚拟机 (1-' + vms.length + '): ', async (choice) => {
      const vmIndex = parseInt(choice) - 1
      if (vmIndex >= 0 && vmIndex < vms.length) {
        const vm = vms[vmIndex]
        const action = vm.running ? '关闭' : '启动'
        
        rl.question(`确认${action}虚拟机 "${vm.name}" 吗？ (y/N): `, async (confirm) => {
          if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
            try {
              if (vm.running) {
                await stopVM(vm.name)
                console.log('✅ 虚拟机关闭成功!')
              } else {
                await startVM(vm.name)
                console.log('✅ 虚拟机启动成功!')
              }
            } catch (error) {
              console.log(`❌ 操作失败: ${error.message}`)
            }
          } else {
            console.log('❌ 操作已取消')
          }
          
          await pause()
          showMainMenu()
        })
      } else {
        console.log('❌ 无效选择')
        await pause()
        showMainMenu()
      }
    })
  } catch (error) {
    console.log(`❌ 错误: ${error.message}`)
    await pause()
    showMainMenu()
  }
}
```

**Step 3: 添加启动检查和错误处理**

```javascript
// 在 src/index.js 开头添加
async function initializeApp() {
  console.log('🔍 正在检查 VirtualBox...')
  
  const vboxAvailable = await testVBoxManage()
  if (!vboxAvailable) {
    console.log('❌ VirtualBox 不可用')
    console.log('请确保:')
    console.log('1. VirtualBox 已安装')
    console.log('2. VBoxManage 在 PATH 中')
    console.log('3. 有足够的系统权限')
    process.exit(1)
  }
  
  console.log('✅ VirtualBox 检查通过\n')
}

// 修改主函数
async function main() {
  await initializeApp()
  showMainMenu()
}

// 启动应用
main().catch(error => {
  console.log('❌ 应用启动失败:', error.message)
  process.exit(1)
})
```

**Step 4: 测试完整功能**

Run: `npm start`
Expected: 所有功能正常工作，包括错误处理

**Step 5: 提交完整功能**

```bash
git add src/index.js src/utils/vbox.js
git commit -m "feat: add VM details, start/stop functionality and error handling"
```

### Task 7: 创建使用文档和测试

**文件:**
- Create: `README.md`
- Create: `test.js`

**Step 1: 创建使用文档**

```markdown
# VBox Config - 交互式 VirtualBox 配置工具

一个简单直观的命令行工具，用于管理 VirtualBox 虚拟机配置。

## 安装

```bash
# 克隆项目
git clone <repository-url>
cd vagrant_vitualbox_dashboard

# 安装依赖
npm install

# 创建全局链接
npm link
```

## 使用方法

```bash
# 启动交互式菜单
vbox-config

# 或者直接运行
npm start
```

## 功能特性

- 📋 列出所有虚拟机
- 🔧 修改虚拟机配置（内存、CPU、存储）
- 📊 查看虚拟机详细信息
- 🔄 启动/关闭虚拟机
- 🎯 交互式菜单，操作简单直观

## 系统要求

- VirtualBox 已安装
- Node.js 12+ 
- macOS/Linux/Windows

## 使用示例

启动工具后，按照菜单提示操作：

1. 选择 "列出所有虚拟机" 查看可用虚拟机
2. 选择 "修改虚拟机配置" 进入配置界面
3. 选择要配置的虚拟机和配置项
4. 输入新的配置值并确认

## 故障排除

如果遇到 "VirtualBox 不可用" 错误：

1. 确认 VirtualBox 已正确安装
2. 检查 VBoxManage 是否在系统 PATH 中
3. 确保有足够的系统权限

## 许可证

MIT License
```

**Step 2: 创建测试脚本**

```javascript
#!/usr/bin/env node

const { testVBoxManage, listVMs, getVMInfo } = require('./src/utils/vbox')

async function runTests() {
  console.log('🧪 开始测试 VBox Config...\n')
  
  // 测试 1: VirtualBox 可用性
  console.log('测试 1: VirtualBox 可用性')
  try {
    await testVBoxManage()
    console.log('✅ 通过\n')
  } catch (error) {
    console.log('❌ 失败:', error.message)
    return
  }
  
  // 测试 2: 虚拟机列表
  console.log('测试 2: 获取虚拟机列表')
  try {
    const vms = await listVMs()
    console.log(`✅ 找到 ${vms.length} 个虚拟机`)
    vms.forEach(vm => {
      console.log(`  - ${vm.name} (${vm.running ? '运行中' : '已关闭'})`)
    })
    console.log('')
  } catch (error) {
    console.log('❌ 失败:', error.message)
    return
  }
  
  // 测试 3: 虚拟机信息
  if (vms.length > 0) {
    console.log('测试 3: 获取虚拟机详细信息')
    try {
      const info = await getVMInfo(vms[0].name)
      console.log(`✅ 虚拟机信息:`)
      console.log(`  - 名称: ${info.name}`)
      console.log(`  - 内存: ${info.memory}MB`)
      console.log(`  - CPU: ${info.cpus}核`)
      console.log(`  - 存储: ${info.storage}GB`)
      console.log(`  - 状态: ${info.state}`)
    } catch (error) {
      console.log('❌ 失败:', error.message)
    }
  }
  
  console.log('\n🎉 测试完成!')
}

runTests().catch(error => {
  console.log('❌ 测试失败:', error.message)
  process.exit(1)
})
```

**Step 3: 测试完整应用**

Run: `chmod +x test.js && node test.js`
Expected: 所有测试通过

**Step 4: 提交文档和测试**

```bash
git add README.md test.js
git commit -m "docs: add README and test script"
```

### Task 8: 最终验证和优化

**文件:**
- Modify: `src/index.js`
- Modify: `src/utils/vbox.js`

**Step 1: 添加颜色输出和用户体验优化**

```javascript
// 在 src/index.js 中添加颜色支持
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function colorText(text, color) {
  return `${colors[color]}${text}${colors.reset}`
}

// 更新菜单显示
function showMainMenu() {
  console.clear()
  console.log(colorText(`
┌─────────────────────────────────────────┐
│     VirtualBox 虚拟机配置管理器           │
├─────────────────────────────────────────┤
│ 1. 列出所有虚拟机                        │
│ 2. 修改虚拟机配置                        │
│ 3. 查看虚拟机详情                        │
│ 4. 启动/关闭虚拟机                       │
│ 5. 退出                                 │
└─────────────────────────────────────────┘
  `, 'cyan'))
  
  rl.question(colorText('请选择操作 (1-5): ', 'yellow'), handleMainMenuChoice)
}
```

**Step 2: 最终功能测试**

Run: `npm start`
Expected: 完整的彩色交互式菜单，所有功能正常

**Step 3: 创建安装脚本**

```bash
#!/bin/bash
echo "🚀 安装 VBox Config..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

# 检查 VirtualBox
if ! command -v VBoxManage &> /dev/null; then
    echo "❌ 请先安装 VirtualBox: https://www.virtualbox.org/"
    exit 1
fi

# 安装依赖
npm install

# 创建全局链接
npm link

echo "✅ 安装完成!"
echo "使用方法: vbox-config"
```

**Step 4: 最终提交**

```bash
git add .
git commit -m "feat: complete interactive VirtualBox configuration tool"
git tag -a v1.0.0 -m "Initial release"
```

---

## 实现完成

这个交互式 VirtualBox 配置工具提供了：

- 🎯 **简单直观** - 菜单驱动，数字选择
- 🔧 **功能完整** - 支持内存、CPU、存储配置
- 📊 **信息丰富** - 详细的虚拟机状态显示
- 🛡️ **错误处理** - 完善的错误提示和恢复
- 🎨 **用户体验** - 彩色输出，清晰的界面

**使用方法:**
```bash
npm start
# 或者
./vbox-config
```

**心智负担最小:** 无需记忆命令，按照菜单提示操作即可。