
## 树状关系图

[思源笔记](https://b3log.org/siyuan/)插件，将父子关系和链接关系等显示在树状图中，使用[echarts](https://echarts.apache.org/zh/index.html)创建。


### 使用方法

默认在右侧新出现一个dock，点击即可，注意要先将光标置于某块中，该块会作为起始构建节点（每次新打开dock都会重新按照光标所在块作为起始节点绘制）。

### 功能和计划

#### 基础功能

- [x] 缩放和平移
- [x] 折叠和展开节点（左键单击）
- [x] 显示块内容或类型
- [x] 悬浮显示块详细信息
- [x] 显示标签树
- [ ] 不同颜色区分块类型
- [ ] 显示引用类型

#### 右键菜单
- [x] 扩展节点
- [x] 在笔记中定位节点（文档tab）
- [x] 在浮动窗口查看节点
- [ ] 删除节点

#### 高级功能
- [ ] 切换为力引导图
- [ ] 自定义引用类型

### 感谢

- [使用 vite + svelte 的思源笔记插件示例
](https://github.com/siyuan-note/plugin-sample-vite-svelte)

### 开发相关
- ❗❗❗ 为统一项目方法和类型，思源api相关方法和类型均在[siyuanPlugin-common](https://github.com/etchnight/siyuanPlugin-common)项目中。
- ❗为便于开发，对`echarts/types/dist/shared`文件做了修改，将部分类型改为导出
