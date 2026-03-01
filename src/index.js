#!/usr/bin/env node

const readline = require('readline')
const { 
  listVMs, 
  testVBoxManage, 
  getVMInfo, 
  modifyVMMemory, 
  modifyVMCPU, 
  startVM, 
  stopVM, 
  forceStopVM,
  getVMDiskInfo,
  modifyDiskSize,
  modifyVMVRAM,
  modifyGraphicsController,
  set3DAcceleration,
  set2DAcceleration,
  getDisplayInfo
} = require('./utils/vbox')

const { syncVagrantfile } = require('./utils/vagrantfile')

let rl = null
let isInteractive = process.stdin.isTTY

function getReadline() {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
  }
  return rl
}

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
  
  if (!isInteractive) {
    console.log('⚠️  非交互式模式，无法接收用户输入')
    console.log('请直接运行: ./vbox-config')
    process.exit(0)
  }
  
  const rl = getReadline()
  rl.question('请选择操作 (1-5): ', handleMainMenuChoice)
}

async function handleMainMenuChoice(choice) {
  const trimmedChoice = choice.trim()
  
  switch (trimmedChoice) {
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
      const rl5 = getReadline()
      rl5.close()
      process.exit(0)
      break
    default:
      console.log('❌ 无效选择，请输入 1-5')
      await pause()
      showMainMenu()
  }
}

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
        const vagrantMark = vm.isVagrant ? ' [Vagrant]' : ''
        console.log(`  ${index + 1}. ${vm.name}${vagrantMark} - ${status}`)
      })
      
      // 显示 Vagrant 虚拟机提示
      const vagrantVMs = vms.filter(vm => vm.isVagrant)
      if (vagrantVMs.length > 0) {
        console.log(`\n💡 提示：检测到 ${vagrantVMs.length} 个 Vagrant 虚拟机`)
        console.log('   Vagrant 虚拟机在修改配置后，可能需要重启才能生效')
      }
    }
  } catch (error) {
    console.log(`❌ 错误: ${error.message}`)
  }
  
  await pause()
  showMainMenu()
}

function pause() {
  return new Promise(resolve => {
    if (!isInteractive) {
      resolve()
      return
    }
    
    try {
      const rl = getReadline()
      rl.question('\n按回车键继续...', resolve)
    } catch (error) {
      resolve()
    }
  })
}

// 选择虚拟机进行配置
async function configureVM() {
  console.clear()
  console.log('🔧 修改虚拟机配置\n')
  
  try {
    const vms = await listVMs()
    
    if (vms.length === 0) {
      console.log('📭 没有找到虚拟机')
      await pause()
      showMainMenu()
      return
    }
    
    console.log('🖥️  选择要配置的虚拟机:\n')
    vms.forEach((vm, index) => {
      const status = vm.running ? '🟢 运行中' : '⏸️  已关闭'
      console.log(`  ${index + 1}. ${vm.name} - ${status}`)
    })
    console.log(`  ${vms.length + 1}. 返回主菜单`)
    
    const rl = getReadline()
    rl.question('\n请输入选择 (1-' + (vms.length + 1) + '): ', async (choice) => {
      const index = parseInt(choice.trim()) - 1
      
      if (index === vms.length) {
        showMainMenu()
        return
      }
      
      if (index < 0 || index >= vms.length) {
        console.log('❌ 无效选择')
        await pause()
        configureVM()
        return
      }
      
      const selectedVM = vms[index]
      await showConfigMenu(selectedVM.name, selectedVM.isVagrant)
    })
  } catch (error) {
    console.log(`❌ 错误: ${error.message}`)
    await pause()
    showMainMenu()
  }
}

// 显示配置菜单
async function showConfigMenu(vmName, isVagrant = false) {
  console.clear()
  const vagrantMark = isVagrant ? ' [Vagrant]' : ''
  console.log(`
┌─────────────────────────────────────────┐
│     配置虚拟机: ${vmName.padEnd(20)} │
├─────────────────────────────────────────┤
│ 1. 修改内存                              │
│ 2. 修改 CPU 核心数                       │
│ 3. 修改磁盘容量                          │
│ 4. 显示配置                              │
│ 5. 查看当前配置                          │
│ 6. 返回主菜单                            │
└─────────────────────────────────────────┘
  `)

  if (isVagrant) {
    console.log('💡 这是 Vagrant 虚拟机')
    console.log('   修改配置后，建议执行以下操作：')
    console.log('   1. 关闭虚拟机')
    console.log('   2. 运行: vagrant reload')
    console.log('')
  }

  const rl = getReadline()
  rl.question('请选择操作 (1-6): ', async (choice) => {
    switch (choice.trim()) {
      case '1':
        await modifyMemory(vmName, isVagrant)
        break
      case '2':
        await modifyCPU(vmName, isVagrant)
        break
      case '3':
        await modifyDisk(vmName, isVagrant)
        break
      case '4':
        await showDisplayConfigMenu(vmName, isVagrant)
        break
      case '5':
        await showVMConfig(vmName, isVagrant)
        break
      case '6':
        showMainMenu()
        break
      default:
        console.log('❌ 无效选择')
        await pause()
        showConfigMenu(vmName, isVagrant)
    }
  })
}

