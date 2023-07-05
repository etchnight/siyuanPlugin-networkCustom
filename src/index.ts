import { Plugin, getFrontend, getBackend, Menu } from "siyuan";
import "./index.scss";
import * as sy from "../../siyuanPlugin-common/siyuan-api";
import * as syTypes from "../../siyuanPlugin-common/types/siyuan-api";
//import { merge } from "lodash";
//↓↓↓↓↓eacharts↓↓↓↓↓
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
//↑↑↑↑↑eacharts↑↑↑↑↑
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
    const i18n = this.i18n;
    let graph = this.graph;
    let lastTabWidth = this.lastTabWidth;
    let graphData = this.graphData;
    let graphLinks = this.graphLinks;
    let treeData = this.treeData;
    //let graphOption: ECOption;
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
        title: i18n.pluginName,
      },
      data: {
        text: "",
      },
      type: DOCK_TYPE,
      init() {
        this.element.innerHTML =
          //html
          `<div class="fn__flex-1 fn__flex-column">
          <div class="block__icons">
              <div class="block__logo">
                  <svg>
                      <use xlink:href="#icon_networkCustom"></use>
                  </svg>
                  ${i18n.pluginName}
              </div>
              <span class="fn__flex-1 fn__space"></span>
          </div>
          <div class="fn__flex-1 plugin-sample__custom-dock" id='container_networkCustom'>
          </div>
      </div>`;
        //console.log(window.customGraph.i18n.prefix,"init");
        lastTabWidth = document.getElementById(
          "container_networkCustom"
        ).offsetWidth;
      },
      update() {
        lastTabWidth = document.getElementById(
          "container_networkCustom"
        ).offsetWidth;
      },
      async resize() {
        const container = document.getElementById("container_networkCustom");
        const widthNum = container.offsetWidth;
        const heightNum = container.offsetHeight;
        //console.log("resizeFunction","lastTabWidth:",lastTabWidth,"widthNum:", widthNum);
        if (lastTabWidth == widthNum) {
          return;
        }
        if (widthNum == 0 || !widthNum) {
          //*清除画布
          //console.log("clear");
          if (graph) {
            graph.clear();
          }
        } else {
          if (lastTabWidth == 0) {
            //*重绘
            //console.log("reInitGraph", widthNum, heightNum);
            await reInitGraph(container, widthNum, heightNum);
          } else {
            //*改变大小
            //console.log("resize", widthNum, heightNum);
            resizeGraph(widthNum, heightNum);
          }
        }
        lastTabWidth = widthNum || 0;
      },
      destroy() {
        graph.dispose();
        console.log("destroy dock:", DOCK_TYPE);
      },
    });
    console.log(this.i18n.prefix, this.i18n.helloPlugin);
    async function resizeGraph(widthNum: number, heightNum: number) {
      if (!graph) {
        return;
      }
      //let graphOption = graph.getOption();
      graph.resize({
        width: widthNum,
        height: heightNum,
        animation: {
          duration: 200,
        },
      });
      /*
      graphOption.xAxis[0].max =
        widthNum - graphOption.grid[0].left - graphOption.grid[0].right;
      graphOption.yAxis[0].max =
        heightNum - graphOption.grid[0].top - graphOption.grid[0].bottom;
      graph.setOption(graphOption);*/
      reComputePosition();
      refreshGraph(1);
    }

    /**
     * 初始化图表
     * @param container
     * @param widthNum
     * @param heightNum
     * @returns
     */
    async function reInitGraph(
      container: HTMLElement,
      widthNum: number,
      heightNum: number
    ) {
      if (!graph) {
        graph = echarts.init(container, null, {
          width: widthNum,
          height: heightNum,
        });
        //console.log("init", widthNum, heightNum);
      }
      const grid = {
        left: 50,
        width: widthNum - 50 - 50, //-left-right
        top: 30,
        height: heightNum - 30 - 30, //-top-bottom
      };
      let graphOption: ECOption = {
        grid: [
          {
            left: grid.left,
            width: grid.width,
            top: grid.top,
            height: grid.height,
          },
        ],
        xAxis: [
          {
            type: "value",
            min: 0,
            max: grid.width,
            show: false,
          },
        ],
        yAxis: [
          {
            type: "value",
            min: 0,
            max: grid.height,
            inverse: true,
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
              position: "top",
              textBorderColor: "#111f2c",
              textBorderWidth: 2,
            },
            roam: true,
            //lineStyle: {
            //  width: 15,
            //},
            //symbolSize: 50,
          },
          {
            type: "graph",
            id: "blockGraph",
            data: graphData,
            links: graphLinks,
            layout: "none",
            coordinateSystem: "cartesian2d",
            xAxisIndex: 0,
            yAxisIndex: 0,
            z: 5,
            label: {
              show: false,
              position: "bottom",
            },
            edgeSymbol: ["none", "arrow"],
            //lineStyle: {
            //  width: 15,
            //},
            //edgeSymbolSize: 50,
          },
        ],
      };
      //*统一树图和关系图尺寸grid
      for (let key of Object.keys(grid)) {
        graphOption.series[0][key] = grid[key];
        //graphOption.series[1][key] = grid[key];
      }
      //graphOption = forDevInit(graphOption); //调试用
      graph.setOption(graphOption);
      graphData = []; //清空数据
      graphLinks = [];
      //---设置动作---
      graph.on("contextmenu", onContextMenu);
      graph.on("click", onNodeClick);
      graph.on("treeroam", reComputePosition);
      graph.on("mouseover", onMouseOver);
      //---清空并添加初始节点---
      const startNodeId = sy.getFocusNodeId();
      if (!startNodeId) {
        sy.pushErrMsg(i18n.prefix + i18n.startNodeError);
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
      await addNodeToTreeDataAndRefresh(startNodeModel);
      //addBorderGraphData();
      await expandNode(startNodeModel);
    }

    function forDevInit(graphOption: ECOption) {
      graphOption.series[0].label.formatter = (params: { data }) => {
        let labelName = params.data.labelName;
        let { idList, itemLayouts } = getTreeNodePositionParams();
        let { x, y } = getTreeNodePosition(params.data, idList, itemLayouts);
        x = Math.round(x);
        y = Math.round(y);
        //let pixel = graph.convertToPixel({ seriesIndex: 0 }, [x, y]);
        return `${labelName}:${x},${y}`;
      };
      graphOption.series[1].label.formatter = (params: { data }) => {
        let x = Math.round(params.data.value[0]);
        let y = Math.round(params.data.value[1]);
        let labelName = params.data.labelName;
        //let pixel = graph.convertToPixel({ seriesIndex: 1 }, [x, y]);
        return `${labelName}:${x},${y}`;
      };
      graphOption.series[1].label.show = true;
      graphOption.xAxis[0].show = true;
      graphOption.yAxis[0].show = true;
      graph.on("finished", () => {
        console.groupCollapsed("调试信息");
        try {
          let model = graph.getModel();
          console.log("model", model);
          console.log("TreeModel", model.getSeriesByIndex(0));
          console.log("graphModel", model.getSeriesByIndex(1));
          console.log("TreeInfo", getDataInfo(0));
          console.log("graphInfo", getDataInfo(1));
          console.log("option", graph.getOption());
          console.log("graph", graph);
        } catch (e) {
          console.log("获取信息失败");
        } finally {
          console.groupEnd();
        }
      });
      return graphOption;
    }
    /**
     * 注意，只刷新数据，其他设置无法改变
     * @param index 0树状图，1关系图，2全部
     */
    function refreshGraph(index: 0 | 1 | 2) {
      let option = graph.getOption();
      if (index == 0 || index == 2) {
        option.series[0].data = treeData; //todo 更稳妥的方式是使用Id检索
      }
      if (index == 1 || index == 2) {
        option.series[1].data = graphData;
        option.series[1].links = graphLinks;
      }
      graph.setOption(option);
    }
    function getDataInfo(index: number) {
      //https://github.com/apache/echarts/issues/5614
      //将echarts/types/dist/shared中getModel设为pubilic
      let series = getSeries(index);
      let info = series.getData();
      return info;
    }
    function getSeries(index: number) {
      let model = graph.getModel();
      let series = model.getSeriesByIndex(index);
      return series;
    }
    /**
     * 重算关系图位置
     */
    function reComputePosition() {
      let { idList, itemLayouts } = getTreeNodePositionParams();
      let option = graph.getOption();
      for (let node of graphData) {
        node = treePosition2GraphValue(
          node,
          idList,
          itemLayouts,
          option.grid[0].left,
          option.grid[0].top
        );
      }
      refreshGraph(1);
    }
    /**
     * todo 集中获取treePosition2GraphValue所需参数
     * @returns
     */
    function treePosition2GraphValueParams() {
      const { idList, itemLayouts } = getTreeNodePositionParams();
      const option = graph.getOption();
      return {
        idList: idList,
        itemLayouts: itemLayouts,
        left: option.grid[0].left,
        top: option.grid[0].top,
      };
    }
    function treePosition2GraphValue(
      node: graphNodeModel,
      idList: string[],
      itemLayouts: { x: number; y: number }[],
      left: number,
      top: number,
      index?: number
    ) {
      const tree = index ? getSeries(2) : getSeries(0); //todo 标签预留
      let { x, y } = getTreeNodePosition(node, idList, itemLayouts);
      //node.value = [x, y];
      //node.x = x;
      //node.y = y;
      let realPosition = tree.coordinateSystem.dataToPoint(
        [x, y]
        //tree.coordinateSystem._zoom
      );
      realPosition[0] += left * tree.coordinateSystem._zoom;
      realPosition[1] += top * tree.coordinateSystem._zoom;
      node.value = graph.convertFromPixel(
        { gridIndex: 0 },
        realPosition
      ) as unknown as [number, number];
      return node;
    }
    function onMouseOver(params: echarts.ECElementEvent) {
      console.log(params);
    }
    function onNodeClick(params: ECElementEventParams) {
      switch (params.componentSubType) {
        case "tree":
          reComputePosition();
          //*记忆节点折叠情况
          let treeNode = findTreeDataById(treeData, params.data.id);
          treeNode.collapsed = params.collapsed;
          refreshGraph(2);
          break;
        case "graph":
          break;
      }
    }
    function onContextMenu(params: ECElementEventParams) {
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
    async function buildNode(block: syTypes.Block) {
      let node: nodeModel;
      let labelName = buildNodeLabel(block);
      node = {
        ...block,
        children: [],
        name: labelName,
        labelName: labelName,
        //value: [0, 0],
      };
      const parentBlock = await sy.getParentBlock(block);
      if (parentBlock) {
        node.parent_id = parentBlock.id;
      } else {
        node.parent_id = "root";
      }
      return node;
    }
    function buildNodeLabel(block: syTypes.Block): string {
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
      //!强制转换
      //@ts-ignore
      let graphNode: graphNodeModel = structuredClone(node);
      //graphNode.labelName = node.name;
      graphNode.name = node.id;
      graphNode.fixed = true;
      return graphNode;
    }
    function buildEdge(source: graphNodeModel, target: graphNodeModel) {
      let link: edgeModel = {
        id: `${source.name}-${target.name}`,
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
        //console.log(treeData);
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
      refreshGraph(2);
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
        let edgeAdded = graphLinks.find((item) => {
          return item.source == edge.source && item.target == edge.target;
        });
        if (!edgeAdded) {
          graphLinks.push(edge);
        }
      }
    }
    function addNodeToGraphData(node: graphNodeModel) {
      let nodeAdded = graphData.find((item) => {
        return item.id == node.id;
      });
      //*计算node位置
      let { idList, itemLayouts } = getTreeNodePositionParams();
      const option = graph.getOption();
      node = treePosition2GraphValue(
        node,
        idList,
        itemLayouts,
        option.grid[0].left,
        option.grid[0].top
      );
      if (!nodeAdded) {
        graphData.push(node);
      } else {
        nodeAdded = node;
      }
    }
    /**
     * 生成getTreeNodePosition的必备参数，防止反复获取
     * @returns idList,itemLayouts
     */
    function getTreeNodePositionParams() {
      let info = getDataInfo(0);
      let idList = info._idList as syTypes.BlockId[];
      let itemLayouts = info._itemLayouts as {
        x: number;
        y: number;
      }[];
      return { idList: idList, itemLayouts: itemLayouts };
    }
    function getTreeNodePosition(
      node: graphNodeModel,
      idList: syTypes.BlockId[],
      itemLayouts: { x: number; y: number }[]
    ): {
      x: number;
      y: number;
    } {
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
        return getTreeNodePosition(buildGraphNode(parent), idList, itemLayouts);
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
      refreshGraph(1);
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
interface nodeModel extends syTypes.Block {}
interface nodeModel extends TreeSeriesNodeItemOption {
  labelName: string;
  id: syTypes.BlockId;
  parent_id?: syTypes.BlockId; //?会改变
  name: string; //?会改变
  children: nodeModel[]; //?
  //?不可行，会无限clone parent: nodeModel;
  //value: [number, number];
}
interface edgeModel extends GraphEdgeItemOption {
  id: string;
  labelName: string;
}
interface graphNodeModel extends syTypes.Block {}
interface graphNodeModel extends GraphNodeItemOption {
  labelName: string;
  id: syTypes.BlockId;
  parent_id?: syTypes.BlockId; //?会改变
  name: string; //?会改变
  value: [number, number];
}
interface ECElementEventParams extends echarts.ECElementEvent {
  data: nodeModel | edgeModel | graphNodeModel;
}
