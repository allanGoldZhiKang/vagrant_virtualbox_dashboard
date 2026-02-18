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
      runningOutput.split('\n').forEach(line => {
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

module.exports = { 
  executeVBoxManage,
  testVBoxManage, 
  listVMs 
}