// 修改内存
async function modifyMemory(vmName, isVagrant = false) {
  console.clear()
  console.log(`🔧 修改 ${vmName} 的内存\n`)
  
  if (isVagrant) {
    console.log('⚠️  注意：这是 Vagrant 虚拟机')
    console.log('   修改内存后，需要重启虚拟机才能生效')
    console.log('   建议先关闭虚拟机，然后运行: vagrant reload\n')
  }
  
  try {
    const info = await getVMInfo(vmName)
    const currentMemory = parseInt(info.memory) || 1024
    
    console.log(`当前内存: ${currentMemory} MB`)
    console.log('支持的内存范围: 256 MB - 32768 MB')
    
    const rl = getReadline()
    rl.question('\n请输入新的内存大小 (MB): ', async (input) => {
      const memoryMB = parseInt(input.trim())
      
      if (isNaN(memoryMB) || memoryMB < 256 || memoryMB > 32768) {
        console.log('❌ 无效的内存大小')
        await pause()
        showConfigMenu(vmName, isVagrant)
        return
      }
      
      try {
        await modifyVMMemory(vmName, memoryMB)
        console.log(`✅ 内存已修改为 ${memoryMB} MB`)
        
        if (isVagrant) {
          console.log('\n🔄 正在自动同步 Vagrantfile...')
          const syncResult = await syncVagrantfile(vmName, 'memory', memoryMB)
          
          if (syncResult.success) {
            console.log(`✅ ${syncResult.message}`)
            console.log(`📁 Vagrantfile 位置: ${syncResult.vagrantfilePath}`)
          } else {
            console.log(`⚠️  ${syncResult.message}`)
            console.log('\n💡 请手动修改 Vagrantfile:')
            console.log(`   config.vm.provider "virtualbox" do |vb|`)
            console.log(`     vb.memory = "${memoryMB}"`)
            console.log(`   end`)
          }
          
          console.log('\n💡 下一步操作:')
          console.log('   1. 关闭虚拟机: vagrant halt')
          console.log('   2. 运行: vagrant reload')
        }
      } catch (error) {
        console.log(`❌ 修改失败: ${error.message}`)
      }
      
      await pause()
      showConfigMenu(vmName, isVagrant)
    })
  } catch (error) {
    console.log(`❌ 错误: ${error.message}`)
    await pause()
    showConfigMenu(vmName, isVagrant)
  }
}

// 修改 CPU
async function modifyCPU(vmName, isVagrant = false) {
  console.clear()
  console.log(`🔧 修改 ${vmName} 的 CPU 核心数\n`)
  
  if (isVagrant) {
    console.log('⚠️  注意：这是 Vagrant 虚拟机')
    console.log('   修改 CPU 后，需要重启虚拟机才能生效')
    console.log('   建议先关闭虚拟机，然后运行: vagrant reload\n')
  }
  
  try {
    const info = await getVMInfo(vmName)
    const currentCPUs = parseInt(info.cpus) || 1
    
    console.log(`当前 CPU: ${currentCPUs} 核心`)
    console.log('支持的 CPU 范围: 1 - 16 核心')
    
    const rl = getReadline()
    rl.question('\n请输入新的 CPU 核心数: ', async (input) => {
      const cpuCount = parseInt(input.trim())
      
      if (isNaN(cpuCount) || cpuCount < 1 || cpuCount > 16) {
        console.log('❌ 无效的 CPU 数量')
        await pause()
        showConfigMenu(vmName, isVagrant)
        return
      }
      
      try {
        await modifyVMCPU(vmName, cpuCount)
        console.log(`✅ CPU 已修改为 ${cpuCount} 核心`)
        
        if (isVagrant) {
          console.log('\n🔄 正在自动同步 Vagrantfile...')
          const syncResult = await syncVagrantfile(vmName, 'cpu', cpuCount)
          
          if (syncResult.success) {
            console.log(`✅ ${syncResult.message}`)
            console.log(`📁 Vagrantfile 位置: ${syncResult.vagrantfilePath}`)
          } else {
            console.log(`⚠️  ${syncResult.message}`)
            console.log('\n💡 请手动修改 Vagrantfile:')
            console.log(`   config.vm.provider "virtualbox" do |vb|`)
            console.log(`     vb.cpus = ${cpuCount}`)
            console.log(`   end`)
          }
          
          console.log('\n💡 下一步操作:')
          console.log('   1. 关闭虚拟机: vagrant halt')
          console.log('   2. 运行: vagrant reload')
        }
      } catch (error) {
        console.log(`❌ 修改失败: ${error.message}`)
      }
      
      await pause()
      showConfigMenu(vmName, isVagrant)
    })
  } catch (error) {
    console.log(`❌ 错误: ${error.message}`)
    await pause()
    showConfigMenu(vmName, isVagrant)
  }
}

