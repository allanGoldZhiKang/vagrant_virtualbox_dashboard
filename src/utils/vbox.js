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

async function listVMs() {
  try {
    const output = await executeVBoxManage(['list', 'vms'])
    const vms = []
    output.split('\n').forEach(line => {
      // 修复：VBoxManage 输出格式为 "name" {uuid}
      const match = line.match(/^"([^"]+)"\s+\{([a-f0-9-]+)\}$/)
      if (match) {
        vms.push({
          name: match[1],
          uuid: match[2],
          running: false,
          isVagrant: match[1].includes('vagrant') || match[1].includes('Vagrant')
        })
      }
    })
    
    // 检查运行中的虚拟机
    try {
      const runningOutput = await executeVBoxManage(['list', 'runningvms'])
      runningOutput.split('\n').forEach(line => {
        const match = line.match(/^"([^"]+)"\s+\{([a-f0-9-]+)\}$/)
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

// 获取虚拟机详细信息
async function getVMInfo(vmName) {
  try {
    const output = await executeVBoxManage(['showvminfo', vmName, '--machinereadable'])
    const info = {}
    
    output.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)="?([^"]*)"?$/)
      if (match) {
        info[match[1]] = match[2]
      }
    })
    
    return info
  } catch (error) {
    throw new Error(`获取虚拟机信息失败: ${error.message}`)
  }
}

// 修改虚拟机内存
async function modifyVMMemory(vmName, memoryMB) {
  try {
    // 验证内存范围
    if (memoryMB < 256 || memoryMB > 32768) {
      throw new Error('内存必须在 256MB 到 32768MB 之间')
    }
    
    await executeVBoxManage(['modifyvm', vmName, '--memory', memoryMB.toString()])
    return true
  } catch (error) {
    throw new Error(`修改内存失败: ${error.message}`)
  }
}

// 修改虚拟机 CPU
async function modifyVMCPU(vmName, cpuCount) {
  try {
    // 验证 CPU 范围
    if (cpuCount < 1 || cpuCount > 16) {
      throw new Error('CPU 数量必须在 1 到 16 之间')
    }
    
    await executeVBoxManage(['modifyvm', vmName, '--cpus', cpuCount.toString()])
    return true
  } catch (error) {
    throw new Error(`修改 CPU 失败: ${error.message}`)
  }
}

// 启动虚拟机
async function startVM(vmName) {
  try {
    await executeVBoxManage(['startvm', vmName, '--type', 'headless'])
    return true
  } catch (error) {
    throw new Error(`启动虚拟机失败: ${error.message}`)
  }
}

// 关闭虚拟机
async function stopVM(vmName) {
  try {
    await executeVBoxManage(['controlvm', vmName, 'acpipowerbutton'])
    return true
  } catch (error) {
    throw new Error(`关闭虚拟机失败: ${error.message}`)
  }
}

// 强制关闭虚拟机
async function forceStopVM(vmName) {
  try {
    await executeVBoxManage(['controlvm', vmName, 'poweroff'])
    return true
  } catch (error) {
    throw new Error(`强制关闭虚拟机失败: ${error.message}`)
  }
}

// 检查是否是磁盘文件
function isDiskFile(path) {
  if (!path || path === 'none') return false
  const diskExtensions = ['.vdi', '.vmdk', '.vhd', '.hdd']
  return diskExtensions.some(ext => path.toLowerCase().endsWith(ext))
}

