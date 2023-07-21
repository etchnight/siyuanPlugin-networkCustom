[English](https://github.com/etchnight/siyuanPlugin-networkCustom/blob/main/README_en_US.md)

## 树状关系图

[思源笔记](https://b3log.org/siyuan/)插件，将父子关系和链接关系等显示在树状图中，使用[echarts](https://echarts.apache.org/zh/index.html)创建。

### 使用方法

默认在右侧新出现一个 dock，点击即可，注意要先将光标置于某块中，该块会作为起始构建节点（每次新打开 dock 都会重新按照光标所在块作为起始节点绘制）。

### 功能和计划

#### 基础功能

- [x] 缩放和平移(v1.0)
- [x] 折叠和展开节点（左键单击）(v1.0)
- [x] 显示块内容或类型(v1.0)
- [x] 悬浮显示块详细信息(v1.1)
- [x] 显示标签树(v2.0)
- [x] 鼠标指向时高亮边(v2.2)
- [x] 显示链接类型(v2.3)，目前是通过识别引用锚文本上的备注实现
- [ ] 不同颜色区分块类型
- [ ] 显示引用类型

#### 右键菜单

- [x] 扩展节点(已添加节点会更新)(v1.0)
- [x] 在笔记中定位节点（文档 tab）(v1.1)
- [x] 在浮动窗口查看节点(v1.1)
- [x] 聚焦（取消聚焦在工具栏）(v2.1)
- [ ] 删除节点

#### 高级功能

~~- [ ] 切换为力引导图~~
- [ ] 自定义引用类型

### 部分功能预览

#### 聚焦
![聚焦](https://github.com/etchnight/siyuanPlugin-networkCustom/raw/main/asset/focus.png)

### 反馈

有问题请在[github issues](https://github.com/etchnight/siyuanPlugin-networkCustom/issues)、[gitee issues](https://gitee.com/dualwind/siyuan-plugin-network-custom/issues)反馈。

### 感谢

- [使用 vite + svelte 的思源笔记插件示例
  ](https://github.com/siyuan-note/plugin-sample-vite-svelte)
- [Apache ECharts](https://github.com/apache/echarts) A powerful, interactive charting and data visualization library for browser

### 开发相关

- ❗❗❗ 为统一项目方法和类型，思源 api 相关方法和类型均在[siyuanPlugin-common](https://github.com/etchnight/siyuanPlugin-common)项目中。
- ❗ 为便于使用 TypeScript 开发，对`echarts/types/dist/shared`文件做了修改，将部分类型改为导出。