// 修改磁盘容量
async function modifyDisk(vmName, isVagrant = false) {
  console.clear()
  console.log(`💾 修改 ${vmName} 的磁盘容量\n`)

  try {
    // 先检查虚拟机状态
    const info = await getVMInfo(vmName)
    const isRunning = info.VMState === 'running' || info.VMState === 'paused'
    
    if (isRunning) {
      console.log('⚠️  虚拟机当前正在运行！')
      console.log('   状态:', info.VMState)
      console.log('')
      console.log('❌ 无法修改磁盘容量')
      console.log('   原因：磁盘正在使用中，必须先关闭虚拟机')
      console.log('')
      console.log('💡 操作步骤：')
      if (isVagrant) {
        console.log('   1. 关闭虚拟机: vagrant halt')
        console.log('   2. 重新运行此工具修改磁盘容量')
        console.log('   3. 启动虚拟机: vagrant up')
      } else {
        console.log('   1. 关闭虚拟机（选项 4）')
        console.log('   2. 重新运行此工具修改磁盘容量')
        console.log('   3. 启动虚拟机（选项 4）')
      }
      console.log('')
      await pause()
      showConfigMenu(vmName, isVagrant)
      return
    }

    const disks = await getVMDiskInfo(vmName)

    if (disks.length === 0) {
      console.log('📭 没有找到可修改的磁盘')
      await pause()
      showConfigMenu(vmName, isVagrant)
      return
    }

    console.log('✅ 虚拟机已关闭，可以修改磁盘')
    console.log('')
    console.log('💿 可用磁盘:\n')
    disks.forEach((disk, index) => {
      console.log(`  ${index + 1}. ${disk.controller} 控制器 - ${disk.capacity}`)
      console.log(`     路径: ${disk.path}`)
      console.log(`     格式: ${disk.format}`)
      console.log('')
    })

    if (disks.length === 1) {
      // 只有一个磁盘，直接修改
      await modifyDiskSizeInteractive(disks[0], vmName, isVagrant)
    } else {
      // 多个磁盘，让用户选择
      const rl = getReadline()
      rl.question('请选择要修改的磁盘 (1-' + disks.length + '): ', async (choice) => {
        const index = parseInt(choice.trim()) - 1
        if (index < 0 || index >= disks.length) {
          console.log('❌ 无效选择')
          await pause()
          modifyDisk(vmName, isVagrant)
          return
        }
        await modifyDiskSizeInteractive(disks[index], vmName, isVagrant)
      })
    }
  } catch (error) {
    console.log(`❌ 错误: ${error.message}`)
    await pause()
    showConfigMenu(vmName, isVagrant)
  }
}

