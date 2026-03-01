const {
  updateVagrantfileMemory,
  updateVagrantfileCPU,
  updateVagrantfileDisk,
  updateVagrantfileVRAM,
  updateVagrantfileGraphicsController,
  updateVagrantfile3DAcceleration
} = require('../src/utils/vagrantfile')

console.log('🧪 测试 Vagrantfile 更新功能...\n')

console.log('🧪 测试内存配置更新...')

const testMemory1 = `
Vagrant.configure("2") do |config|
  config.vm.provider "virtualbox" do |vb|
    vb.memory = "1024"
    vb.cpus = 1
  end
end
`
const result1 = updateVagrantfileMemory(testMemory1, 2048)
if (result1.includes('vb.memory = "2048"')) {
  console.log('✅ 测试1通过: 成功更新现有 vb.memory')
} else {
  console.log('❌ 测试1失败: 未能更新现有 vb.memory')
  console.log('结果:', result1)
}

const testMemory2 = `
Vagrant.configure("2") do |config|
  config.vm.provider "virtualbox" do |vb|
    vb.cpus = 1
  end
end
`
const result2 = updateVagrantfileMemory(testMemory2, 2048)
if (result2.includes('vb.memory = "2048"')) {
  console.log('✅ 测试2通过: 成功添加新的 vb.memory')
} else {
  console.log('❌ 测试2失败: 未能添加新的 vb.memory')
  console.log('结果:', result2)
}

const testMemory3 = `
Vagrant.configure("2") do |config|
  config.vm.provider "virtualbox" do |vb|
    vb.customize ["modifyvm", :id, "--memory", "1024"]
  end
end
`
const result3 = updateVagrantfileMemory(testMemory3, 2048)
if (result3.includes('"--memory", "2048"')) {
  console.log('✅ 测试3通过: 成功更新 vb.customize 中的内存')
} else {
  console.log('❌ 测试3失败: 未能更新 vb.customize 中的内存')
  console.log('结果:', result3)
}

console.log('\n🧪 测试 CPU 配置更新...')

const testCPU1 = `
Vagrant.configure("2") do |config|
  config.vm.provider "virtualbox" do |vb|
    vb.memory = "1024"
    vb.cpus = 1
  end
end
`
const result4 = updateVagrantfileCPU(testCPU1, 4)
if (result4.includes('vb.cpus = 4')) {
  console.log('✅ 测试4通过: 成功更新现有 vb.cpus')
} else {
  console.log('❌ 测试4失败: 未能更新现有 vb.cpus')
  console.log('结果:', result4)
}

const testCPU2 = `
Vagrant.configure("2") do |config|
  config.vm.provider "virtualbox" do |vb|
    vb.customize ["modifyvm", :id, "--cpus", 1]
  end
end
`
const result5 = updateVagrantfileCPU(testCPU2, 4)
if (result5.includes('"--cpus", 4')) {
  console.log('✅ 测试5通过: 成功更新 vb.customize 中的 CPU')
} else {
  console.log('❌ 测试5失败: 未能更新 vb.customize 中的 CPU')
  console.log('结果:', result5)
}

console.log('\n🧪 测试磁盘配置更新...')

const testDisk1 = `
Vagrant.configure("2") do |config|
  config.disksize.size = "20GB"
  
  config.vm.provider "virtualbox" do |vb|
    vb.memory = "1024"
  end
end
`
const result6 = updateVagrantfileDisk(testDisk1, 50)
if (result6.includes('config.disksize.size = "50GB"')) {
  console.log('✅ 测试6通过: 成功更新 vagrant-disksize 配置')
} else {
  console.log('❌ 测试6失败: 未能更新 vagrant-disksize 配置')
  console.log('结果:', result6)
}

const testDisk2 = `
Vagrant.configure("2") do |config|
  config.vm.provider "virtualbox" do |vb|
    vb.memory = "1024"
  end
end
`
const result7 = updateVagrantfileDisk(testDisk2, 50)
if (result7.includes('磁盘已扩容至 50GB') || result7.includes('vagrant-disksize')) {
  console.log('✅ 测试7通过: 成功添加磁盘扩容说明')
} else {
  console.log('❌ 测试7失败: 未能添加磁盘扩容说明')
  console.log('结果:', result7)
}

console.log('\n🧪 测试显存配置更新...')

const testVRAM1 = `
Vagrant.configure("2") do |config|
  config.vm.provider "virtualbox" do |vb|
    vb.customize ["modifyvm", :id, "--vram", "16"]
  end
end
`
const result8 = updateVagrantfileVRAM(testVRAM1, 128)
if (result8.includes('"--vram", "128"')) {
  console.log('✅ 测试8通过: 成功更新现有显存配置')
} else {
  console.log('❌ 测试8失败: 未能更新现有显存配置')
  console.log('结果:', result8)
}

const testVRAM2 = `
Vagrant.configure("2") do |config|
  config.vm.provider "virtualbox" do |vb|
    vb.memory = "1024"
  end
end
`
const result9 = updateVagrantfileVRAM(testVRAM2, 128)
if (result9.includes('"--vram", "128"')) {
  console.log('✅ 测试9通过: 成功添加新的显存配置')
} else {
  console.log('❌ 测试9失败: 未能添加新的显存配置')
  console.log('结果:', result9)
}

console.log('\n🧪 测试图形控制器配置更新...')

const testGC1 = `
Vagrant.configure("2") do |config|
  config.vm.provider "virtualbox" do |vb|
    vb.customize ["modifyvm", :id, "--graphicscontroller", "vboxvga"]
  end
end
`
const result10 = updateVagrantfileGraphicsController(testGC1, 'vmsvga')
if (result10.includes('"--graphicscontroller", "vmsvga"')) {
  console.log('✅ 测试10通过: 成功更新图形控制器配置')
} else {
  console.log('❌ 测试10失败: 未能更新图形控制器配置')
  console.log('结果:', result10)
}

console.log('\n🧪 测试 3D 加速配置更新...')

const test3D1 = `
Vagrant.configure("2") do |config|
  config.vm.provider "virtualbox" do |vb|
    vb.customize ["modifyvm", :id, "--accelerate3d", "off"]
  end
end
`
const result11 = updateVagrantfile3DAcceleration(test3D1, true)
if (result11.includes('"--accelerate3d", "on"')) {
  console.log('✅ 测试11通过: 成功更新 3D 加速配置')
} else {
  console.log('❌ 测试11失败: 未能更新 3D 加速配置')
  console.log('结果:', result11)
}

console.log('\n🎉 Vagrantfile 更新功能测试完成!')
