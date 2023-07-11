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
  BlockType,
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
  public treeData: nodeModelTree[] = [];
  public graphData: nodeModelGraph[] = [];
  public graphLinks: edgeModel[] = [];
  public tagTreeData: nodeModelTree[] = [];
  private app: App;
  private plugin: Plugin;
  private debug: boolean;
  //private rootBlock: Block;
  constructor(i18n: i18nType, app: App, plugin: Plugin) {
    this.i18n = i18n;
    this.app = app;
    this.plugin = plugin;
    this.debug = false;
  }
  public async resizeGraph(widthNum: number, heightNum: number) {
    if (!this.graph) {
      return;
    }
    this.graph.resize({
      width: widthNum,
      height: heightNum,
      animation: {
        duration: 200,
      },
    });
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
    this.graph.on("treeroam", (params) => {
      this.onTreeroam(params as ECElementEventParams);
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
  public reInitGraph(widthNum: number, heightNum: number) {
    const grid = {
      left: 50,
      width: widthNum - 50 - 50, //-left-right
      top: 30,
      height: heightNum - 30 - 30, //-top-bottom
    };
    const blockTreeSeries = this.buildTreeOpt("blockTree", grid);
    const tagTreeSeries = this.buildTreeOpt("tagTree", grid);
    const graphSeries: GraphSeriesOption = {
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
    };
    const graphOption: ECOption = {
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
      series: [blockTreeSeries, graphSeries, tagTreeSeries],
    };
    //graphOption = forDevInit(graphOption); //调试用
    this.graph.setOption(graphOption);
  }
  private buildTreeOpt(
    seriesId: seriesID,
    grid: { left: number; width: number; top: number; height: number }
  ): TreeSeriesOption {
    const labelFormatter = (params: { data }) => {
      return params.data.content;
    };
    const tagTreeSeriesWidth = 150;
    let opt: TreeSeriesOption = {
      type: "tree",
      id: seriesId,
      data: seriesId == "blockTree" ? this.treeData : this.tagTreeData,
      z: 10,
      initialTreeDepth: -1,
      label: {
        show: true,
        color: "#F0FFFF",
        position: "top",
        textBorderColor: "#111f2c",
        textBorderWidth: 2,
      },
      roam: seriesId == "blockTree" ? true : false,
      emphasis: {
        //高亮显示所有内容
        disabled: seriesId == "blockTree" ? false : true,
        label: {
          formatter: seriesId == "blockTree" ? labelFormatter : undefined,
          backgroundColor: "#000000",
          padding: 4,
          width: 150,
          overflow: "break",
          lineHeight: 15,
        },
      },
      left:
        seriesId == "blockTree"
          ? grid.left
          : grid.left + grid.width - tagTreeSeriesWidth + 30,
      width:
        seriesId == "blockTree"
          ? grid.width - tagTreeSeriesWidth
          : tagTreeSeriesWidth - 30,
      top: grid.top,
      height: grid.height,
      zoom: 1,
    };
    //@ts-ignore
    opt.center = [opt.width / 2, opt.height / 2];
    return opt;
  }
  public async reInitData() {
    this.graphData = []; //清空数据
    this.graphLinks = [];
    this.tagTreeData = [];
    //---清空并添加初始节点---
    const startNodeId = getFocusNodeId();
    if (!startNodeId) {
      pushErrMsg(this.i18n.prefix + this.i18n.startNodeError);
      return;
    }
    const startBlock = await getBlockById(startNodeId);
    const startNodeModel = await this.buildNode(startBlock);
    this.treeData = [this.rootNode("tree")];
    this.tagTreeData = [this.rootNode("tagTree")];
    await this.addNodeToTreeDataAndRefresh(this.treeData, startNodeModel);
    //addBorderGraphData();
    await this.expandNode(startNodeModel);
  }
  private rootNode(series: "tree" | "tagTree") {
    const rootNode: nodeModelTree = {
      id: series == "tree" ? "root" : "rootTag",
      labelName: series == "tree" ? "root" : "rootTag",
      children: [],
      type: "other",
      name: series == "tree" ? "root" : "rootTag",
      path: "",
      box: "",
      tag: "",
      content: "",
      value: [0, 0],
    };
    return rootNode;
  }
  private forDevInit(graphOption: ECOption) {
    graphOption.series[0].label.formatter = labelFormater;
    graphOption.series[2].label.formatter = labelFormater;
    function labelFormater(params: { data }) {
      let labelName = params.data.labelName;
      let { idList, itemLayouts } = this.getTreeNodePositionParams();
      let { x, y } = this.getTreeNodePosition(params.data, idList, itemLayouts);
      x = Math.round(x);
      y = Math.round(y);
      //let pixel = graph.convertToPixel({ seriesIndex: 0 }, [x, y]);
      return `${labelName}:${x},${y}`;
    }
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
   * @param seriesId
   */
  private refreshGraph(seriesIds: seriesID[]) {
    let option = this.graph.getOption();
    for (let seriesId of seriesIds) {
      if (seriesId == "blockTree") {
        option.series[0].data = this.treeData;
      }
      if (seriesId == "blockGraph") {
        option.series[1].data = this.graphData;
        option.series[1].links = this.graphLinks;
      }
      if (seriesId == "tagTree") {
        option.series[2].data = this.tagTreeData;
      }
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
  public reComputePosition() {
    let [idList0, itemLayouts0] = this.getTreeNodePositionParams("blockTree");
    let [idList2, itemLayouts2] = this.getTreeNodePositionParams("tagTree");
    let option = this.graph.getOption() as ECOption;
    for (let node of this.graphData) {
      node = this.treePosition2GraphValue(
        node,
        node.type == "tag" ? idList2 : idList0,
        node.type == "tag" ? itemLayouts2 : itemLayouts0,
        node.type == "tag" ? option.series[2].left : option.series[0].left,
        node.type == "tag" ? option.series[2].top : option.series[0].top
      );
    }
    this.refreshGraph(["blockGraph"]);
  }
  /**
   * todo 集中获取treePosition2GraphValue所需参数
   * @returns
   */
  private treePosition2GraphValueParams(treeId: seriesID) {
    const [idList, itemLayouts] = this.getTreeNodePositionParams(treeId);
    const option = this.graph.getOption();
    return {
      idList: idList,
      itemLayouts: itemLayouts,
      left: option.grid[0].left,
      top: option.grid[0].top,
    };
  }
  /**
   *
   * @param left realPosition[0] += left * tree.coordinateSystem._zoom;
   * @param top  realPosition[1] += top * tree.coordinateSystem._zoom;
   */
  private treePosition2GraphValue(
    node: nodeModelGraph,
    idList: string[],
    itemLayouts: { x: number; y: number }[],
    left: number,
    top: number
  ) {
    const tree = node.type == "tag" ? this.getSeries(2) : this.getSeries(0);
    let { x, y } = this.getTreeNodePosition(node, idList, itemLayouts);
    let realPosition = tree.coordinateSystem.dataToPoint([x, y]);
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
    if ((params.seriesId as seriesID) != "blockTree") {
      return;
    }
    const menu = new Menu("plugin-networkCustom-Menu", () => {
      //console.log("菜单");
    });
    menu.addItem({
      icon: "",
      label: "展开节点",
      click: () => {
        this.expandNode(params.data as nodeModelTree);
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
    switch (params.seriesId as seriesID) {
      case "blockTree":
        this.reComputePosition();
        //*记忆节点折叠情况
        let treeNode = this.findTreeDataById(this.treeData, params.data.id);
        treeNode.collapsed = params.collapsed;
        this.refreshGraph(["blockGraph", "blockTree"]);
        break;
      case "tagTree":
        this.reComputePosition();
        //*记忆节点折叠情况
        let tagTreeNode = this.findTreeDataById(
          this.tagTreeData,
          params.data.id
        );
        tagTreeNode.collapsed = params.collapsed;
        this.refreshGraph(["blockGraph", "tagTree"]);
        break;
      case "blockGraph":
        break;
    }
  }
  private onTreeroam(params: ECElementEventParams) {
    /*//?不生效
    this.graph.dispatchAction({
      type: "treeroam",
      seriesId: "tagTree",
      zoom: params.zoom, // 单次缩放倍数
      originX: params.originX,
      originY: params.originY,
      dx: params.dx,
      dy: params.dy,
    });*/
    //*tagTree无分支则不缩放
    if (this.tagTreeData[0].children.length) {
    }
    let option = this.graph.getOption() as ECOption;
    if (params.dx || params.dy) {
      option.series[2].center[0] -= params.dx;
      option.series[2].center[1] -= params.dy;
    }
    if (params.zoom) {
      option.series[2].zoom = option.series[2].zoom * params.zoom;
    }
    this.graph.setOption(option);
    this.reComputePosition();
  }
  /**
   * 未构建children和parent
   * @param block
   * @returns
   */
  private async buildNode(block: Block) {
    let node: nodeModelTree = this.buildNodeWithoutParent(block);
    const parentBlock = await getParentBlock(block);
    node.parent_id = parentBlock ? parentBlock.id : "root";
    return node;
  }
  private buildNodeWithoutParent(block: Block) {
    let labelName = this.buildNodeLabel(block);
    const node: nodeModelTree = {
      id: block.id,
      type: block.type,
      children: [],
      name: labelName,
      labelName: labelName,
      path: block.path,
      box: block.box,
      tag: block.tag,
      content: block.content,
      value: [0, 0],
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
  private buildGraphNode(node: nodeModelTree) {
    let graphNode: nodeModelGraph = structuredClone(node);
    //graphNode.labelName = node.name;
    graphNode.name = node.id;
    graphNode.fixed = true;
    return graphNode;
  }
  private buildEdge(source: nodeModelGraph, target: nodeModelGraph) {
    let link: edgeModel = {
      id: `${source.name}-${target.name}`,
      source: source.name,
      target: target.name,
      labelName: "", //todo
    };
    return link;
  }
  private buildTagNodes(tagString: string): nodeModelTree[][] {
    if (!tagString) {
      return [];
    }
    const tags = tagString.split(" ");
    let tagsSplited: nodeModelTree[][] = [];
    for (let tag of tags) {
      tag = tag.slice(1, -1);
      let tagsGroup = tag.split("/");
      let tagObjs: nodeModelTree[] = [];
      for (let i = 0; i < tagsGroup.length; i++) {
        tagObjs[i] = {
          id: encodeURIComponent(tagsGroup[i]),
          name: tagsGroup[i],
          type: "tag",
          labelName: tagsGroup[i],
          path: "",
          box: "",
          children: [],
          parent_id: i == 0 ? "rootTag" : encodeURIComponent(tagsGroup[i - 1]),
          tag: "",
          content: tagsGroup[i],
          value: [0, 0],
        };
      }
      tagsSplited.push(tagObjs);
    }
    return tagsSplited;
  }
  /**
   * 向树添加节点时，会递归添加其父节点（如果原树中没有的话）
   * @param node
   * @returns
   */
  private async addBlockToTreeData(
    treeData: nodeModelTree[],
    node: nodeModelTree
  ) {
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
    let parent = this.findTreeDataById(treeData, node.parent_id);
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
      const parentBlock = await getParentBlock(node);
      let parentNode = await this.buildNode(parentBlock);
      parentNode.children.push(node);
      await this.addBlockToTreeData(treeData, parentNode);
    }
  }
  /**
   * 除了addNodeToTreeData本身，在其他任何地方调用addNodeToTreeData，都必须立刻刷新数据
   *@deprecated
   */
  private async addNodeToTreeDataAndRefresh(
    treeData: nodeModelTree[],
    node: nodeModelTree
  ) {
    await this.addBlockToTreeData(treeData, node);
    this.refreshGraph(["blockGraph", "blockTree", "tagTree"]);
    return;
  }
  private findTreeDataById(children: nodeModelTree[], id: string) {
    let node: nodeModelTree;
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
    otherNodes: nodeModelTree[],
    origin: nodeModelTree,
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
  private addNodeToGraphData(node: nodeModelGraph) {
    let nodeAdded = this.graphData.find((item) => {
      return item.id == node.id;
    });
    //*计算node位置
    const seriesId: seriesID = node.type == "tag" ? "tagTree" : "blockTree";
    let [idList, itemLayouts] = this.getTreeNodePositionParams(seriesId);
    const option = this.graph.getOption() as ECOption;
    node = this.treePosition2GraphValue(
      node,
      idList,
      itemLayouts,
      node.type == "tag" ? option.series[2].left : option.series[0].left,
      node.type == "tag" ? option.series[2].top : option.series[0].top
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
  private getTreeNodePositionParams(
    treeType: seriesID
  ): [BlockId[], { x: number; y: number }[]] {
    let info =
      treeType == "blockTree" ? this.getDataInfo(0) : this.getDataInfo(2);
    let idList = info._idList as BlockId[];
    let itemLayouts = info._itemLayouts as {
      x: number;
      y: number;
    }[];
    return [idList, itemLayouts];
  }

  private getTreeNodePosition(
    node: nodeModelGraph,
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
      //*如果在itemLayouts没有，则找parent的位置
      let parent = this.findTreeDataById(
        node.type == "tag" ? this.tagTreeData : this.treeData,
        node.parent_id
      );
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
  public async expandNode(node: nodeModelTree) {
    try {
      await this.expandNodeTry(node);
    } catch (e) {
      pushErrMsg("TreeAndGraph插件扩展节点出错，请查看控制台");
      this.graph.hideLoading();
    }
  }
  private async expandNodeTry(node: nodeModelTree) {
    this.graph.showLoading(); //?有概率导致右键菜单失效
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
      await this.addNodeToTreeDataAndRefresh(this.treeData, node);
    }
    this.devConsole(console.timeLog, "expandNode", "children");
    //*refBlocks
    const refBlocks = await getRefBlocks(node.id);
    let refNodes: nodeModelTree[] = [];
    for (let child of refBlocks) {
      let node = await this.buildNode(child);
      await this.addNodeToTreeDataAndRefresh(this.treeData, node);
      refNodes.push(node);
    }
    this.addNodesAndEdges(refNodes, node, "ref");
    this.devConsole(console.timeLog, "expandNode", "refBlocks");
    //*defBlocks
    const defBlocks = await getDefBlocks(node.id);
    let defNodes: nodeModelTree[] = [];
    for (let child of defBlocks) {
      let node = await this.buildNode(child);
      await this.addNodeToTreeDataAndRefresh(this.treeData, node);
      defNodes.push(node);
    }
    this.addNodesAndEdges(defNodes, node, "def");
    this.devConsole(console.timeLog, "expandNode", "defBlocks");
    //*tags
    const tagNodes = this.buildTagNodes(node.tag);
    let tagLeaves: nodeModelTree[] = [];
    for (let group of tagNodes) {
      for (let child of group) {
        await this.addNodeToTreeDataAndRefresh(this.tagTreeData, child);
      }
      tagLeaves.push(group[group.length - 1]);
    }
    this.addNodesAndEdges(tagLeaves, node, "ref");
    this.reComputePosition();
    this.devConsole(console.timeEnd, "expandNode");
    this.graph.hideLoading();
  }
}

type edgeType = "parent" | "child" | "ref" | "def";
export interface nodeModelTree extends TreeSeriesNodeItemOption {
  //v1.2.0 仅保留有用的属性
  labelName: string;
  id: BlockId;
  parent_id?: BlockId | "root" | "rootTag"; //?会改变
  name: string; //?会改变
  children: nodeModelTree[]; //?
  type: BlockType | "tag";
  path: string;
  box: string;
  tag: string;
  content: string;
  //?不可行，会无限clone parent: nodeModel;
  //以下为兼容nodeModelGraph
  value: [number, number];
  symbol?: any;
  symbolSize?: any;
  symbolRotate?: any;
  symbolOffset?: any;
  emphasis?: any;
  //parentBlock?: Block;
}
interface edgeModel extends GraphEdgeItemOption {
  id: string;
  labelName: string;
}
interface nodeModelGraph extends GraphNodeItemOption {
  labelName: string;
  id: BlockId;
  parent_id?: BlockId; //?会改变
  name: string; //?会改变
  value: [number, number];
  type: BlockType | "tag";
}
export interface ECElementEventParams extends echarts.ECElementEvent {
  data: nodeModelTree | edgeModel | nodeModelGraph;
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

type seriesID = "blockTree" | "tagTree" | "blockGraph";
