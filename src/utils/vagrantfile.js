const fs = require('fs').promises
const path = require('path')

/**
 * 查找 Vagrantfile 的路径
 * 通过分析虚拟机名称来推断 Vagrant 项目目录
 */
async function findVagrantfile(vmName) {
  try {
    // Vagrant 虚拟机名称通常包含路径信息
    // 例如："vagrant_default_1234567890_12345"
    // 或者目录名作为前缀

    // 尝试从虚拟机信息中获取路径
    const { execSync } = require('child_process')

    // 获取虚拟机的详细信息
    const output = execSync(`VBoxManage showvminfo "${vmName}" --machinereadable`, {
      encoding: 'utf8',
      timeout: 10000
    })

    // 查找配置文件路径
    const cfgFileMatch = output.match(/CfgFile="([^"]+)"/)
    if (cfgFileMatch) {
      const cfgPath = cfgFileMatch[1]
      // 配置文件通常在 .vagrant/machines/<name>/virtualbox/ 目录下
      // 或者直接在 VirtualBox VMs/<name>/ 目录下
      // 向上查找到 Vagrant 项目根目录

      let currentDir = path.dirname(cfgPath)

      // 向上查找最多 5 层目录
      for (let i = 0; i < 5; i++) {
        const vagrantfilePath = path.join(currentDir, 'Vagrantfile')

        try {
          await fs.access(vagrantfilePath)
          return vagrantfilePath
        } catch {
          // 继续向上查找
          const parentDir = path.dirname(currentDir)
          if (parentDir === currentDir) break
          currentDir = parentDir
        }
      }

      // 如果向上查找失败，尝试从虚拟机名称推断路径
      // Vagrant 虚拟机名称格式: <dir>_default_<timestamp>_<id>
      // 目录名可能包含下划线，例如：my_virtual_machine_default_xxx
      const defaultIndex = vmName.indexOf('_default_')
      if (defaultIndex > 0) {
        // 提取目录名（_default_ 之前的所有内容）
        const possibleDirName = vmName.substring(0, defaultIndex)

        // 在常见位置查找
        const searchPaths = [
          path.join(process.env.HOME || process.env.USERPROFILE, 'Documents', possibleDirName),
          path.join(process.env.HOME || process.env.USERPROFILE, 'projects', possibleDirName),
          path.join(process.env.HOME || process.env.USERPROFILE, possibleDirName),
          path.join(process.env.HOME || process.env.USERPROFILE, 'workspace', possibleDirName),
        ]

        for (const searchPath of searchPaths) {
          const vagrantfilePath = path.join(searchPath, 'Vagrantfile')
          try {
            await fs.access(vagrantfilePath)
            return vagrantfilePath
          } catch {
            // 继续查找
          }
        }
      }
    }

    // 如果上述方法失败，尝试从常见位置查找
    const commonPaths = [
      process.cwd(),
      path.join(process.env.HOME || process.env.USERPROFILE, 'vagrant'),
      path.join(process.env.HOME || process.env.USERPROFILE, 'Vagrant'),
      path.join(process.env.HOME || process.env.USERPROFILE, 'projects'),
    ]

    for (const basePath of commonPaths) {
      try {
        // 尝试查找包含虚拟机名称的目录
        const entries = await fs.readdir(basePath, { withFileTypes: true })

        for (const entry of entries) {
          if (entry.isDirectory()) {
            const vagrantfilePath = path.join(basePath, entry.name, 'Vagrantfile')

            try {
              await fs.access(vagrantfilePath)
              // 检查这个 Vagrantfile 是否包含我们的虚拟机
              const content = await fs.readFile(vagrantfilePath, 'utf8')

              // 简单的启发式检查：虚拟机名称是否包含目录名
              if (vmName.toLowerCase().includes(entry.name.toLowerCase()) ||
                  entry.name.toLowerCase().includes(vmName.toLowerCase().split('_')[0])) {
                return vagrantfilePath
              }
            } catch {
              // 继续查找
            }
          }
        }
      } catch {
        // 路径不存在，继续下一个
      }
    }

    return null
  } catch (error) {
    console.log(`查找 Vagrantfile 失败: ${error.message}`)
    return null
  }
}

/**
 * 读取并解析 Vagrantfile
 */
async function readVagrantfile(vagrantfilePath) {
  try {
    const content = await fs.readFile(vagrantfilePath, 'utf8')
    return content
  } catch (error) {
    throw new Error(`读取 Vagrantfile 失败: ${error.message}`)
  }
}

/**
 * 更新 Vagrantfile 中的内存配置
 */