// 交互式修改磁盘大小
async function modifyDiskSizeInteractive(disk, vmName, isVagrant) {
  console.clear()
  console.log(`💾 修改磁盘容量\n`)
  console.log(`当前容量: ${disk.capacity}`)
  console.log(`磁盘路径: ${disk.path}`)
  console.log('')

  if (isVagrant) {
    console.log('⚠️  注意：这是 Vagrant 虚拟机的磁盘')
    console.log('   修改磁盘容量前，请确保：')
    console.log('   1. 虚拟机已关闭')
    console.log('   2. 已备份重要数据')
    console.log('   3. 修改后需要运行: vagrant reload\n')
  }

  console.log('支持的容量范围: 1 GB - 2048 GB')
  console.log('⚠️  注意：只能扩大容量，不能缩小\n')

  const rl = getReadline()
  rl.question('请输入新的磁盘容量 (GB): ', async (input) => {
    const newSizeGB = parseInt(input.trim())

    if (isNaN(newSizeGB) || newSizeGB < 1 || newSizeGB > 2048) {
      console.log('❌ 无效的磁盘容量')
      await pause()
      modifyDisk(vmName, isVagrant)
      return
    }

    if (newSizeGB <= disk.logicalSize) {
      console.log('❌ 新容量必须大于当前容量')
      await pause()
      modifyDisk(vmName, isVagrant)
      return
    }

    try {
      await modifyDiskSize(disk.path, newSizeGB)
      console.log(`✅ 磁盘容量已修改为 ${newSizeGB} GB`)

      if (isVagrant) {
        console.log('\n🔄 正在尝试同步 Vagrantfile...')
        const syncResult = await syncVagrantfile(vmName, 'disk', newSizeGB)
        
        if (syncResult.success) {
          console.log(`✅ ${syncResult.message}`)
          console.log(`📁 Vagrantfile 位置: ${syncResult.vagrantfilePath}`)
        } else {
          console.log(`⚠️  ${syncResult.message}`)
          console.log('\n💡 磁盘扩容说明:')
          console.log('   - 磁盘扩容是永久的，不会随 vagrant destroy 丢失')
          console.log('   - 但 vagrant destroy + vagrant up 会重新创建默认大小的磁盘')
          console.log('   - 如需在 Vagrantfile 中配置磁盘大小，请安装 vagrant-disksize 插件:')
          console.log('     vagrant plugin install vagrant-disksize')
          console.log(`   - 然后在 Vagrantfile 中添加: config.disksize.size = "${newSizeGB}GB"`)
        }
        
        console.log('\n💡 下一步操作:')
        console.log('   1. 请确保虚拟机已关闭')
        console.log('   2. 运行: vagrant reload')
        console.log('   3. 在虚拟机内部使用分区工具扩展文件系统')
      } else {
        console.log('\n💡 提示:')
        console.log('   1. 启动虚拟机')
        console.log('   2. 使用分区工具（如 fdisk、parted）扩展分区')
        console.log('   3. 扩展文件系统以使用新空间')
      }
    } catch (error) {
      console.log(`❌ 修改失败: ${error.message}`)
      if (error.message.includes('resize')) {
        console.log('\n💡 常见原因:')
        console.log('   - 虚拟机正在运行，请先关闭虚拟机')
        console.log('   - 磁盘格式不支持在线扩容')
        console.log('   - 磁盘有快照，需要先删除快照')
      }
    }

    await pause()
    showConfigMenu(vmName, isVagrant)
  })
}

async function showDisplayConfigMenu(vmName, isVagrant = false) {
  console.clear()
  console.log(`🖥️  显示配置: ${vmName}\n`)

  try {
    const displayInfo = await getDisplayInfo(vmName)

    console.log('【当前显示配置】')
    console.log(`显存: ${displayInfo.vram} MB`)
    console.log(`图形控制器: ${displayInfo.graphicsController}`)
    console.log(`3D 加速: ${displayInfo.accelerate3d ? '已启用' : '已禁用'}`)
    console.log(`2D 加速: ${displayInfo.accelerate2dvideo ? '已启用' : '已禁用'}`)
    console.log('')
  } catch (error) {
    console.log(`❌ 获取显示配置失败: ${error.message}\n`)
  }

  console.log(`
┌─────────────────────────────────────────┐
│     显示配置菜单                         │
├─────────────────────────────────────────┤
│ 1. 修改显存                              │
│ 2. 修改图形控制器                        │
│ 3. 切换 3D 加速                          │
│ 4. 切换 2D 加速                          │
│ 5. 一键优化 (Ubuntu 桌面推荐)            │
│ 6. 返回配置菜单                          │
└─────────────────────────────────────────┘
  `)

  const rl = getReadline()
  rl.question('请选择操作 (1-6): ', async (choice) => {
    switch (choice.trim()) {
      case '1':
        await modifyVRAM(vmName, isVagrant)
        break
      case '2':
        await modifyGraphicsControllerMenu(vmName, isVagrant)
        break
      case '3':
        await toggle3DAcceleration(vmName, isVagrant)
        break
      case '4':
        await toggle2DAcceleration(vmName, isVagrant)
        break
      case '5':
        await applyDisplayPreset(vmName, isVagrant)
        break
      case '6':
        showConfigMenu(vmName, isVagrant)
        break
      default:
        console.log('❌ 无效选择')
        await pause()
        showDisplayConfigMenu(vmName, isVagrant)
    }
  })
}

