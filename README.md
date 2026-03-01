# VirtualBox 虚拟机配置管理器

一个基于命令行的交互式工具，用于管理 VirtualBox 虚拟机的配置。

## 功能特性

- 📋 **列出所有虚拟机** - 显示所有虚拟机及其运行状态，自动识别 Vagrant 虚拟机
- 🔧 **修改虚拟机配置** - 支持修改内存、CPU 核心数和磁盘容量，针对 Vagrant 虚拟机有特殊提示
- �️ **显示配置管理** - 支持修改显存、图形控制器、3D/2D 加速，一键优化显示性能
- � **查看虚拟机详情** - 显示虚拟机的详细配置信息，包括磁盘信息和显示配置
- 🔄 **启动/关闭虚拟机** - 支持正常关闭和强制关闭
- 💾 **磁盘管理** - 支持扩容虚拟磁盘（支持 VDI、VMDK 格式）
- 🏷️ **Vagrant 支持** - 自动识别 Vagrant 创建的虚拟机，提供专门的配置指导

## 安装

### 前提条件

- Node.js 14.0 或更高版本
- VirtualBox 已安装并配置好环境变量
- VBoxManage 命令可用

### 支持平台

- ✅ **macOS** - 完全支持
- ✅ **Linux** - 完全支持  
- ✅ **Windows** - 完全支持（通过批处理脚本或 npm）

### 安装步骤

1. 克隆或下载此项目
2. 进入项目目录
3. 安装依赖：

```bash
npm install
```

4. 创建可执行脚本链接（可选，macOS/Linux）：

```bash
npm link
```

## 使用方法

### 启动应用

**macOS / Linux:**

```bash
./vbox-config
```

**Windows:**

```cmd
vbox-config.bat
```

或者使用 npm（所有平台通用）：

```bash
npm start
```

### 主菜单

启动后会显示主菜单：

```
┌─────────────────────────────────────────┐
│     VirtualBox 虚拟机配置管理器           │
├─────────────────────────────────────────┤
│ 1. 列出所有虚拟机                        │
│ 2. 修改虚拟机配置                        │
│ 3. 查看虚拟机详情                        │
│ 4. 启动/关闭虚拟机                       │
│ 5. 退出                                 │
└─────────────────────────────────────────┘
```

### 功能说明

#### 1. 列出所有虚拟机

显示所有 VirtualBox 虚拟机及其当前状态：
- 🟢 运行中
- ⏸️ 已关闭

#### 2. 修改虚拟机配置

选择虚拟机后，可以：
- **修改内存** - 设置内存大小（256MB - 32768MB）
- **修改 CPU** - 设置 CPU 核心数（1 - 16 核心）
- **修改磁盘容量** - 扩容虚拟磁盘（1GB - 2048GB）
- **显示配置** - 修改显存、图形控制器、3D/2D 加速等显示相关设置
- **查看当前配置** - 显示虚拟机的详细配置，包括磁盘信息和显示配置

##### 显示配置菜单

```
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
```

###### 显存配置

| 用途 | 推荐显存 |
|------|----------|
| 无界面/服务器模式 | 16 MB |
| 基础图形界面 | 64-128 MB |
| 3D 应用/开发 | 128-256 MB |

**注意**: VirtualBox 最大支持 256 MB 显存。

###### 图形控制器

| 控制器 | 适用场景 |
|--------|----------|
| VMSVGA | Linux 系统（Ubuntu、CentOS 等）✅ 推荐 |
| VBoxSVGA | Windows 系统 |
| VBoxVGA | 旧版兼容模式 |
| None | 无图形控制器 |

###### 一键优化预设

| 预设模式 | 显存 | 3D 加速 | 图形控制器 | 适用场景 |
|----------|------|---------|------------|----------|
| 服务器模式 | 16 MB | 关闭 | VMSVGA | 无界面/命令行操作 |
| 桌面模式 ⭐ | 128 MB | 开启 | VMSVGA | Ubuntu 桌面环境 |
| 开发模式 | 256 MB | 开启 | VMSVGA | GUI + 3D 应用开发 |

