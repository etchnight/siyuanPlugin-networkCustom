[中文](https://github.com/etchnight/siyuanPlugin-networkCustom/blob/main/README.md)

## siyuanPligin-TreeAndGraph

[Siyuan Notes](https://b3log.org/siyuan/) Plug-ins, which display parent-child relationships and link relationships, etc. in a tree view, created using [echarts](https://echarts.apache.org/zh/index.html).

### How to use

By default, a new dock appears on the right, click it, pay attention to put the cursor in a block first, the block will be used as the starting node (every time you open a new dock, it will be initialize again according to the block where the cursor is located as the starting node).

### Features and Plans

#### Basic Features

- [x] Roam(scale and move)(v1.0)
- [x] Collapse and expand nodes (left-click)(v1.0)
- [x] Displays the block content or type(v1.0)
- [x] Display block details(hover)(v1.1)
- [x] Displays the label tree(v2.0)
- [x] Highlight edge when mouse over (v2.2)
- [x] Display reference type (v2.3), currently achieved by recognizing memos on the reference anchor-text
~~- [ ] Use different colors distinguish different block types~~

#### Right-click Menu

- [x] Extend nodes(Added nodes will be updated)(v1.0)
- [x] Locate nodes in notes (document tab)(v1.1)
- [x] View the node in a floating pannel(v1.1)
- [x] Focus Node(unfocus button is on the toolbar)(v2.1)
~~- [ ] Delete the node~~



### Feedback

If you have any questions, please put a issue at [github issues](https://github.com/etchnight/siyuanPlugin-networkCustom/issues).

### Thanks

- [SiYuan plugin sample with vite and svelte](https://github.com/siyuan-note/plugin-sample-vite-svelte)
- [Apache ECharts](https://github.com/apache/echarts) A powerful, interactive charting and data visualization library for browser

### Development Notes

- ❗❗❗ In order to unify project methods and types, Siyuan API-related methods and types are in the project [siyuanPlugin-common](https://github.com/etchnight/siyuanPlugin-common) .
- ❗ For ease of development with TypeScript, the 'echarts/types/dist/shared' file has been modified , some types have been added prefix `export`.
