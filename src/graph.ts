import {
  getBlockById,
  getChildrenBlocks,
  getDefBlocks,
  getFocusNodeId,
  getParentBlock,
  getRefBlocks,
  pushErrMsg,
  typeAbbrMap,
} from "../../siyuanPlugin-common/siyuan-api";
import {
  Block,
  BlockId,
  Window_siyuan,
} from "../../siyuanPlugin-common/types/siyuan-api";
import { Plugin, Menu, openTab, App } from "siyuan";
//*↓↓↓↓↓eacharts↓↓↓↓↓
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
//*↑↑↑↑↑eacharts↑↑↑↑↑
export class echartsGraph {
  private i18n: i18nType;
  public graph: echarts.ECharts;
  public treeData: nodeModel[] = [];
  public graphData: graphNodeModel[] = [];
  public graphLinks: edgeModel[] = [];
  private app: App;
  private plugin: Plugin;
  private debug: boolean;
  private rootBlock: Block;
  constructor(i18n: i18nType, app: App, plugin: Plugin) {
    this.i18n = i18n;
    this.app = app;
    this.plugin = plugin;
    this.debug = false;
    this.rootBlock = {
      id: "root",
      root_id: "root",
      hash: "",
      box: "",
      path: "",
      hpath: "",
      name: "root",
      alias: "",
      memo: "",
      tag: "",
      content: "",
      markdown: "",
      length: 0,
      type: "other",
      subtype: "other",
      sort: 0,
      created: "",
      updated: "",
    };
  }
  public async resizeGraph(widthNum: number, heightNum: number) {
    if (!this.graph) {
      return;
    }
    //let graphOption = graph.getOption();
    this.graph.resize({
      width: widthNum,
      height: heightNum,
      animation: {
        duration: 200,
      },
    });
    const option = this.graph.getOption() as ECOption;
    //@ts-ignore
    if (option && option.series.length > 0) {
      this.reComputePosition();
    }
  }
  public initGraph(
    container: HTMLElement,
    widthNum: number,
    heightNum: number
  ) {
    if (!this.graph) {
      this.graph = echarts.init(container, null, {
        width: widthNum,
        height: heightNum,
      });
      //console.log("init", widthNum, heightNum);
    }
    //---设置动作---
    this.graph.on("contextmenu", (params) => {
      this.onContextMenu(params as ECElementEventParams);
    });
    this.graph.on("click", (params) => {
      this.onNodeClick(params as ECElementEventParams);
    });
    this.graph.on("treeroam", () => {
      this.reComputePosition();
    });
    //graph.on("mouseover", onMouseOver);
  }
  /**
   * 初始化图表
   * @param container
   * @param widthNum
   * @param heightNum
   * @returns
   */
  public async reInitGraph(widthNum: number, heightNum: number) {
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
          data: this.treeData,
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
          emphasis: {
            //高亮显示所有内容
            disabled: false,
            label: {
              formatter: (params: { data }) => {
                return params.data.content;
              },
              backgroundColor: "#000000",
              padding: 4,
              width: 150,
              overflow: "break",
              lineHeight: 15,
            },
          },
          //lineStyle: {
          //  width: 15,
          //},
          //symbolSize: 50,
        },
        {
          type: "graph",
          id: "blockGraph",
          data: this.graphData,
          links: this.graphLinks,
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
          itemStyle: { opacity: 0 },
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
    graphOption.series[0].width = graphOption.series[0].width - 50;
    //graphOption = forDevInit(graphOption); //调试用
    this.graph.setOption(graphOption);
    this.graphData = []; //清空数据
    this.graphLinks = [];
    //---清空并添加初始节点---
    const startNodeId = getFocusNodeId();
    if (!startNodeId) {
      pushErrMsg(this.i18n.prefix + this.i18n.startNodeError);
      return;
    }
    const startBlock = await getBlockById(startNodeId);
    const startNodeModel = await this.buildNode(startBlock);
    let rootNode: nodeModel = structuredClone(startNodeModel);
    for (let key of Object.keys(rootNode)) {
      rootNode[key] = "";
    }
    rootNode.children = [];
    rootNode.id = "root";
    this.treeData = [rootNode];
    await this.addNodeToTreeDataAndRefresh(startNodeModel);
    //addBorderGraphData();
    await this.expandNode(startNodeModel);
  }