async function modifyVRAM(vmName, isVagrant = false) {
  console.clear()
  console.log(`🎮 修改 ${vmName} 的显存\n`)

  try {
    const displayInfo = await getDisplayInfo(vmName)
    
    console.log(`当前显存: ${displayInfo.vram} MB`)
    console.log('支持的显存范围: 1 MB - 256 MB')
    console.log('')
    console.log('💡 推荐配置:')
    console.log('   - 无界面/服务器模式: 16 MB')
    console.log('   - 桌面环境: 64-128 MB')
    console.log('   - 3D 应用/开发: 128-256 MB')
    
    const rl = getReadline()
    rl.question('\n请输入新的显存大小 (MB): ', async (input) => {
      const vramMB = parseInt(input.trim())
      
      if (isNaN(vramMB) || vramMB < 1 || vramMB > 256) {
        console.log('❌ 无效的显存大小')
        await pause()
        showDisplayConfigMenu(vmName, isVagrant)
        return
      }
      
      try {
        await modifyVMVRAM(vmName, vramMB)
        console.log(`✅ 显存已修改为 ${vramMB} MB`)
        
        if (isVagrant) {
          console.log('\n🔄 正在自动同步 Vagrantfile...')
          const syncResult = await syncVagrantfile(vmName, 'vram', vramMB)
          
          if (syncResult.success) {
            console.log(`✅ ${syncResult.message}`)
            console.log(`📁 Vagrantfile 位置: ${syncResult.vagrantfilePath}`)
          } else {
            console.log(`⚠️  ${syncResult.message}`)
            console.log('\n💡 请手动修改 Vagrantfile:')
            console.log(`   vb.customize ["modifyvm", :id, "--vram", "${vramMB}"]`)
          }
        }
      } catch (error) {
        console.log(`❌ 修改失败: ${error.message}`)
      }
      
      await pause()
      showDisplayConfigMenu(vmName, isVagrant)
    })
  } catch (error) {
    console.log(`❌ 错误: ${error.message}`)
    await pause()
    showDisplayConfigMenu(vmName, isVagrant)
  }
}

async function modifyGraphicsControllerMenu(vmName, isVagrant = false) {
  console.clear()
  console.log(`🎨 修改 ${vmName} 的图形控制器\n`)

  try {
    const displayInfo = await getDisplayInfo(vmName)
    
    console.log(`当前图形控制器: ${displayInfo.graphicsController}`)
    console.log('')
    console.log('可用的图形控制器:')
    console.log('  1. VMSVGA    - Linux 系统推荐 (Ubuntu, CentOS 等)')
    console.log('  2. VBoxSVGA  - Windows 系统推荐')
    console.log('  3. VBoxVGA   - 旧版兼容模式')
    console.log('  4. None      - 无图形控制器')
    console.log('  5. 返回')
    
    const rl = getReadline()
    rl.question('\n请选择图形控制器 (1-5): ', async (input) => {
      const choice = input.trim()
      let controller = null
      
      switch (choice) {
        case '1':
          controller = 'vmsvga'
          break
        case '2':
          controller = 'vboxsvga'
          break
        case '3':
          controller = 'vboxvga'
          break
        case '4':
          controller = 'none'
          break
        case '5':
          showDisplayConfigMenu(vmName, isVagrant)
          return
        default:
          console.log('❌ 无效选择')
          await pause()
          modifyGraphicsControllerMenu(vmName, isVagrant)
          return
      }
      
      try {
        await modifyGraphicsController(vmName, controller)
        console.log(`✅ 图形控制器已修改为 ${controller}`)
        
        if (isVagrant) {
          console.log('\n🔄 正在自动同步 Vagrantfile...')
          const syncResult = await syncVagrantfile(vmName, 'graphicscontroller', controller)
          
          if (syncResult.success) {
            console.log(`✅ ${syncResult.message}`)
            console.log(`📁 Vagrantfile 位置: ${syncResult.vagrantfilePath}`)
          } else {
            console.log(`⚠️  ${syncResult.message}`)
            console.log('\n💡 请手动修改 Vagrantfile:')
            console.log(`   vb.customize ["modifyvm", :id, "--graphicscontroller", "${controller}"]`)
          }
        }
      } catch (error) {
        console.log(`❌ 修改失败: ${error.message}`)
      }
      
      await pause()
      showDisplayConfigMenu(vmName, isVagrant)
    })
  } catch (error) {
    console.log(`❌ 错误: ${error.message}`)
    await pause()
    showDisplayConfigMenu(vmName, isVagrant)
  }
}