// 获取虚拟机的磁盘信息
async function getVMDiskInfo(vmName) {
  try {
    const info = await getVMInfo(vmName)
    const disks = []
    
    // 方法1: 检查 SATA/IDE/SCSI 控制器（旧格式）
    for (let i = 0; i < 4; i++) {
      const sataKey = `SATAController-${i}`
      const ideKey = `IDEController-${i}`
      const scsiKey = `SCSIController-${i}`
      
      // 检查 SATA 控制器
      if (info[sataKey] && isDiskFile(info[sataKey])) {
        const diskPath = info[sataKey]
        const diskInfo = await getDiskDetails(diskPath)
        if (diskInfo) {
          disks.push({
            controller: 'SATA',
            port: i,
            path: diskPath,
            ...diskInfo
          })
        }
      }
      
      // 检查 IDE 控制器
      if (info[ideKey] && isDiskFile(info[ideKey])) {
        const diskPath = info[ideKey]
        const diskInfo = await getDiskDetails(diskPath)
        if (diskInfo) {
          disks.push({
            controller: 'IDE',
            port: i,
            path: diskPath,
            ...diskInfo
          })
        }
      }
      
      // 检查 SCSI 控制器
      if (info[scsiKey] && isDiskFile(info[scsiKey])) {
        const diskPath = info[scsiKey]
        const diskInfo = await getDiskDetails(diskPath)
        if (diskInfo) {
          disks.push({
            controller: 'SCSI',
            port: i,
            path: diskPath,
            ...diskInfo
          })
        }
      }
    }
    
    // 方法2: 从 StorageController 信息中提取（新格式，Vagrant 使用）
    if (disks.length === 0) {
      // 查找所有存储控制器
      const controllers = []
      for (let i = 0; i < 8; i++) {
        const nameKey = `storagecontrollername${i}`
        if (info[nameKey]) {
          controllers.push({
            index: i,
            name: info[nameKey]
          })
        }
      }
      
      // 遍历每个控制器查找磁盘
      for (const controller of controllers) {
        // 尝试不同的端口和设备组合
        for (let port = 0; port < 16; port++) {
          for (let device = 0; device < 2; device++) {
            const diskKey = `"${controller.name}-${port}-${device}"`
            const diskPath = info[diskKey]
            
            if (diskPath && isDiskFile(diskPath)) {
              const diskInfo = await getDiskDetails(diskPath)
              if (diskInfo) {
                disks.push({
                  controller: controller.name,
                  port: port,
                  device: device,
                  path: diskPath,
                  ...diskInfo
                })
              }
            }
          }
        }
      }
    }
    
    return disks
  } catch (error) {
    throw new Error(`获取磁盘信息失败: ${error.message}`)
  }
}

// 获取磁盘详细信息
async function getDiskDetails(diskPath) {
  try {
    const output = await executeVBoxManage(['showmediuminfo', diskPath])
    const info = {}
    
    output.split('\n').forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':').map(s => s.trim())
        info[key.toLowerCase().replace(/\s+/g, '')] = value
      }
    })
    
    // 提取容量信息
    let capacity = '未知'
    let logicalSize = 0
    
    if (info.capacity) {
      capacity = info.capacity
      // 解析容量数值
      const match = capacity.match(/([\d.]+)\s*(\w+)/)
      if (match) {
        const value = parseFloat(match[1])
        const unit = match[2].toLowerCase()
        if (unit === 'gb') {
          logicalSize = value
        } else if (unit === 'mb') {
          logicalSize = value / 1024
        } else if (unit === 'tb') {
          logicalSize = value * 1024
        }
      }
    }
    
    // 提取格式信息（VBoxManage 使用 "storageformat"）
    const format = info.storageformat || info.format || '未知'
    
    return {
      path: diskPath,
      capacity: capacity,
      logicalSize: logicalSize,
      format: format,
      type: info.type || 'normal'
    }
  } catch (error) {
    return null
  }
}

// 修改磁盘容量
async function modifyDiskSize(diskPath, newSizeGB) {
  try {
    // 验证容量范围
    if (newSizeGB < 1 || newSizeGB > 2048) {
      throw new Error('磁盘容量必须在 1GB 到 2048GB 之间')
    }
    
    // 将 GB 转换为 MB (VBoxManage 使用 MB)
    const newSizeMB = Math.floor(newSizeGB * 1024)
    
    await executeVBoxManage(['modifymedium', diskPath, '--resize', newSizeMB.toString()])
    return true
  } catch (error) {
    // 提供更友好的错误信息
    if (error.message.includes('VBOX_E_INVALID_OBJECT_STATE') || 
        error.message.includes('Failed to lock media')) {
      throw new Error('磁盘正在使用中，请先关闭虚拟机再修改磁盘容量')
    }
    if (error.message.includes('cannot be resized')) {
      throw new Error('此磁盘格式不支持在线扩容，请先关闭虚拟机')
    }
    throw new Error(`修改磁盘容量失败: ${error.message}`)
  }
}

module.exports = { 
  executeVBoxManage,
  testVBoxManage, 
  listVMs,
  getVMInfo,
  modifyVMMemory,
  modifyVMCPU,
  startVM,
  stopVM,
  forceStopVM,
  getVMDiskInfo,
  modifyDiskSize
}