**提示**: 如果虚拟机界面无法正常显示（如黑屏、卡顿），建议使用"桌面模式"一键优化。

#### 3. 查看虚拟机详情

显示虚拟机的详细信息：
- 名称和 UUID
- 内存和 CPU 配置
- 显示配置（显存、图形控制器、3D/2D 加速）
- 磁盘信息（容量、格式、路径）
- 当前状态

#### 4. 启动/关闭虚拟机

支持以下操作：
- **启动虚拟机** - 以无头模式启动
- **关闭虚拟机** - 发送 ACPI 关机信号
- **强制关闭** - 强制断电（仅在运行中显示）

## 配置限制

### 内存配置
- 最小值：256 MB
- 最大值：32768 MB (32 GB)
- 建议根据主机内存合理配置

### CPU 配置
- 最小值：1 核心
- 最大值：16 核心
- 建议不超过主机 CPU 核心数

### 磁盘配置
- 最小值：1 GB
- 最大值：2048 GB (2 TB)
- **注意：只能扩容，不能缩小**
- 支持的格式：VDI、VMDK
- 修改前请确保虚拟机已关闭
- 修改后需要在虚拟机内部扩展分区和文件系统

### 显存配置
- 最小值：1 MB
- 最大值：256 MB
- 建议：桌面环境 128 MB，服务器环境 16 MB

### 图形控制器
- **VMSVGA** - Linux 系统推荐（Ubuntu、CentOS 等）
- **VBoxSVGA** - Windows 系统推荐
- **VBoxVGA** - 旧版兼容模式

### 3D/2D 加速
- 需要安装 Guest Additions 才能正常工作
- 启用后可提升图形性能
- 某些情况下可能导致兼容性问题，如遇问题可尝试禁用

## 测试

运行所有测试：

```bash
npm test
```

或者分别运行各个测试：

```bash
# 测试项目结构
node tests/structure.test.js

# 测试 VirtualBox 功能
node tests/vbox.test.js

# 测试菜单功能
node tests/menu.test.js

# 测试配置功能
node tests/config.test.js
```

## 技术栈

- **Node.js** - 运行时环境
- **readline** - 命令行交互
- **child_process** - 执行系统命令
- **VirtualBox VBoxManage** - 虚拟机管理

## 项目结构

```
vagrant_vitualbox_dashboard/
├── src/
│   ├── index.js          # 主应用入口
│   └── utils/
│       ├── vbox.js       # VirtualBox 命令封装
│       └── vagrantfile.js # Vagrantfile 同步功能
├── tests/
│   ├── structure.test.js # 结构测试
│   ├── vbox.test.js      # VBoxManage 测试
│   ├── menu.test.js      # 菜单功能测试
│   ├── config.test.js    # 配置功能测试
│   └── vagrantfile.test.js # Vagrantfile 测试
├── docs/
│   └── plans/
│       └── 2026-02-18-interactive-vbox-config.md  # 实现计划
├── vbox-config           # 可执行脚本
├── package.json          # 项目配置
└── README.md            # 使用文档
```

## Vagrant 虚拟机支持

本工具专门针对 Vagrant 创建的虚拟机进行了优化：

### 自动识别
- 自动检测 Vagrant 虚拟机并显示 `[Vagrant]` 标记
- 在虚拟机列表中显示 Vagrant 虚拟机数量提示

### 配置指导
当修改 Vagrant 虚拟机配置时，工具会提供特殊提示：
- 提醒用户修改后需要重启虚拟机
- 指导用户使用 `vagrant reload` 命令
- **重要：提示用户同步修改 Vagrantfile 以永久保存配置**

### Vagrantfile 自动同步（重要！）

✨ **本工具支持自动同步 Vagrantfile**！当您修改 Vagrant 虚拟机的配置时，工具会自动：

1. **查找 Vagrantfile** - 通过虚拟机配置信息自动定位项目目录
2. **备份原文件** - 创建带时间戳的备份（如 `Vagrantfile.backup.1234567890`）
3. **自动更新配置** - 智能识别并更新内存、CPU、磁盘配置
4. **显示同步结果** - 告知用户同步是否成功