function updateVagrantfileMemory(content, memoryMB) {
  // 查找并替换内存配置
  // 支持多种格式：
  // vb.memory = "1024"
  // vb.memory = 1024
  // vb.customize ["modifyvm", :id, "--memory", "1024"]

  let updated = content

  // 方法1: 替换 vb.memory = "xxx" 或 vb.memory = xxx
  const memoryRegex = /(vb\.memory\s*=\s*)(["']?)(\d+)(["']?)/
  if (memoryRegex.test(updated)) {
    updated = updated.replace(memoryRegex, `$1"${memoryMB}"`)
  } else {
    // 如果没有找到，在 vb.customize 之前或 provider 块内添加
    const providerBlockRegex = /(config\.vm\.provider\s+["']virtualbox["']\s+do\s+\|vb\|[^]*?)(end)/
    if (providerBlockRegex.test(updated)) {
      updated = updated.replace(providerBlockRegex, `$1  vb.memory = "${memoryMB}"\n$2`)
    } else {
      // 如果没有 provider 块，创建一个新的
      updated += `\n\nconfig.vm.provider "virtualbox" do |vb|\n  vb.memory = "${memoryMB}"\nend\n`
    }
  }

  // 方法2: 同时更新 vb.customize 中的内存设置
  const customizeMemoryRegex = /(vb\.customize\s*\[["']modifyvm["'],\s*:id,\s*["']--memory["'],\s*["'])(\d+)(["'])/
  if (customizeMemoryRegex.test(updated)) {
    updated = updated.replace(customizeMemoryRegex, `$1${memoryMB}$3`)
  }

  return updated
}

/**
 * 更新 Vagrantfile 中的 CPU 配置
 */
function updateVagrantfileCPU(content, cpuCount) {
  let updated = content

  // 方法1: 替换 vb.cpus = x
  const cpusRegex = /(vb\.cpus\s*=\s*)(\d+)/
  if (cpusRegex.test(updated)) {
    updated = updated.replace(cpusRegex, `$1${cpuCount}`)
  } else {
    // 如果没有找到，在 provider 块内添加
    const providerBlockRegex = /(config\.vm\.provider\s+["']virtualbox["']\s+do\s+\|vb\|[^]*?)(end)/
    if (providerBlockRegex.test(updated)) {
      updated = updated.replace(providerBlockRegex, `$1  vb.cpus = ${cpuCount}\n$2`)
    } else {
      // 如果没有 provider 块，创建一个新的
      updated += `\n\nconfig.vm.provider "virtualbox" do |vb|\n  vb.cpus = ${cpuCount}\nend\n`
    }
  }

  // 方法2: 同时更新 vb.customize 中的 CPU 设置
  const customizeCPUsRegex = /(vb\.customize\s*\[["']modifyvm["'],\s*:id,\s*["']--cpus["'],\s*)(\d+)/
  if (customizeCPUsRegex.test(updated)) {
    updated = updated.replace(customizeCPUsRegex, `$1${cpuCount}`)
  }

  return updated
}

/**
 * 更新 Vagrantfile 中的磁盘配置
 * 注意：Vagrant 默认不支持磁盘大小配置，需要使用 vagrant-disksize 插件
 */
function updateVagrantfileDisk(content, diskSizeGB) {
  let updated = content

  // 检查是否使用了 vagrant-disksize 插件
  if (updated.includes('vagrant-disksize') || updated.includes('config.disksize')) {
    // 更新磁盘大小
    const diskSizeRegex = /(config\.disksize\.size\s*=\s*)(["']?)(\d+\s*GB?)(["']?)/i
    if (diskSizeRegex.test(updated)) {
      updated = updated.replace(diskSizeRegex, `$1"${diskSizeGB}GB"`)
    } else {
      // 添加磁盘大小配置
      updated = updated.replace(
        /(Vagrant\.configure\([^)]+\)\s+do\s+\|config\|)/,
        `$1\n  config.disksize.size = "${diskSizeGB}GB"`
      )
    }
  } else {
    // 如果没有使用插件，添加注释说明
    const providerBlockRegex = /(config\.vm\.provider\s+["']virtualbox["']\s+do\s+\|vb\|[^]*?)(end)/
    if (providerBlockRegex.test(updated)) {
      updated = updated.replace(providerBlockRegex, `$1  # 磁盘已扩容至 ${diskSizeGB}GB\n  # 如需在 Vagrantfile 中配置磁盘大小，请安装 vagrant-disksize 插件:\n  # vagrant plugin install vagrant-disksize\n  # 然后添加: config.disksize.size = "${diskSizeGB}GB"\n$2`)
    }
  }

  return updated
}

/**
 * 写入更新后的 Vagrantfile
 */
async function writeVagrantfile(vagrantfilePath, content) {
  try {
    // 先读取原内容作为备份
    const originalContent = await fs.readFile(vagrantfilePath, 'utf8')
    
    // 创建备份文件路径
    const backupPath = `${vagrantfilePath}.backup.${Date.now()}`
    
    // 使用 writeFile 创建备份（避免 copyFile 的权限问题）
    await fs.writeFile(backupPath, originalContent, 'utf8')

    // 写入新内容
    await fs.writeFile(vagrantfilePath, content, 'utf8')

    return backupPath
  } catch (error) {
    throw new Error(`写入 Vagrantfile 失败: ${error.message}`)
  }
}

/**
 * 同步更新 Vagrantfile
 */
async function syncVagrantfile(vmName, configType, value) {
  try {
    // 查找 Vagrantfile
    const vagrantfilePath = await findVagrantfile(vmName)

    if (!vagrantfilePath) {
      return {
        success: false,
        message: '未找到 Vagrantfile，请手动更新配置',
        vagrantfilePath: null
      }
    }

    // 读取 Vagrantfile
    let content = await readVagrantfile(vagrantfilePath)

    // 根据配置类型更新
    switch (configType) {
      case 'memory':
        content = updateVagrantfileMemory(content, value)
        break
      case 'cpu':
        content = updateVagrantfileCPU(content, value)
        break
      case 'disk':
        content = updateVagrantfileDisk(content, value)
        break
      default:
        return {
          success: false,
          message: `不支持的配置类型: ${configType}`,
          vagrantfilePath
        }
    }

    // 写入更新后的内容
    const backupPath = await writeVagrantfile(vagrantfilePath, content)

    return {
      success: true,
      message: `Vagrantfile 已自动更新（备份: ${path.basename(backupPath)})`,
      vagrantfilePath,
      backupPath
    }
  } catch (error) {
    return {
      success: false,
      message: `同步 Vagrantfile 失败: ${error.message}`,
      vagrantfilePath: null
    }
  }
}

module.exports = {
  findVagrantfile,
  readVagrantfile,
  updateVagrantfileMemory,
  updateVagrantfileCPU,
  updateVagrantfileDisk,
  writeVagrantfile,
  syncVagrantfile
}