  private forDevInit(graphOption: ECOption) {
    graphOption.series[0].label.formatter = (params: { data }) => {
      let labelName = params.data.labelName;
      let { idList, itemLayouts } = this.getTreeNodePositionParams();
      let { x, y } = this.getTreeNodePosition(params.data, idList, itemLayouts);
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
    this.graph.on("finished", () => {
      console.groupCollapsed("调试信息");
      try {
        let model = this.graph.getModel();
        console.log("model", model);
        console.log("TreeModel", model.getSeriesByIndex(0));
        console.log("graphModel", model.getSeriesByIndex(1));
        console.log("TreeInfo", this.getDataInfo(0));
        console.log("graphInfo", this.getDataInfo(1));
        console.log("option", this.graph.getOption());
        console.log("graph", this.graph);
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
  private refreshGraph(index: 0 | 1 | 2) {
    let option = this.graph.getOption();
    if (index == 0 || index == 2) {
      option.series[0].data = this.treeData; //todo 更稳妥的方式是使用Id检索
    }
    if (index == 1 || index == 2) {
      option.series[1].data = this.graphData;
      option.series[1].links = this.graphLinks;
    }
    this.graph.setOption(option);
  }
  private getDataInfo(index: number) {
    //https://github.com/apache/echarts/issues/5614
    //将echarts/types/dist/shared中getModel设为pubilic
    let series = this.getSeries(index);
    let info = series.getData();
    return info;
  }
  private getSeries(index: number) {
    let model = this.graph.getModel();
    let series = model.getSeriesByIndex(index);
    return series;
  }
  /**
   * 重算关系图位置
   */
  private reComputePosition() {
    let { idList, itemLayouts } = this.getTreeNodePositionParams();
    let option = this.graph.getOption();
    for (let node of this.graphData) {
      node = this.treePosition2GraphValue(
        node,
        idList,
        itemLayouts,
        option.grid[0].left,
        option.grid[0].top
      );
    }
    this.refreshGraph(1);
  }
  /**
   * todo 集中获取treePosition2GraphValue所需参数
   * @returns
   */
  private treePosition2GraphValueParams() {
    const { idList, itemLayouts } = this.getTreeNodePositionParams();
    const option = this.graph.getOption();
    return {
      idList: idList,
      itemLayouts: itemLayouts,
      left: option.grid[0].left,
      top: option.grid[0].top,
    };
  }
  private treePosition2GraphValue(
    node: graphNodeModel,
    idList: string[],
    itemLayouts: { x: number; y: number }[],
    left: number,
    top: number,
    index?: number
  ) {
    const tree = index ? this.getSeries(2) : this.getSeries(0); //todo 标签预留
    let { x, y } = this.getTreeNodePosition(node, idList, itemLayouts);
    //node.value = [x, y];
    //node.x = x;
    //node.y = y;
    let realPosition = tree.coordinateSystem.dataToPoint(
      [x, y]
      //tree.coordinateSystem._zoom
    );
    realPosition[0] += left * tree.coordinateSystem._zoom;
    realPosition[1] += top * tree.coordinateSystem._zoom;
    node.value = this.graph.convertFromPixel(
      { gridIndex: 0 },
      realPosition
    ) as unknown as [number, number];
    return node;
  }
  private onContextMenu(params: ECElementEventParams) {
    if (!this.graph) {
      return;
    }
    const menu = new Menu("plugin-networkCustom-Menu", () => {
      //console.log("菜单");
    });
    menu.addItem({
      icon: "",
      label: "展开节点",
      click: () => {
        this.expandNode(params.data as nodeModel);
      },
    });
    menu.addItem({
      icon: "iconLayoutBottom",
      label: "在笔记中定位节点", //todo 国际化
      click: async () => {
        openTab({
          app: this.app,
          doc: {
            id: params.data.id,
            action: ["cb-get-focus"],
          },
        });
      },
    });
    const event = params.event.event as MouseEvent;
    //*鼠标指针一定要在新panel里，不然会立刻关闭窗口
    let panelX = event.clientX - 600; //768
    let panelY = event.clientY - 150; //min:288
    if (panelY + 288 > window.innerHeight) {
      panelY = window.innerHeight - 310;
    }
    menu.addItem({
      icon: "iconLayout",
      label: "在浮动窗口查看节点",
      click: async () => {
        this.plugin.addFloatLayer({
          ids: [params.data.id],
          x: panelX,
          y: panelY,
        });
        //*查找新panel并钉住
        const panels = window.siyuan.blockPanels;
        const currentPanel = panels.find((value) => {
          if (value.nodeIds.length == 0) {
            return false;
          }
          return value.nodeIds[0] == params.data.id;
        });
        let ele = currentPanel.element;
        ele = ele.querySelector("[data-type=pin]");
        ele.click();
      },
    });
    menu.open({
      x: event.clientX + 5,
      y: event.clientY + 5,
    });
    return;
  }
  private onNodeClick(params: ECElementEventParams) {
    switch (params.componentSubType) {
      case "tree":
        this.reComputePosition();
        //*记忆节点折叠情况
        let treeNode = this.findTreeDataById(this.treeData, params.data.id);
        treeNode.collapsed = params.collapsed;
        this.refreshGraph(2);
        break;
      case "graph":
        break;
    }
  }
  /**
   * 未构建children和parent
   * @param block
   * @returns
   */
  private async buildNode(block: Block) {
    let node: nodeModel = this.buildNodeWithoutParent(block);
    const parentBlock = await getParentBlock(block);
    if (parentBlock) {
      node.parentBlock = parentBlock;
      node.parent_id = parentBlock.id;
    } else {
      node.parent_id = "root";
      node.parentBlock = this.rootBlock;
    }
    return node;
  }
  private buildNodeWithoutParent(block: Block) {
    let node: nodeModel;
    let labelName = this.buildNodeLabel(block);
    node = {
      ...block,
      children: [],
      name: labelName,
      labelName: labelName,
      //value: [0, 0],
    };
    return node;
  }
  private buildNodeLabel(block: Block): string {
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
        return typeAbbrMap[block.type];
    }
  }
  private buildGraphNode(node: nodeModel) {
    //!强制转换
    let graphNode: graphNodeModel = structuredClone(
      node
    ) as unknown as graphNodeModel;
    //graphNode.labelName = node.name;
    graphNode.name = node.id;
    graphNode.fixed = true;
    return graphNode;
  }
  private buildEdge(source: graphNodeModel, target: graphNodeModel) {
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
  private async addNodeToTreeData(node: nodeModel) {
    //console.log("添加节点到treeData", node.labelName);
    //*node为box
    if (node.type == "box") {
      //&& node.id
      //console.log(treeData);
      let added = this.treeData[0].children.find((child) => {
        return child.id == node.id;
      });
      if (!added) {
        this.treeData[0].children.push(node);
        return;
      }
      return;
    }
    //*查找parent
    let parent = this.findTreeDataById(this.treeData, node.parent_id);
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
      //const parentBlock = await getParentBlock(node);
      let parentNode = await this.buildNode(node.parentBlock);
      parentNode.children.push(node);
      await this.addNodeToTreeData(parentNode);
    }
  }
  /**
   * 除了addNodeToTreeData本身，在其他任何地方调用addNodeToTreeData，都必须立刻刷新数据
   */
  private async addNodeToTreeDataAndRefresh(node: nodeModel) {
    await this.addNodeToTreeData(node);
    this.refreshGraph(2);
    return;
  }
  private findTreeDataById(children: nodeModel[], id: string) {
    let node: nodeModel;
    for (let child of children) {
      if (child.id == id) {
        node = child;
        break;
      } else {
        node = this.findTreeDataById(child.children, id);
        if (node) {
          break;
        }
      }
    }
    return node;
  }
  private addNodesAndEdges(
    otherNodes: nodeModel[],
    origin: nodeModel,
    edgeType: edgeType
  ) {
    if (otherNodes.length == 0) {
      return;
    }
    const originNode = this.buildGraphNode(origin);
    this.addNodeToGraphData(originNode);
    for (let otherNode of otherNodes) {
      let other = this.buildGraphNode(otherNode);
      this.addNodeToGraphData(other);
      let edge: edgeModel;
      if (edgeType == "ref") {
        edge = this.buildEdge(originNode, other);
      } else {
        edge = this.buildEdge(other, originNode);
      }
      if (!edge.target && !edge.source) {
        continue;
      }
      let edgeAdded = this.graphLinks.find((item) => {
        return item.source == edge.source && item.target == edge.target;
      });
      if (!edgeAdded) {
        this.graphLinks.push(edge);
      }
    }
  }
  private addNodeToGraphData(node: graphNodeModel) {
    let nodeAdded = this.graphData.find((item) => {
      return item.id == node.id;
    });
    //*计算node位置
    let { idList, itemLayouts } = this.getTreeNodePositionParams();
    const option = this.graph.getOption();
    node = this.treePosition2GraphValue(
      node,
      idList,
      itemLayouts,
      option.grid[0].left,
      option.grid[0].top
    );
    if (!nodeAdded) {
      this.graphData.push(node);
    } else {
      nodeAdded = node;
    }
  }
  /**
   * 生成getTreeNodePosition的必备参数，防止反复获取
   * @returns idList,itemLayouts
   */
  private getTreeNodePositionParams() {
    let info = this.getDataInfo(0);
    let idList = info._idList as BlockId[];
    let itemLayouts = info._itemLayouts as {
      x: number;
      y: number;
    }[];
    return { idList: idList, itemLayouts: itemLayouts };
  }
  private getTreeNodePosition(
    node: graphNodeModel,
    idList: BlockId[],
    itemLayouts: { x: number; y: number }[]
  ): {
    x: number;
    y: number;
  } {
    let index = idList.findIndex((item) => {
      return item == node.id;
    });
    if (index >= itemLayouts.length || !itemLayouts[index]) {
      let parent = this.findTreeDataById(this.treeData, node.parent_id);
      if (!parent) {
        console.error(
          `尝试在treeData中查找'${node.labelName}'(${node.id})的父节点(${node.parent_id})失败`
        );
        console.log("此时的图数据", this.graph.getOption());
        throw "在tree中找不到父节点";
      }
      return this.getTreeNodePosition(
        this.buildGraphNode(parent),
        idList,
        itemLayouts
      );
    } else {
      return itemLayouts[index];
    }
  }
  private devConsole(callback, ...args) {
    if (!this.debug) {
      return;
    }
    callback(...args);
  }
  private async sleep(time: number) {
    return new Promise((res) => {
      setTimeout(res, time);
    });
  }
  public async expandNode(node: nodeModel) {
    //this.graph.showLoading();//?有概率导致右键菜单失效
    this.devConsole(console.time, "expandNode");
    let originBlock = await getBlockById(node.id);
    this.devConsole(console.timeLog, "expandNode", "originBlock");
    if (!originBlock) {
      return;
    }
    //*children
    const childrenBlocks = await getChildrenBlocks(node.id);
    this.devConsole(console.timeLog, "expandNode", "children-blocks");
    for (let child of childrenBlocks) {
      let node = this.buildNodeWithoutParent(child);
      node.parent_id = originBlock.id;
      await this.addNodeToTreeDataAndRefresh(node);
    }
    this.devConsole(console.timeLog, "expandNode", "children");
    //*refBlocks
    const refBlocks = await getRefBlocks(node.id);
    let refNodes: nodeModel[] = [];
    for (let child of refBlocks) {
      let node = await this.buildNode(child);
      await this.addNodeToTreeDataAndRefresh(node);
      refNodes.push(node);
    }
    this.addNodesAndEdges(refNodes, node, "ref");
    this.devConsole(console.timeLog, "expandNode", "refBlocks");
    //*defBlocks
    const defBlocks = await getDefBlocks(node.id);
    let defNodes: nodeModel[] = [];
    for (let child of defBlocks) {
      let node = await this.buildNode(child);
      await this.addNodeToTreeDataAndRefresh(node);
      defNodes.push(node);
    }
    this.addNodesAndEdges(defNodes, node, "def");
    this.devConsole(console.timeLog, "expandNode", "defBlocks");
    this.reComputePosition();
    this.devConsole(console.timeEnd, "expandNode");
    //this.graph.hideLoading();
  }
}

type edgeType = "parent" | "child" | "ref" | "def";
export interface nodeModel extends Block {}
export interface nodeModel extends TreeSeriesNodeItemOption {
  labelName: string;
  id: BlockId;
  parent_id?: BlockId; //?会改变
  name: string; //?会改变
  children: nodeModel[]; //?
  //?不可行，会无限clone parent: nodeModel;
  //value: [number, number];
  parentBlock?: Block;
}
interface edgeModel extends GraphEdgeItemOption {
  id: string;
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
export interface ECElementEventParams extends echarts.ECElementEvent {
  data: nodeModel | edgeModel | graphNodeModel;
}

export type i18nType = {
  prefix: string;
  startNodeError: string;
};
declare global {
  interface Window {
    siyuan: Window_siyuan;
  }
}