#### 支持的配置格式

工具支持多种 Vagrantfile 配置格式：

```ruby
# 标准格式
config.vm.provider "virtualbox" do |vb|
  vb.memory = "2048"
  vb.cpus = 2
end

# 使用 customize
vb.customize ["modifyvm", :id, "--memory", "2048"]
vb.customize ["modifyvm", :id, "--cpus", "2"]

# 显示配置（通过 customize）
vb.customize ["modifyvm", :id, "--vram", "128"]
vb.customize ["modifyvm", :id, "--graphicscontroller", "vmsvga"]
vb.customize ["modifyvm", :id, "--accelerate3d", "on"]

# vagrant-disksize 插件格式
config.disksize.size = "50GB"
```

#### 支持同步的配置项

| 配置项 | Vagrantfile 配置方式 |
|--------|---------------------|
| 内存 | `vb.memory` 或 `vb.customize ["modifyvm", :id, "--memory", ...]` |
| CPU | `vb.cpus` 或 `vb.customize ["modifyvm", :id, "--cpus", ...]` |
| 磁盘 | `config.disksize.size` (需要 vagrant-disksize 插件) |
| 显存 | `vb.customize ["modifyvm", :id, "--vram", ...]` |
| 图形控制器 | `vb.customize ["modifyvm", :id, "--graphicscontroller", ...]` |
| 3D 加速 | `vb.customize ["modifyvm", :id, "--accelerate3d", ...]` |
| 2D 加速 | `vb.customize ["modifyvm", :id, "--accelerate2dvideo", ...]` |

#### 自动同步流程

当您修改 Vagrant 虚拟机配置时：

```
✅ 内存已修改为 2048 MB

🔄 正在自动同步 Vagrantfile...
✅ Vagrantfile 已自动更新（备份: Vagrantfile.backup.1234567890）
📁 Vagrantfile 位置: /path/to/your/project/Vagrantfile

💡 下一步操作:
   1. 关闭虚拟机: vagrant halt
   2. 运行: vagrant reload
```

#### 如果自动同步失败

如果工具无法找到或更新 Vagrantfile，会显示：

```
⚠️  未找到 Vagrantfile，请手动更新配置

💡 请手动修改 Vagrantfile:
   config.vm.provider "virtualbox" do |vb|
     vb.memory = "2048"
   end
```

常见原因：
- 虚拟机不是通过 Vagrant 创建的
- Vagrantfile 不在预期位置
- Vagrantfile 使用了特殊的配置格式

#### 磁盘配置的特殊性