async function toggle3DAcceleration(vmName, isVagrant = false) {
  console.clear()
  console.log(`🎮 切换 ${vmName} 的 3D 加速\n`)

  try {
    const displayInfo = await getDisplayInfo(vmName)
    const newState = !displayInfo.accelerate3d
    
    console.log(`当前状态: ${displayInfo.accelerate3d ? '已启用' : '已禁用'}`)
    console.log(`将切换为: ${newState ? '启用' : '禁用'}`)
    
    const rl = getReadline()
    rl.question('\n确认切换? (y/n): ', async (input) => {
      if (input.trim().toLowerCase() !== 'y') {
        showDisplayConfigMenu(vmName, isVagrant)
        return
      }
      
      try {
        await set3DAcceleration(vmName, newState)
        console.log(`✅ 3D 加速已${newState ? '启用' : '禁用'}`)
        
        if (isVagrant) {
          console.log('\n🔄 正在自动同步 Vagrantfile...')
          const syncResult = await syncVagrantfile(vmName, 'accelerate3d', newState)
          
          if (syncResult.success) {
            console.log(`✅ ${syncResult.message}`)
            console.log(`📁 Vagrantfile 位置: ${syncResult.vagrantfilePath}`)
          } else {
            console.log(`⚠️  ${syncResult.message}`)
            console.log('\n💡 请手动修改 Vagrantfile:')
            console.log(`   vb.customize ["modifyvm", :id, "--accelerate3d", "${newState ? 'on' : 'off'}"]`)
          }
        }
        
        console.log('\n💡 提示: 3D 加速需要安装 Guest Additions 才能正常工作')
      } catch (error) {
        console.log(`❌ 修改失败: ${error.message}`)
      }
      
      await pause()
      showDisplayConfigMenu(vmName, isVagrant)
    })
  } catch (error) {
    console.log(`❌ 错误: ${error.message}`)
    await pause()
    showDisplayConfigMenu(vmName, isVagrant)
  }
}

async function toggle2DAcceleration(vmName, isVagrant = false) {
  console.clear()
  console.log(`🎮 切换 ${vmName} 的 2D 加速\n`)

  try {
    const displayInfo = await getDisplayInfo(vmName)
    const newState = !displayInfo.accelerate2dvideo
    
    console.log(`当前状态: ${displayInfo.accelerate2dvideo ? '已启用' : '已禁用'}`)
    console.log(`将切换为: ${newState ? '启用' : '禁用'}`)
    
    const rl = getReadline()
    rl.question('\n确认切换? (y/n): ', async (input) => {
      if (input.trim().toLowerCase() !== 'y') {
        showDisplayConfigMenu(vmName, isVagrant)
        return
      }
      
      try {
        await set2DAcceleration(vmName, newState)
        console.log(`✅ 2D 加速已${newState ? '启用' : '禁用'}`)
        
        if (isVagrant) {
          console.log('\n🔄 正在自动同步 Vagrantfile...')
          const syncResult = await syncVagrantfile(vmName, 'accelerate2d', newState)
          
          if (syncResult.success) {
            console.log(`✅ ${syncResult.message}`)
            console.log(`📁 Vagrantfile 位置: ${syncResult.vagrantfilePath}`)
          } else {
            console.log(`⚠️  ${syncResult.message}`)
            console.log('\n💡 请手动修改 Vagrantfile:')
            console.log(`   vb.customize ["modifyvm", :id, "--accelerate2dvideo", "${newState ? 'on' : 'off'}"]`)
          }
        }
      } catch (error) {
        console.log(`❌ 修改失败: ${error.message}`)
      }
      
      await pause()
      showDisplayConfigMenu(vmName, isVagrant)
    })
  } catch (error) {
    console.log(`❌ 错误: ${error.message}`)
    await pause()
    showDisplayConfigMenu(vmName, isVagrant)
  }
}

