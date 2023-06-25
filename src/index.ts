import { Plugin, getFrontend, getBackend, Menu } from "siyuan";
import "./index.scss";
import * as sy from "../../siyuanPlugin-common/siyuan-api";
//import { merge } from "lodash";
//---eacharts---
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import {
  TreeChart,
  TreeSeriesOption,
  GraphChart,
  GraphSeriesOption,
} from "echarts/charts";
import { GridComponent, GridComponentOption } from "echarts/components";
//*源文件未导出，需修改
import {
  TreeSeriesNodeItemOption,
  GraphEdgeItemOption,
  GraphNodeItemOption,
} from "echarts/types/dist/shared";
echarts.use([TreeChart, GraphChart, CanvasRenderer, GridComponent]);
type ECOption = echarts.ComposeOption<
  TreeSeriesOption | GraphSeriesOption | GridComponentOption
>;
//------
const STORAGE_NAME = "menu-config";
const DOCK_TYPE = "dock_tab";
export default class networkCustom extends Plugin {
  //private isMobile: boolean;
  private graph: echarts.ECharts;
  private lastTabWidth: number;
  private treeData: nodeModel[] = [];
  private graphData: graphNodeModel[] = [];
  private graphLinks: edgeModel[] = [];
  //private tagTreeData: TreeSeriesOption["data"] = [];
  //private graphOption: ECOption;
  onload() {
    let graph = this.graph;
    let lastTabWidth = this.lastTabWidth;
    let graphData = this.graphData;
    let graphLinks = this.graphLinks;
    this.lastTabWidth = 0;
    let treeData = this.treeData;
    //let tagTreeData = this.tagTreeData;
    //let graphOption = this.graphOption;
    // 图标的制作参见帮助文档
    if (!document.getElementById("icon_networkCustom")) {
      this.addIcons(`
      <symbol id="icon_networkCustom" viewBox="0 0 32 32">
      <path d="M6.531 12.534l0.93-1.405 3.37 2.233-0.93 1.403zM21.327 17.081l-0.455-1.62 3.891-1.095 0.455 1.62zM9.846 25.401l-1.261-1.115 2.678-3.028 1.263 1.117zM18.686 12.195l-1.459-0.842 1.347-2.333 1.459 0.842zM19.239 22.774l1.285-1.088 2.611 3.085-1.285 1.088z"></path>
      <path d="M15.663 23.916c-3.705 0-6.737-3.032-6.737-6.737s3.032-6.737 6.737-6.737 6.737 3.032 6.737 6.737-3.032 6.737-6.737 6.737zM15.663 12.126c-2.863 0-5.053 2.189-5.053 5.053s2.189 5.053 5.053 5.053 5.053-2.189 5.053-5.053-2.358-5.053-5.053-5.053zM5.221 14.147c-1.853 0-3.368-1.516-3.368-3.368s1.516-3.368 3.368-3.368 3.368 1.516 3.368 3.368-1.516 3.368-3.368 3.368zM5.221 9.095c-1.011 0-1.684 0.674-1.684 1.684s0.674 1.684 1.684 1.684 1.684-0.674 1.684-1.684-0.842-1.684-1.684-1.684zM7.916 29.642c-1.853 0-3.368-1.516-3.368-3.368s1.516-3.368 3.368-3.368 3.368 1.516 3.368 3.368-1.516 3.368-3.368 3.368zM7.916 24.589c-1.011 0-1.684 0.674-1.684 1.684s0.674 1.684 1.684 1.684 1.684-0.674 1.684-1.684-0.674-1.684-1.684-1.684zM26.779 18.021c-1.853 0-3.368-1.516-3.368-3.368s1.516-3.368 3.368-3.368 3.368 1.516 3.368 3.368-1.516 3.368-3.368 3.368zM26.779 12.968c-1.011 0-1.684 0.674-1.684 1.684s0.674 1.684 1.684 1.684 1.684-0.674 1.684-1.684-0.674-1.684-1.684-1.684zM20.716 10.947c-2.189 0-4.211-1.853-4.211-4.211s1.853-4.211 4.211-4.211 4.211 1.853 4.211 4.211-1.853 4.211-4.211 4.211zM20.716 4.211c-1.347 0-2.526 1.179-2.526 2.526s1.179 2.526 2.526 2.526 2.526-1.179 2.526-2.526-1.011-2.526-2.526-2.526zM23.411 28.8c-1.347 0-2.526-1.179-2.526-2.526s1.179-2.526 2.526-2.526 2.526 1.179 2.526 2.526-1.179 2.526-2.526 2.526zM23.411 25.432c-0.505 0-0.842 0.337-0.842 0.842s0.337 0.842 0.842 0.842 0.842-0.337 0.842-0.842-0.337-0.842-0.842-0.842z"></path>
      </symbol>
      `);
    }

    const dock = this.addDock({
      config: {
        position: "RightTop",
        size: { width: 400, height: 600 },
        icon: "icon_networkCustom",
        title: "可交互关系图",
      },
      data: {
        text: "",
      },
      type: DOCK_TYPE,
      async init() {
        this.element.innerHTML =
          //html
          `<div class="fn__flex-1 fn__flex-column">
          <div class="block__icons">
              <div class="block__logo">
                  <svg>
                      <use xlink:href="#icon_networkCustom"></use>
                  </svg>
                  可交互关系图
              </div>
              <span class="fn__flex-1 fn__space"></span>
          </div>
          <div class="fn__flex-1 plugin-sample__custom-dock">
              <div id='container_networkCustom'></div>
          </div>
      </div>`;
        //console.log(window.customGraph.i18n.prefix,"init");
      },
      update() {},
      async resize() {
        resizeGraph();
      },
      destroy() {
        graph.dispose();
        console.log("destroy dock:", DOCK_TYPE);
      },
    });
    console.log(this.i18n.prefix, this.i18n.helloPlugin);
    async function resizeGraph() {
      const container = document.getElementById("container_networkCustom");
      if (!graph) {
        graph = echarts.init(container, null, {
          width: 600,
          height: 600,
        });
      }
      const widthNum = container.offsetWidth;
      //const heightNum = container.offsetHeight;
      if (widthNum == 0 || !widthNum) {
        //*清除画布
        graph.clear();
      } else {
        //*改变大小
        graph.resize();
        //graph.chan
        if (!graph) {
          //*新建画布，这一步一般不会发生
          graph = echarts.init(container);
        } else if (lastTabWidth == 0) {
          //*重绘
          await reInitGraph();
        }
      }
      lastTabWidth = widthNum || 0;
    }
    async function reInitGraph() {
      console.log("初始化");
      if (!graph) {
        return;
      }
      const grid = { left: 50, right: 50, bottom: 50, top: 50 };
      let graphOption: ECOption = {
        grid: {
          left: grid.left,
          right: grid.right,
          bottom: grid.bottom,
          top: grid.top,
        },
        xAxis: [
          {
            type: "value",
            min: 0,
            max: 500,
            show: false,
          },
        ],
        yAxis: [
          {
            type: "value",
            inverse: true,
            min: 0,
            max: 500,
            show: false,
          },
        ],
        series: [
          {
            type: "tree",
            id: "blockTree",
            data: treeData,
            z: 10,
            initialTreeDepth: -1,
            label: {
              show: true,
              color: "#F0FFFF",
              textShadowColor: "#000000",
              position: "top",
            },
          },
          {
            type: "graph",
            id: "blockGraph",
            data: graphData,
            links: graphLinks,
            coordinateSystem: "cartesian2d",
            z: 5,
            label: {
              show: false,
              position: "bottom",
            },
            edgeSymbol: ["none", "arrow"],
          },
        ],
      };

      //*统一树图和关系图尺寸grid
      for (let key of Object.keys(grid)) {
        graphOption.series[0][key] = grid[key];
      }
      //graphOption = forDevInit(graphOption);
      graph.setOption(graphOption);
      //---设置动作---
      graph.on("contextmenu", onContextMenu);
      graph.on("click", onNodeClick);
      //---清空并添加初始节点---
      const startNodeId = sy.getFocusNodeId();
      if (!startNodeId) {
        sy.pushErrMsg(this.i18n.prefix + this.i18n.startNodeError);
        return;
      }
      const startBlock = await sy.getBlockById(startNodeId);
      const startNodeModel = await buildNode(startBlock);
      let rootNode: nodeModel = structuredClone(startNodeModel);
      for (let key of Object.keys(rootNode)) {
        rootNode[key] = "";
      }
      rootNode.children = [];
      rootNode.id = "root";
      treeData = [rootNode];
      graphData = [];
      graphLinks = [];
      await addNodeToTreeDataAndRefresh(startNodeModel);
      await expandNode(startNodeModel);
    }
    function forDevInit(graphOption: ECOption) {
      graphOption.series[0].label.formatter = (params: { data }) => {
        let labelName = params.data.labelName;
        let { idList, itemLayouts } = getTreeNodePositionParams();
        let { x, y } = getTreeNodePosition(params.data, idList, itemLayouts);
        return `${labelName}:${Math.round(x)},${Math.round(y)}`;
      };
      graphOption.series[1].label.formatter = (params: { data }) => {
        if (params.data.x) {
          return `${params.data.labelName}:${params.data.x},${params.data.y}`;
        }
        let label = params.data.labelName + ":";
        for (let value of params.data.value) {
          label = label + Math.round(value).toString() + ",";
        }
        return label;
      };
      graphOption.series[1].label.show = true;
      graphOption.xAxis[0].show = true;
      graphOption.yAxis[0].show = true;
      graph.on("finished", () => {
        console.log("info", getDataInfo(0));
        console.log("info", getDataInfo(1));
        console.log("option", graph.getOption());
      });
      return graphOption;
    }
    function refreshGraph() {
      let option = graph.getOption();
      option.series[0].data = treeData; //todo 更稳妥的方式是使用Id检索
      option.series[1].data = graphData;
      option.series[1].links = graphLinks;
      graph.setOption(option);
    }
    function getDataInfo(index: number) {
      //https://github.com/apache/echarts/issues/5614
      //将echarts/types/dist/shared中getModel设为pubilic
      let model = graph.getModel();
      let series = model.getSeriesByIndex(index);
      let info = series.getData();
      return info;
    }
    function reComputePosition() {
      //*重算关系图位置
      let { idList, itemLayouts } = getTreeNodePositionParams();
      for (let node of graphData) {
        let { x, y } = getTreeNodePosition(node, idList, itemLayouts);
        node.value = [x, y];
      }
    }
    function onNodeClick(params: {
      data;
      componentSubType: string;
      collapsed?: boolean;
    }) {
      switch (params.componentSubType) {
        case "tree":
          reComputePosition();
          //*记忆节点折叠情况
          let treeNode = findTreeDataById(treeData, params.data.id);
          treeNode.collapsed = params.collapsed;
          refreshGraph();
          break;
        case "graph":
          break;
      }
    }
    function onContextMenu(params: echarts.ECElementEvent) {
      const menu = new Menu("graphMenu", () => {
        //console.log("菜单");
      });
      menu.addItem({
        icon: "",
        label: "展开节点",
        click: () => {
          expandNode(params.data as nodeModel);
          //console.log(params);
        },
      });
      menu.open({
        //@ts-ignore
        x: params.event.event.clientX + 5,
        //@ts-ignore
        y: params.event.event.clientY + 5,
      });
    }
    /**
     * 未构建children和parent
     * @param block
     * @returns
     */
    async function buildNode(block: Block) {
      let node: nodeModel;
      let labelName = buildNodeLabel(block);
      node = {
        ...block,
        children: [],
        name: labelName,
        labelName: labelName,
        value: [0, 0],
      };
      const parentBlock = await sy.getParentBlock(block);
      if (parentBlock) {
        node.parent_id = parentBlock.id;
      } else {
        node.parent_id = "root";
      }
      return node;
    }
    function buildNodeLabel(block: Block): string {
      if (block.name) {
        return block.name;
      }
      const labelLength = 8; //todo 可以改为自定义
      switch (block.type) {
        case "d":
        case "h":
        case "p":
          let label = "";
          if (block.content.length > labelLength) {
            label = block.content.substring(0, labelLength) + "...";
          } else {
            label = block.content;
          }
          return label;
        default:
          return sy.typeAbbrMap[block.type];
      }
    }
    function buildGraphNode(node: nodeModel) {
      let graphNode: graphNodeModel = structuredClone(node);
      //graphNode.labelName = node.name;
      graphNode.name = node.id;
      graphNode.fixed = true;
      return graphNode;
    }
    function buildEdge(source: graphNodeModel, target: graphNodeModel) {
      let link: edgeModel = {
        source: source.name,
        target: target.name,
        labelName: "", //todo
      };
      return link;
    }
    /**
     * 向树添加节点时，会递归添加其父节点（如果原树中没有的话）
     * @param node
     * @returns
     */
    async function addNodeToTreeData(node: nodeModel) {
      //console.log("添加节点到treeData", node.labelName);
      //*node为box
      if (node.type == "box") {
        //&& node.id
        console.log(treeData);
        let added = treeData[0].children.find((child) => {
          return child.id == node.id;
        });
        if (!added) {
          treeData[0].children.push(node);
          return;
        }
        return;
      }
      //*查找parent
      let parent = findTreeDataById(treeData, node.parent_id);
      if (parent) {
        //?不可行 node.parent = parent;
        //*添加node
        let added = parent.children.find((child) => {
          return child.id == node.id;
        });
        if (!added) {
          parent.children.push(node);
        } else {
          //?added.parent = parent;
        }
        return;
      } else {
        //*添加parent
        const parentBlock = await sy.getParentBlock(node);
        let parentNode = await buildNode(parentBlock);
        parentNode.children.push(node);
        await addNodeToTreeData(parentNode);
      }
    }
    /**
     * 除了addNodeToTreeData本身，在其他任何地方调用addNodeToTreeData，都必须立刻刷新数据
     */
    async function addNodeToTreeDataAndRefresh(node: nodeModel) {
      await addNodeToTreeData(node);
      refreshGraph();
      return;
    }
    function findTreeDataById(children: nodeModel[], id: string) {
      let node: nodeModel;
      for (let child of children) {
        if (child.id == id) {
          node = child;
          break;
        } else {
          node = findTreeDataById(child.children, id);
          if (node) {
            break;
          }
        }
      }
      return node;
    }
    function addNodesAndEdges(
      otherNodes: nodeModel[],
      origin: nodeModel,
      edgeType: edgeType
    ) {
      if (otherNodes.length == 0) {
        return;
      }
      const originNode = buildGraphNode(origin);
      addNodeToGraphData(originNode);
      for (let otherNode of otherNodes) {
        let other = buildGraphNode(otherNode);
        addNodeToGraphData(other);
        let edge: edgeModel;
        if (edgeType == "ref") {
          edge = buildEdge(originNode, other);
        } else {
          edge = buildEdge(other, originNode);
        }
        if (!edge.target && !edge.source) {
          continue;
        }
        let edgeAdded = graphLinks.find((value) => {
          return value.source == edge.source && value.target == edge.target;
        });
        if (!edgeAdded) {
          graphLinks.push(edge);
        }
      }
    }
    function addNodeToGraphData(node: graphNodeModel) {
      let nodeAdded = graphData.find((value) => {
        return value.id == node.id;
      });
      //*计算node位置
      let { idList, itemLayouts } = getTreeNodePositionParams();
      const treeLikeNode = node;
      let { x, y } = getTreeNodePosition(treeLikeNode, idList, itemLayouts);
      node.value = [x, y];
      /*
      let realPosition = graph.convertToPixel({ seriesId: "blockTree" }, [
        x,
        y,
      ]);
      [node.x, node.y] = graph.convertFromPixel(
        { seriesId: "blockGraph" },
        realPosition
      );*/
      if (!nodeAdded) {
        graphData.push(node);
      } else {
        nodeAdded = node;
      }
    }
    function getTreeNodePositionParams() {
      let info = getDataInfo(0);
      let idList = info._idList as BlockId[];
      let itemLayouts = info._itemLayouts as {
        x: number;
        y: number;
      }[];
      return { idList: idList, itemLayouts: itemLayouts };
    }
    function getTreeNodePosition(
      node: nodeModel | graphNodeModel,
      idList: BlockId[],
      itemLayouts: { x: number; y: number }[]
    ) {
      let index = idList.findIndex((item) => {
        return item == node.id;
      });
      if (index >= itemLayouts.length || !itemLayouts[index]) {
        let parent = findTreeDataById(treeData, node.parent_id);
        if (!parent) {
          console.error(
            `尝试在treeData中查找'${node.labelName}'(${node.id})的父节点(${node.parent_id})失败`
          );
          console.log("此时的图数据", graph.getOption());
          throw "在tree中找不到父节点";
        }
        return getTreeNodePosition(parent, idList, itemLayouts);
      } else {
        return itemLayouts[index];
      }
    }
    async function expandNode(node: nodeModel) {
      let originBlock = await sy.getBlockById(node.id);
      if (!originBlock) {
        return;
      }
      //*children
      const childrenBlocks = await sy.getChildrenBlocks(node.id);
      //console.log(childrenBlocks);
      for (let child of childrenBlocks) {
        let node = await buildNode(child);
        await addNodeToTreeDataAndRefresh(node);
      }
      //*refBlocks
      const refBlocks = await sy.getRefBlocks(node.id);
      let refNodes: nodeModel[] = [];
      for (let child of refBlocks) {
        let node = await buildNode(child);
        await addNodeToTreeDataAndRefresh(node);
        refNodes.push(node);
      }
      addNodesAndEdges(refNodes, node, "ref");
      //*defBlocks
      const defBlocks = await sy.getDefBlocks(node.id);
      let defNodes: nodeModel[] = [];
      for (let child of defBlocks) {
        let node = await buildNode(child);
        await addNodeToTreeDataAndRefresh(node);
        defNodes.push(node);
      }
      addNodesAndEdges(defNodes, node, "def");
      reComputePosition();
      refreshGraph();
    }

    async function sleep(time: number) {
      return new Promise((res) => {
        setTimeout(res, time);
      });
    }
  }

  onLayoutReady() {
    this.loadData(STORAGE_NAME);
    console.log(`frontend: ${getFrontend()}; backend: ${getBackend()}`);
  }

  onunload() {
    console.log(this.i18n.prefix, this.i18n.byePlugin);
  }
}
type edgeType = "parent" | "child" | "ref" | "def";
interface nodeModel extends Block {}
interface nodeModel extends TreeSeriesNodeItemOption {
  labelName: string;
  id: BlockId;
  parent_id?: BlockId; //?会改变
  name: string; //?会改变
  children: nodeModel[]; //?
  //?不可行，会无限clone parent: nodeModel;
  value: [number, number];
}
interface edgeModel extends GraphEdgeItemOption {
  labelName: string;
}
interface graphNodeModel extends Block {}
interface graphNodeModel extends GraphNodeItemOption {
  labelName: string;
  id: BlockId;
  parent_id?: BlockId; //?会改变
  name: string; //?会改变
  value: [number, number];
}