磁盘扩容与其他配置不同：
- **磁盘扩容是永久的** - 即使 Vagrantfile 中没有定义，扩容后的磁盘大小会保留
- **但 `vagrant destroy` + `vagrant up` 会重置** - 会使用默认大小重新创建磁盘
- **自动同步** - 如果检测到使用了 `vagrant-disksize` 插件，会自动更新磁盘大小配置
- **建议**：如需永久保留磁盘大小，使用 [vagrant-disksize](https://github.com/sprotheroe/vagrant-disksize) 插件

### 使用建议
对于 Vagrant 虚拟机，推荐的配置流程：
1. 使用本工具修改虚拟机配置（内存、CPU）
2. 关闭虚拟机
3. 运行 `vagrant reload` 重启虚拟机
4. （可选）修改 Vagrantfile 以永久保存配置

## 注意事项

1. **权限要求** - 某些操作可能需要管理员权限
2. **虚拟机状态** - 修改配置前建议先关闭虚拟机
3. **配置验证** - 工具会自动验证配置参数的有效性
4. **错误处理** - 所有操作都有错误处理和用户提示
5. **Vagrant 特殊处理** - Vagrant 虚拟机修改配置后需要 `vagrant reload` 才能生效

## 故障排除

### VirtualBox 不可用

如果提示 "VirtualBox 不可用"，请检查：
1. VirtualBox 是否已正确安装
2. VBoxManage 是否在系统 PATH 中
3. 是否有足够的系统权限

### 无法修改配置

如果无法修改虚拟机配置：
1. 确保虚拟机已关闭（某些配置需要关机才能修改）
2. 检查是否有足够的磁盘空间
3. 验证配置参数是否在有效范围内

### 磁盘扩容失败

如果磁盘扩容失败：
1. **虚拟机正在运行** - 必须先关闭虚拟机才能扩容
2. **磁盘有快照** - 需要先删除所有快照
3. **格式不支持** - 某些旧格式可能不支持扩容
4. **权限不足** - 可能需要管理员权限
5. **空间不足** - 主机磁盘空间不足

### Vagrant 虚拟机磁盘扩容

对于 Vagrant 虚拟机：
1. 确保虚拟机已关闭：`vagrant halt`
2. 使用本工具扩容磁盘
3. 重启虚拟机：`vagrant reload`
4. 在虚拟机内部扩展分区：
   ```bash
   # 查看分区情况
   sudo fdisk -l
   
   # 扩展分区（以 /dev/sda3 为例）
   sudo growpart /dev/sda 3
   
   # 扩展文件系统
   sudo resize2fs /dev/sda3
   # 或对于 xfs 文件系统
   sudo xfs_growfs /
   ```

### 显示问题排查

如果虚拟机界面无法正常显示（黑屏、卡顿、分辨率异常）：

1. **检查显存设置**
   - 桌面环境建议 128 MB 以上
   - 使用"显示配置 → 一键优化 → 桌面模式"

2. **检查图形控制器**
   - Linux 系统推荐使用 VMSVGA
   - Windows 系统推荐使用 VBoxSVGA

3. **启用 3D 加速**
   - 需要安装 Guest Additions
   - 在虚拟机菜单：设备 → 安装增强功能

4. **Guest Additions 安装**
   ```bash
   # 在虚拟机内执行
   sudo mount /dev/cdrom /mnt
   sudo /mnt/VBoxLinuxAdditions.run
   sudo reboot
   ```

5. **其他可能原因**
   - 内存不足（建议 2GB 以上）
   - CPU 核心数过少（建议 2 核以上）
   - 主机显卡驱动问题

## 开发

### 添加新功能

1. 在 `src/utils/vbox.js` 中添加 VirtualBox 命令封装
2. 在 `src/index.js` 中添加菜单处理逻辑
3. 在 `tests/` 目录下添加对应的测试
4. 更新 README.md 文档

### 调试

启用调试模式：

```bash
DEBUG=1 ./vbox-config
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v1.3.0
- 🖥️ **新增显示配置管理功能**
  - 支持修改显存（1-256 MB）
  - 支持修改图形控制器（VMSVGA/VBoxSVGA/VBoxVGA）
  - 支持切换 3D/2D 加速
  - 一键优化预设（服务器模式/桌面模式/开发模式）
  - 显示配置自动同步到 Vagrantfile
- 📊 **增强虚拟机详情显示**
  - 新增显示配置信息展示
  - 优化信息分类和排版

### v1.2.0
- 🔄 **新增 Vagrantfile 自动同步功能**
  - 自动查找并定位 Vagrantfile
  - 智能更新内存、CPU、磁盘配置
  - 自动创建备份文件
  - 支持多种 Vagrantfile 配置格式
  - 同步失败时提供手动配置指导

### v1.1.0
- 💾 **新增磁盘管理功能**
  - 支持查看虚拟机磁盘信息
  - 支持扩容虚拟磁盘（VDI、VMDK 格式）
  - 智能识别多个磁盘并支持选择
  - 提供详细的磁盘扩容指导
- 🏷️ **增强 Vagrant 支持**
  - 自动识别 Vagrant 虚拟机
  - 针对 Vagrant 的特殊提示和指导
  - 提供 Vagrant 磁盘扩容完整流程

### v1.0.0
- ✨ 初始版本发布
- 📋 虚拟机列表功能
- 🔧 内存和 CPU 配置修改
- 📊 虚拟机详情查看
- 🔄 启动/关闭虚拟机功能