async function applyDisplayPreset(vmName, isVagrant = false) {
  console.clear()
  console.log(`⚡ 一键优化显示配置: ${vmName}\n`)

  console.log('请选择预设配置:')
  console.log('')
  console.log('  1. 服务器模式 (无界面)')
  console.log('     - 显存: 16 MB')
  console.log('     - 3D 加速: 关闭')
  console.log('     - 图形控制器: VMSVGA')
  console.log('')
  console.log('  2. 桌面模式 (Ubuntu 推荐) ⭐')
  console.log('     - 显存: 128 MB')
  console.log('     - 3D 加速: 开启')
  console.log('     - 图形控制器: VMSVGA')
  console.log('')
  console.log('  3. 开发模式 (GUI + 3D)')
  console.log('     - 显存: 256 MB')
  console.log('     - 3D 加速: 开启')
  console.log('     - 图形控制器: VMSVGA')
  console.log('')
  console.log('  4. 返回')
  
  const rl = getReadline()
  rl.question('\n请选择预设 (1-4): ', async (input) => {
    const choice = input.trim()
    let preset = null
    
    switch (choice) {
      case '1':
        preset = { vram: 16, accelerate3d: false, controller: 'vmsvga' }
        break
      case '2':
        preset = { vram: 128, accelerate3d: true, controller: 'vmsvga' }
        break
      case '3':
        preset = { vram: 256, accelerate3d: true, controller: 'vmsvga' }
        break
      case '4':
        showDisplayConfigMenu(vmName, isVagrant)
        return
      default:
        console.log('❌ 无效选择')
        await pause()
        applyDisplayPreset(vmName, isVagrant)
        return
    }
    
    console.log('\n🔄 正在应用预设配置...')
    
    try {
      await modifyVMVRAM(vmName, preset.vram)
      console.log(`✅ 显存已设置为 ${preset.vram} MB`)
      
      await set3DAcceleration(vmName, preset.accelerate3d)
      console.log(`✅ 3D 加速已${preset.accelerate3d ? '启用' : '禁用'}`)
      
      await modifyGraphicsController(vmName, preset.controller)
      console.log(`✅ 图形控制器已设置为 ${preset.controller}`)
      
      if (isVagrant) {
        console.log('\n🔄 正在自动同步 Vagrantfile...')
        
        await syncVagrantfile(vmName, 'vram', preset.vram)
        await syncVagrantfile(vmName, 'accelerate3d', preset.accelerate3d)
        await syncVagrantfile(vmName, 'graphicscontroller', preset.controller)
        
        console.log('✅ Vagrantfile 已同步')
      }
      
      console.log('\n🎉 预设配置已应用成功!')
      console.log('💡 提示: 如果虚拟机正在运行，需要重启才能生效')
    } catch (error) {
      console.log(`❌ 应用预设失败: ${error.message}`)
    }
    
    await pause()
    showDisplayConfigMenu(vmName, isVagrant)
  })
}

// 显示虚拟机配置
async function showVMConfig(vmName, isVagrant = false) {
  console.clear()
  console.log(`📊 ${vmName} 的配置信息\n`)

  if (isVagrant) {
    console.log('🏷️  类型: Vagrant 虚拟机\n')
  }

  try {
    const info = await getVMInfo(vmName)

    console.log('【基本信息】')
    console.log(`名称: ${info.name || vmName}`)
    console.log(`UUID: ${info.UUID || 'N/A'}`)
    console.log(`状态: ${info.VMState || 'N/A'}`)
    console.log('')

    console.log('【硬件配置】')
    console.log(`内存: ${info.memory || 'N/A'} MB`)
    console.log(`CPU: ${info.cpus || 'N/A'} 核心`)
    console.log('')

    console.log('【显示配置】')
    try {
      const displayInfo = await getDisplayInfo(vmName)
      console.log(`显存: ${displayInfo.vram} MB`)
      console.log(`图形控制器: ${displayInfo.graphicsController}`)
      console.log(`3D 加速: ${displayInfo.accelerate3d ? '已启用' : '已禁用'}`)
      console.log(`2D 加速: ${displayInfo.accelerate2dvideo ? '已启用' : '已禁用'}`)
    } catch (error) {
      console.log(`显存: ${info.vram || 'N/A'} MB`)
    }
    console.log('')

    console.log('【磁盘信息】')
    try {
      const disks = await getVMDiskInfo(vmName)
      if (disks.length === 0) {
        console.log('💿 无磁盘信息')
      } else {
        disks.forEach((disk, index) => {
          console.log(`磁盘 ${index + 1}:`)
          console.log(`  控制器: ${disk.controller}`)
          console.log(`  容量: ${disk.capacity}`)
          console.log(`  格式: ${disk.format}`)
          console.log(`  路径: ${disk.path}`)
          console.log('')
        })
      }
    } catch (error) {
      console.log(`💿 无法获取磁盘信息: ${error.message}`)
    }

    if (isVagrant) {
      console.log('💡 Vagrant 提示:')
      console.log('   如需永久保存配置，请修改 Vagrantfile')
      console.log('   然后运行: vagrant reload')
    }
  } catch (error) {
    console.log(`❌ 错误: ${error.message}`)
  }

  await pause()
  showConfigMenu(vmName, isVagrant)
}

// 查看虚拟机详情
async function showVMDetails() {
  console.clear()
  console.log('📊 查看虚拟机详情\n')
  
  try {
    const vms = await listVMs()
    
    if (vms.length === 0) {
      console.log('📭 没有找到虚拟机')
      await pause()
      showMainMenu()
      return
    }
    
    console.log('🖥️  选择要查看的虚拟机:\n')
    vms.forEach((vm, index) => {
      const status = vm.running ? '🟢 运行中' : '⏸️  已关闭'
      console.log(`  ${index + 1}. ${vm.name} - ${status}`)
    })
    console.log(`  ${vms.length + 1}. 返回主菜单`)
    
    const rl = getReadline()
    rl.question('\n请输入选择 (1-' + (vms.length + 1) + '): ', async (choice) => {
      const index = parseInt(choice.trim()) - 1
      
      if (index === vms.length) {
        showMainMenu()
        return
      }
      
      if (index < 0 || index >= vms.length) {
        console.log('❌ 无效选择')
        await pause()
        showVMDetails()
        return
      }
      
      const selectedVM = vms[index]
      await showVMConfig(selectedVM.name)
    })
  } catch (error) {
    console.log(`❌ 错误: ${error.message}`)
    await pause()
    showMainMenu()
  }
}

// 启动/关闭虚拟机
async function toggleVM() {
  console.clear()
  console.log('🔄 启动/关闭虚拟机\n')
  
  try {
    const vms = await listVMs()
    
    if (vms.length === 0) {
      console.log('📭 没有找到虚拟机')
      await pause()
      showMainMenu()
      return
    }
    
    console.log('🖥️  选择要操作的虚拟机:\n')
    vms.forEach((vm, index) => {
      const status = vm.running ? '🟢 运行中' : '⏸️  已关闭'
      console.log(`  ${index + 1}. ${vm.name} - ${status}`)
    })
    console.log(`  ${vms.length + 1}. 返回主菜单`)
    
    const rl = getReadline()
    rl.question('\n请输入选择 (1-' + (vms.length + 1) + '): ', async (choice) => {
      const index = parseInt(choice.trim()) - 1
      
      if (index === vms.length) {
        showMainMenu()
        return
      }
      
      if (index < 0 || index >= vms.length) {
        console.log('❌ 无效选择')
        await pause()
        toggleVM()
        return
      }
      
      const selectedVM = vms[index]
      await showToggleMenu(selectedVM)
    })
  } catch (error) {
    console.log(`❌ 错误: ${error.message}`)
    await pause()
    showMainMenu()
  }
}

// 显示启动/关闭菜单
async function showToggleMenu(vm) {
  console.clear()
  const status = vm.running ? '🟢 运行中' : '⏸️  已关闭'
  
  console.log(`
┌─────────────────────────────────────────┐
│     操作虚拟机: ${vm.name.padEnd(20)} │
├─────────────────────────────────────────┤
│ 当前状态: ${status.padEnd(28)} │
├─────────────────────────────────────────┤
│ 1. ${vm.running ? '关闭虚拟机' : '启动虚拟机'}                          │
│ 2. ${vm.running ? '强制关闭' : '返回'}                              │
│ 3. 返回主菜单                            │
└─────────────────────────────────────────┘
  `)
  
  const rl = getReadline()
  rl.question('请选择操作 (1-3): ', async (choice) => {
    switch (choice.trim()) {
      case '1':
        if (vm.running) {
          try {
            await stopVM(vm.name)
            console.log(`✅ ${vm.name} 正在关闭...`)
          } catch (error) {
            console.log(`❌ 关闭失败: ${error.message}`)
          }
        } else {
          try {
            await startVM(vm.name)
            console.log(`✅ ${vm.name} 正在启动...`)
          } catch (error) {
            console.log(`❌ 启动失败: ${error.message}`)
          }
        }
        await pause()
        toggleVM()
        break
      case '2':
        if (vm.running) {
          try {
            await forceStopVM(vm.name)
            console.log(`✅ ${vm.name} 已强制关闭`)
          } catch (error) {
            console.log(`❌ 强制关闭失败: ${error.message}`)
          }
          await pause()
          toggleVM()
        } else {
          toggleVM()
        }
        break
      case '3':
        showMainMenu()
        break
      default:
        console.log('❌ 无效选择')
        await pause()
        showToggleMenu(vm)
    }
  })
}

// 主函数
async function main() {
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
  showMainMenu()
}

// 启动应用
main().catch(error => {
  console.log('❌ 应用启动失败:', error.message)
  process.exit(1)
})

// 导出函数供测试使用
module.exports = {
  showMainMenu,
  handleMainMenuChoice,
  showVMList,
  pause,
  configureVM,
  showVMDetails,
  toggleVM,
  main,
  showConfigMenu,
  modifyMemory,
  modifyCPU,
  modifyDisk,
  modifyDiskSizeInteractive,
  showVMConfig,
  showToggleMenu,
  showDisplayConfigMenu,
  modifyVRAM,
  modifyGraphicsControllerMenu,
  toggle3DAcceleration,
  toggle2DAcceleration,
  applyDisplayPreset
}