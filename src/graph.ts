import {
  getAnchorFromMarkdown,
  pushErrMsg,
  sql,
  typeAbbrMap,
  getBlockById,
  getChildrenBlocks,
  getDefBlocks,
  getParentBlock,
  getRefBlocks,
} from "../../siyuanPlugin-common/siyuan-api";
import {
  Block,
  BlockId,
  BlockType,
  Window_siyuan,
} from "../../siyuanPlugin-common/types/siyuan-api";
import { Plugin, Menu, openTab, App, Setting } from "siyuan";
//*↓↓↓↓↓eacharts↓↓↓↓↓
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import {
  TreeChart,
  TreeSeriesOption,
  GraphChart,
  GraphSeriesOption,
} from "echarts/charts";
import {
  GridComponent,
  GridComponentOption,
  ToolboxComponent,
  ToolboxComponentOption,
} from "echarts/components";
//*源文件未导出，需修改
import {
  TreeSeriesNodeItemOption,
  GraphEdgeItemOption,
  GraphNodeItemOption,
  CallbackDataParams,
} from "echarts/types/dist/shared";
echarts.use([
  TreeChart,
  GraphChart,
  CanvasRenderer,
  GridComponent,
  ToolboxComponent,
]);
type ECOption = echarts.ComposeOption<
  | TreeSeriesOption
  | GraphSeriesOption
  | GridComponentOption
  | ToolboxComponentOption
>;
//*↑↑↑↑↑eacharts↑↑↑↑↑
const STORAGE_NAME = "TreeAndGraph-config";

export class echartsGraph {
  private i18n: i18nType;
  public graph: echarts.ECharts;
  public treeData: nodeModelTree[] = [];
  public graphData: nodeModelGraph[] = [];
  public graphLinks: edgeModel[] = [];
  public tagTreeData: nodeModelTree[] = [];
  private app: App;
  private plugin: Plugin;
  private debug: boolean = true;
  public isFocusing: boolean = false;
  //private grid: { left: number; width: number; top: number; height: number };
  private config: { cardMode: boolean }; //聚焦时引用块显示其父级名称
  private setting: Setting;
  //private
  constructor(i18n: i18nType, app: App, plugin: Plugin) {
    this.i18n = i18n;
    this.app = app;
    this.plugin = plugin;
  }
  public resizeGraph(widthNum?: number, heightNum?: number) {
    if (!this.graph) {
      return;
    }
    let graphOption = this.graph.getOption() as ECOption;
    if (!graphOption) {
      return;
    }
    widthNum = widthNum || this.graph.getWidth();
    heightNum = heightNum || this.graph.getHeight();
    this.graph.resize({
      width: widthNum,
      height: heightNum,
      animation: {
        duration: 200,
      },
    });
    //let widthNum = this.graph.getWidth();
    //let heightNum = this.graph.getHeight();
    const grid = {
      left: 50,
      width: widthNum - 50 - 50, //-left-right
      top: 30,
      height: heightNum - 30 - 30, //-top-bottom
    };
    if (!graphOption.grid) {
      graphOption.grid = [];
    }
    graphOption.grid[0] = grid;
    //let graphSeries = graphOption.series[1] as GraphSeriesOption;
    let treeSeries = graphOption.series[0] as TreeSeriesOption;
    let tagSeries = graphOption.series[2] as TreeSeriesOption;
    const tagTreeSeriesWidth = 150;
    tagSeries.left = grid.left + grid.width - tagTreeSeriesWidth + 30;
    tagSeries.width = tagTreeSeriesWidth - 30;
    tagSeries.top = grid.top;
    tagSeries.height = grid.height;
    //console.log(tagSeries.left,tagSeries.width)
    treeSeries.left = grid.left;
    treeSeries.width = grid.width - tagTreeSeriesWidth;
    treeSeries.top = grid.top;
    treeSeries.height = this.isFocusing ? grid.height * 0.7 : grid.height;
    //console.log(treeSeries.left,treeSeries.width)
    //*决定graphSeries的尺寸
    graphOption.xAxis[0].max = grid.width;
    graphOption.yAxis[0].max = grid.height;
    this.graph.setOption(graphOption);

    this.isFocusing
      ? this.reComputePositionFousing()
      : this.reComputePosition();
  }
  public async initGraph(
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
      //params
      //this.reComputePosition();
      this.onTreeroam(params as ECElementEventParams);
    });
    this.graph.on("mouseover", (params) => {
      this.onMouseover(params as ECElementEventParams);
    });
    this.graph.on("mouseout", () => {
      this.onMouseout();
    });
    //graph.on("mouseover", onMouseOver);
    this.config = await this.plugin.loadData(STORAGE_NAME);
    this.initSetting();
    this.reInitGraph();
  }
  /**
   * 初始化图表
   * @param container
   * @param widthNum
   * @param heightNum
   * @returns
   */
  private reInitGraph() {
    const blockTreeSeries = this.buildTreeOpt("blockTree");
    const tagTreeSeries = this.buildTreeOpt("tagTree");
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
      edgeLabel: {
        show: true,
        formatter: (params: labelformatterParams) => {
          return params.data.labelName;
        },
        textBorderColor: "#111f2c",
        textBorderWidth: 3,
        color: "#F0FFFF",
      },
      edgeSymbol: ["none", "arrow"],
      itemStyle: { opacity: 0 },
      emphasis: {
        lineStyle: {
          color: "#FF4136",
        },
      },
    };
    let graphOption: ECOption = {
      /*grid: [
        {
          left: this.grid.left,
          width: this.grid.width,
          top: this.grid.top,
          height: this.grid.height,
        },
      ],*/
      xAxis: [
        {
          type: "value",
          min: 0,
          //max: this.grid.width,
          show: false,
        },
      ],
      yAxis: [
        {
          type: "value",
          min: 0,
          //max: this.grid.height,
          inverse: true,
          show: false,
        },
      ],
      series: [blockTreeSeries, graphSeries, tagTreeSeries],
      toolbox: {
        show: true,
        itemSize: 25,
        feature: {
          myTool1: {
            show: true,
            title: this.i18n.toolbox.myTool1,
            icon: "path://M214.864,440.317l69.471-41.742c20.83-12.516,47.862-5.776,60.377,15.053,12.516,20.83,5.776,47.862-15.053,60.377L137.653,589.374,22.285,397.369c-12.516-20.83-5.776-47.862,15.053-60.378,20.83-12.515,47.862-5.775,60.377,15.054l34.478,57.38c36.81-123.472,126.622-227,249.697-279.243,223.634-94.927,481.893,9.459,576.842,233.144,94.948,223.685-9.365,481.973-232.998,576.9-161.485,68.546-346.059,34.258-472.152-83.359-17.77-16.575-18.738-44.418-2.162-62.188,16.575-17.77,44.418-18.738,62.187-2.163,100.9,94.117,248.546,121.546,377.742,66.705C870.24,783.287,953.688,576.663,877.727,397.71c-75.96-178.953-282.562-262.459-461.452-186.524-100.372,42.605-173.066,127.8-201.411,229.131z",
            onclick: () => {
              this.isFocusing = false;
              this.reInitGraph();
              //this.reComputePosition();
            },
          },
          myTool2: {
            show: true,
            title: this.i18n.toolbox.myTool2,
            icon: "path://M512.25928,704c-108.8,0-192-83.2-192-192s83.2-192,192-192,192,83.2,192,192-83.2,192-192,192z,m0-320c-70.4,0-128,57.6-128,128s57.6,128,128,128,128-57.6,128-128-57.6-128-128-128z M640.25928,1024H384.25928c-19.2,0-32-12.8-32-32v-121.6c-25.6-12.8-51.2-25.6-70.4-38.4l-102.4,64c-12.8,6.4-32,6.4-44.8-12.8l-128-224C-6.14072,640,0.25928,620.8,19.45928,614.4l102.4-64v-76.8l-102.4-64C0.25928,403.2-6.14072,384,6.65928,364.8l128-224c6.4-12.8,25.6-19.2,44.8-6.4l102.4,64c19.2-12.8,44.8-32,70.4-38.4V32c0-19.2,12.8-32,32-32h256c19.2,0,32,12.8,32,32v121.6c25.6,12.8,51.2,25.6,70.4,38.4l102.4-64c12.8-6.4,32-6.4,44.8,12.8l128,224c12.8,19.2,6.4,38.4-12.8,44.8l-102.4,64v76.8l102.4,64c12.8,6.4,19.2,25.6,12.8,44.8l-128,224c-6.4,12.8-25.6,19.2-44.8,12.8l-102.4-64c-19.2,12.8-44.8,32-70.4,38.4V992c0,19.2-12.8,32-32,32z,m-224-64h192v-108.8c0-12.8,6.4-25.6,19.2-32,32-12.8,64-32,89.6-51.2,12.8-6.4,25.6-6.4,38.4,0l96,57.6,96-166.4-96-57.6c-12.8-12.8-19.2-25.6-12.8-38.4,0-19.2,6.4-32,6.4-51.2s0-32-6.4-51.2c0-12.8,6.4-25.6,12.8-32l96-57.6-96-166.4-96,57.6c-12.8,6.4-25.6,6.4-38.4,0-25.6-19.2-57.6-38.4-89.6-51.2-12.8-12.8-19.2-25.6-19.2-38.4V64H416.25928v108.8c0,12.8-6.4,25.6-19.2,32-32,12.8-64,32-89.6,51.2-12.8,6.4-25.6,6.4-38.4,0l-96-51.2-96,166.4,96,57.6c12.8,6.4,19.2,19.2,12.8,32,0,19.2-6.4,32-6.4,51.2,0,19.2,0,32,6.4,51.2,6.4,12.8,0,25.6-12.8,32l-96,57.6,96,166.4,96-57.6c12.8-6.4,25.6-6.4,38.4,0,25.6,19.2,57.6,38.4,89.6,51.2,12.8,6.4,19.2,19.2,19.2,32V960z",
            onclick: () => {
              this.setting.open(this.i18n.pluginName);
            },
          },
        },
      },
    };
    graphOption = this.debug ? this.forDevInit(graphOption) : graphOption; //调试用
    this.graph.setOption(graphOption);
    this.resizeGraph();
  }
  private buildTreeOpt(seriesId: seriesID): TreeSeriesOption {
    const emphasisLabelFormatter = (params: labelformatterParams) => {
      const data = params.data as nodeModelTree;
      return data.content;
    };
    const labelWidth = 100;
    const labelFormatter = (params: labelformatterParams) => {
      const data = params.data as nodeModelTree;
      //分支节点显示标签
      if (data.children.length > 1) {
        return data.labelName;
      }
      //有链接节点显示标签
      if (
        this.graphData.find((e) => {
          return e.id == data.id;
        })
      ) {
        return data.labelName;
      }
      //zoom 大于1时显示标签
      const option = this.graph.getOption() as ECOption;
      if (option.series[0].zoom > 1) {
        return data.labelName;
      }
      return "";
    };
    const showLabelName = (params: labelformatterParams) => {
      return params.data.labelName;
    };
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
        width: labelWidth,
        overflow: "truncate",
        //formatter: seriesId == "blockTree" ? labelFormatter : undefined,
        formatter: seriesId == "blockTree" ? showLabelName : undefined,
      },
      /*
      labelLayout: {
        hideOverlap: true,
        x: 0,
        y: 0,
        dx: -50,
        dy: -10,
      },*/
      leaves: {
        label: {
          //formatter: showLabelName,
        },
      },
      emphasis: {
        //高亮显示所有内容
        disabled: seriesId == "blockTree" ? false : true,
        label: {
          position: "top",
          formatter:
            seriesId == "blockTree" ? emphasisLabelFormatter : undefined,
          backgroundColor: "#000000",
          padding: 4,
          width: 150,
          overflow: "break",
          lineHeight: 15,
        },
      },
      zoom: 1,
      roam: seriesId == "blockTree" ? true : true,
    };
    //opt.center = [opt.width / 2, opt.height / 2];
    return opt;
  }
  public async reInitData(startNodeId: string) {
    this.graphData = []; //清空数据
    this.graphLinks = [];
    this.tagTreeData = [];
    //---清空并添加初始节点---
    if (!startNodeId) {
      pushErrMsg(this.i18n.prefix + this.i18n.startNodeError);
      return;
    }
    const startBlock = await getBlockById(startNodeId);
    const startNodeModel = this.buildNode(startBlock);
    this.treeData = [this.rootNode("tree")];
    await this.addNodeToTreeDataAndRefresh(this.treeData, startNodeModel);
    this.tagTreeData = [this.rootNode("tagTree")];
    //*必须有2个以上tag roam才会生效
    let firstTag = this.buildTagNodes("#示例tag/1#");
    for (let group of firstTag) {
      for (let child of group) {
        await this.addNodeToTreeDataAndRefresh(this.tagTreeData, child);
      }
    }
    firstTag = this.buildTagNodes("#示例tag/2#");
    console.log(firstTag);
    for (let group of firstTag) {
      for (let child of group) {
        await this.addNodeToTreeDataAndRefresh(this.tagTreeData, child);
      }
    }
    //addBorderGraphData();
    this.graph.showLoading();
    await this.expandNode(startNodeModel);
    this.graph.hideLoading();
    //console.log(this.getSeries(0).coordinateSystem.getCenter())
    //console.log(this.getSeries(2).coordinateSystem.getCenter())
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
      depth: 0,
    };
    return rootNode;
  }
  private forDevInit(graphOption: ECOption) {
    const labelFormater = (params: { data: nodeModelTree }) => {
      let labelName = params.data.labelName;
      let [idList, itemLayouts] = this.getTreeNodePositionParams(
        params.data.type == "tag" ? "tagTree" : "blockTree"
      );
      let { x, y } = this.getTreeNodePosition(
        params.data.type == "tag" ? this.tagTreeData : this.treeData,
        params.data,
        idList,
        itemLayouts
      );
      x = Math.round(x);
      y = Math.round(y);
      //let pixel = graph.convertToPixel({ seriesIndex: 0 }, [x, y]);
      return `[${x},${y}]${labelName}`;
    };
    graphOption.series[0].label.formatter = labelFormater;
    graphOption.series[2].label.formatter = labelFormater;
    graphOption.series[1].label.formatter = (params: { data }) => {
      let x = Math.round(params.data.value[0]);
      let y = Math.round(params.data.value[1]);
      let labelName = params.data.labelName;
      //let pixel = graph.convertToPixel({ seriesIndex: 1 }, [x, y]);
      return `[${x},${y}]${labelName}`;
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
        console.log("TagTreeModel", model.getSeriesByIndex(2));
        console.log("graphModel", model.getSeriesByIndex(1));
        console.log("TreeInfo", this.getDataInfo(0));
        console.log("graphInfo", this.getDataInfo(1));
        console.log("TagTreeInfo", this.getDataInfo(2));
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
  private async initSetting() {
    const inputEle = document.createElement("input");
    this.setting = new Setting({
      confirmCallback: () => {
        if (inputEle.checked && !this.config.cardMode) {
          this.graphData.forEach((node) => {
            node.labelName = this.getAncestorLabel(node);
          });
          this.treeData.forEach((node) => {
            if (!this.isCardNode(node.type)) {
              node.collapsed = true;
            }
          });
          this.refreshGraph(["blockTree", "blockGraph"]);
        }
        this.config = { cardMode: inputEle.checked };
        this.plugin.saveData(STORAGE_NAME, this.config);
      },
    });
    this.setting.addItem({
      title: this.i18n.setting.showParentName,
      createActionElement: () => {
        inputEle.setAttribute("type", "checkbox");
        inputEle.classList.add("b3-switch");
        return inputEle;
      },
    });
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
  private reComputePosition() {
    const treeSeries = this.getSeries(0);
    const tagTreeSeries = this.getSeries(2);
    const opt = this.graph.getOption() as ECOption;
    const treeData = opt.series[0].data;
    const tagTreeData = opt.series[2].data;
    for (let node of this.graphData) {
      node = this.treePosition2GraphValue(
        node.type == "tag" ? tagTreeSeries : treeSeries,
        node.type == "tag" ? tagTreeData : treeData,
        node
      );
    }
    this.refreshGraph(["blockGraph"]);
  }
  /**
   *
   * @param left realPosition[0] += left * tree.coordinateSystem._zoom;
   * @param top  realPosition[1] += top * tree.coordinateSystem._zoom;
   */
  private treePosition2GraphValue(
    treeSeries,
    treeData: nodeModelTree[],
    node: nodeModelGraph
  ) {
    const info = treeSeries.getData();
    const option = this.graph.getOption() as ECOption;
    let { x, y } = this.getTreeNodePosition(
      treeData,
      node,
      info._idList as BlockId[],
      info._itemLayouts
    );
    if (!x || !y) {
      node.value = [NaN, NaN];
      return node;
    }
    let realPosition = treeSeries.coordinateSystem.dataToPoint([x, y]);
    const left =
      node.type == "tag" ? option.series[2].left : option.series[0].left;
    const top =
      node.type == "tag" ? option.series[2].top : option.series[0].top;
    realPosition[0] += left * treeSeries.coordinateSystem._zoom;
    realPosition[1] += top * treeSeries.coordinateSystem._zoom;
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
    const event = params.event.event as MouseEvent;
    const expand = () => {
      menu.addItem({
        icon: "",
        label: this.i18n.menu.extendNode,
        click: async () => {
          menu.close();
          this.graph.showLoading();
          await this.expandNode(params.data as nodeModelTree);
          this.graph.hideLoading();
        },
      });
    };
    const focus = () => {
      menu.addItem({
        icon: "",
        label: this.i18n.menu.focusNode,
        click: async () => {
          menu.close();
          this.graph.showLoading();
          await this.focusNode(params.data as nodeModelTree);
          this.graph.hideLoading();
        },
      });
    };
    const editInTab = () => {
      menu.addItem({
        icon: "iconLayoutBottom",
        label: this.i18n.menu.locateNode,
        click: async () => {
          menu.close();
          openTab({
            app: this.app,
            doc: {
              id: params.data.id,
              action: ["cb-get-focus"],
            },
          });
        },
      });
    };
    const editInFloat = () => {
      //*鼠标指针一定要在新panel里，不然会立刻关闭窗口
      let panelX = event.clientX - 600; //768
      let panelY = event.clientY - 150; //min:288
      if (panelY + 288 > window.innerHeight) {
        panelY = window.innerHeight - 310;
      }
      menu.addItem({
        icon: "iconLayout",
        label: this.i18n.menu.floatingPannel,
        click: async () => {
          menu.close();
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
    };
    switch (params.seriesId as seriesID) {
      case "blockTree":
      case "blockGraph":
        if (params.dataType === "edge") {
          return;
        }
        if (!this.isFocusing) {
          expand();
        }
        focus();
        editInTab();
        editInFloat();
        break;
    }
    menu.open({
      x: event.clientX + 5,
      y: event.clientY + 5,
    });
    return;
  }
  private onNodeClick(params: ECElementEventParams) {
    if (this.isFocusing) {
      return;
    }
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
    //console.log(params);
    const tagSeries = this.getSeries(2);
    const zoom = this.getSeries(0).coordinateSystem.getZoom();
    tagSeries.setZoom(zoom);

    const option = this.graph.getOption() as ECOption;
    const center = this.getSeries(0).coordinateSystem.getCenter();
    const treeSeries = option.series[0] as TreeSeriesOption;
    const centerOriginal = [
      (treeSeries.width as number) / 2,
      (treeSeries.height as number) / 2,
    ];
    const dCenter = [
      center[0] - centerOriginal[0],
      center[1] - centerOriginal[1],
    ];
    const tagSeriesOpt = option.series[2] as TreeSeriesOption;
    const centerTagOriginal = [
      (tagSeriesOpt.width as number) / 2,
      (tagSeriesOpt.height as number) / 2,
    ];
    let pixelCenter = [
      centerTagOriginal[0] + dCenter[0],
      centerTagOriginal[1] + dCenter[1],
    ];

    tagSeries.setCenter(pixelCenter);
    this.isFocusing
      ? this.reComputePositionFousing()
      : this.reComputePosition();
  }
  private onMouseover(params: ECElementEventParams) {
    const nodeId = params.data.id;
    //*link的样式只是一种临时状态，不需要在this.graphLinks中储存
    let option = this.graph.getOption() as ECOption;
    let graphSeries = option.series[1] as GraphSeriesOption;
    let graphLinks = graphSeries.links;
    for (let link of graphLinks) {
      if (link.source != nodeId && link.target != nodeId) {
        continue;
      }
      link.lineStyle = {
        color: "#FF4136",
      };
    }
    this.graph.setOption(option);
  }
  private onMouseout() {
    let option = this.graph.getOption() as ECOption;
    let graphSeries = option.series[1] as GraphSeriesOption;
    graphSeries.links = this.graphLinks;
    this.graph.setOption(option);
  }
  /**
   * 未构建children和parent
   * @param block
   * @returns
   */
  private buildNode(block: Block) {
    let node: nodeModelTree = this.buildNodeWithoutParent(block);
    if (block.parent_id) {
      node.parent_id = block.parent_id;
    } else {
      let pathList = block.path.split("/");
      if (pathList.length > 2) {
        node.parent_id = pathList[pathList.length - 2];
      }
    }
    if (!node.parent_id) {
      node.parent_id = block.box;
    }
    //const parentBlock = await getParentBlock(block);
    //node.parent_id = parentBlock ? parentBlock.id : "root";
    return node;
  }
  /**
   * 显示标签的node
   */
  private isCardNode(type: BlockType | "tag") {
    switch (type) {
      case "d":
      case "h":
      case "s":
      case "box":
      case "tag":
        return true;
      default:
        return false;
    }
  }
  private buildNodeWithoutParent(block: Block) {
    let labelName = this.buildNodeLabel(block);
    let collapsed = false;
    //todo 应为其父级
    if (this.config.cardMode) {
      if (this.isCardNode(block.type)) {
        collapsed = false;
      } else {
        collapsed = true;
      }
    }
    const node: nodeModelTree = {
      id: block.id,
      type: block.type,
      children: [],
      name: block.id, //todo 其实id和name应只保留一个
      labelName: labelName,
      path: block.path,
      box: block.box,
      tag: block.tag,
      content: block.content,
      value: [0, 0],
      collapsed: collapsed,
    };
    return node;
  }
  private buildNodeLabel(block: Block): string {
    if (block.name) {
      return block.name;
    }
    //const labelLength = 8; //todo 可以改为自定义
    switch (block.type) {
      case "d":
      case "h":
      case "p":
        /*保留，截断content
        let label = "";
        if (block.content.length > labelLength) {
          label = block.content.substring(0, labelLength) + "...";
        } else {
          label = block.content;
        }*/
        return block.content; //label;
      default:
        return typeAbbrMap[block.type];
    }
  }
  private buildGraphNode(node: nodeModelTree) {
    let graphNode: nodeModelGraph = structuredClone(node);
    if (graphNode.label?.position) {
      graphNode.label.position = "top";
    }
    //graphNode.labelName = node.name;
    if (this.config.cardMode) {
      graphNode.labelName = this.getAncestorLabel(node);
    }
    graphNode.name = node.id;
    graphNode.fixed = true;
    return graphNode;
  }

  private getAncestorLabel(node: nodeModelTree | nodeModelGraph): string {
    if (this.isCardNode(node.type)) {
      return node.labelName;
    } else {
      const parent = this.findTreeDataById(this.treeData, node.parent_id);
      return this.getAncestorLabel(parent);
    }
  }
  private async buildEdge(source: nodeModelGraph, target: nodeModelGraph) {
    const memoBlocks = await sql(
      `SELECT * FROM "spans" WHERE type='textmark block-ref inline-memo' 
      AND block_id='${source.id}'`
    );
    let labelName = "";
    if (memoBlocks && memoBlocks.length > 0) {
      const memoBlock = memoBlocks[0] as Block;
      const anchorArray = getAnchorFromMarkdown(memoBlock.markdown);
      if (anchorArray.length > 0) {
        const anchor = anchorArray[0];
        labelName = memoBlock.content.replace(anchor, "");
      }
    }
    let link: edgeModel = {
      id: `${source.name}-${target.name}`,
      source: source.name,
      target: target.name,
      labelName: labelName,
    };
    return link;
  }
  /**
   *
   * @param tagString 应为#tag#形式
   * @returns
   */
  private buildTagNodes(tagString: string): nodeModelTree[][] {
    if (!tagString) {
      return [];
    }
    const tags = tagString.split(" ");
    let tagsSplited: nodeModelTree[][] = [];
    for (let tag of tags) {
      tag = tag.slice(1, -1); //*去除#号
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
   * 其实并非克隆，因为原值改变了，cloneTo中存在而node中不存在的值将不会被清空
   * @returns
   */
  private cloneNodeExceptChildren(
    node: nodeModelTree,
    nodeCloneTo: nodeModelTree
  ) {
    for (let key of Object.keys(node)) {
      if (key == "children") {
        continue;
      }
      nodeCloneTo[key] = node[key];
    }
    return;
  }
  /**
   * 向树添加节点时，会递归添加其父节点（如果原树中没有的话）
   * @param node
   * @returns
   */
  private async addNodeToTreeData(
    treeData: nodeModelTree[],
    node: nodeModelTree
  ) {
    const computeDepth = (node: nodeModelTree) => {
      //*计算depth,更改label-position
      node.label = { position: node.depth % 2 ? "top" : "bottom" };
      let depthNode = node.children[0] ?? null;
      let depthParent = node;
      let depthCount = 0;
      while (depthNode && depthCount < 100) {
        depthNode.depth = depthParent.depth + 1;
        depthNode.label = { position: depthNode.depth % 2 ? "top" : "bottom" };
        depthParent = depthNode;
        depthNode = depthParent.children[0] ?? null;
        depthCount++;
      }
    };
    //*node为box
    if (node.type == "box") {
      //&& node.id
      let added = treeData[0].children.find((child) => {
        return child.id == node.id;
      });
      node.depth = 1;
      if (!added) {
        treeData[0].children.push(node);
        computeDepth(node);
        return;
      } else {
        //*更新节点
        this.cloneNodeExceptChildren(node, added);
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
      node.depth = parent.depth + 1;
      if (!added) {
        parent.children.push(node);
        computeDepth(node);
      } else {
        //*更新节点
        this.cloneNodeExceptChildren(node, added);
      }
      return;
    } else {
      //*添加parent
      const parentBlock = await getParentBlock(node);
      let parentNode = this.buildNode(parentBlock);
      parentNode.children.push(node);
      await this.addNodeToTreeData(treeData, parentNode);
    }
  }
  /**
   * 除了addNodeToTreeData本身，在其他任何地方调用addNodeToTreeData，都必须立刻刷新数据
   */
  private async addNodeToTreeDataAndRefresh(
    treeData: nodeModelTree[],
    node: nodeModelTree
  ) {
    //let breadcrumb = getBlockBreadcrumb(node.id);
    await this.addNodeToTreeData(treeData, node);
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
  private async addNodesAndEdges(
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
        edge = await this.buildEdge(originNode, other);
      } else {
        edge = await this.buildEdge(other, originNode);
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
    const treeSeries =
      node.type == "tag" ? this.getSeries(2) : this.getSeries(0);
    const treeData = node.type == "tag" ? this.tagTreeData : this.treeData;
    node = this.treePosition2GraphValue(treeSeries, treeData, node);
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
    treeData: nodeModelTree[],
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
      let parent = this.findTreeDataById(treeData, node.parent_id);
      if (!parent) {
        this.devConsole(
          console.warn,
          `未找到${node.labelName}(id:${node.id})的父节点`
        );
        return {
          x: NaN,
          y: NaN,
        };
      }
      return this.getTreeNodePosition(
        treeData,
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

  private async focusNode(node: nodeModelTree) {
    if (node.type == "tag") {
      return;
    }
    //*初始化
    this.graph.clear();
    this.reInitGraph();
    //*设置状态
    this.isFocusing = true;
    //*确定起始节点
    let parent: nodeModelTree;
    if (!node.parent_id) {
      parent = node;
    } else {
      parent = this.findTreeDataById(this.treeData, node.parent_id);
    }
    //*展开节点
    await this.expandNode(parent);
    parent.collapsed = false;
    this.graph.showLoading();
    for (let brother of parent.children) {
      await this.expandNode(brother);
      if (brother.id === node.id) {
        brother.collapsed = false;
        for (let child of brother.children) {
          await this.expandNode(child);
          child.collapsed = true;
        }
      }
    }
    //*clone
    parent = structuredClone(parent);
    //*设置高亮、去除child等处理
    const dealSelf = (node: nodeModelTree) => {
      //*设置高亮
      if (!node.itemStyle) {
        node.itemStyle = {};
      }
      node.itemStyle.color = "#FF4136";
      //treeNodeArray.push(node);
    };
    const dealOther = (node: nodeModelTree) => {
      //treeNodeArray.push(node);
      node.children = [];
    };
    if (parent.id == node.id) {
      dealSelf(parent);
    } else {
      //treeNodeArray.push(node);
    }
    for (let brother of parent.children) {
      //treeNodeArray.push(brother);
      if (brother.id != node.id) {
        dealOther(brother);
      } else {
        dealSelf(brother);
      }
      for (let child of brother.children) {
        dealOther(child);
      }
    }
    //*更新树数据、更新树配置
    let option = this.graph.getOption() as ECOption;
    let treeSeries = option.series[0] as TreeSeriesOption;
    treeSeries.data = [parent];
    //treeSeries.roam = false;
    const showLabelName = (params: labelformatterParams) => {
      //*该配置有两个作用：一是让树图显示所有标签，二是让关系图除在树图中的外，显示所有标签
      let data = params.data as nodeModelGraph;
      if (data.isHideLabel) {
        return "";
      }
      return params.data.labelName;
    };
    treeSeries.label.formatter = showLabelName;
    //const graphHeightRatio = 0.7;
    //treeSeries.height = (treeSeries.height as number) * graphHeightRatio;
    this.graph.setOption(option);
    option = this.graph.getOption();

    //*设置关系图，统一树和图配置
    //this.reComputePositionFousing();
    let graphSeries = option.series[1] as GraphSeriesOption;
    graphSeries.itemStyle.opacity = 1;
    graphSeries.lineStyle.curveness = 0.2;
    graphSeries.label = treeSeries.label;
    graphSeries.emphasis.label = treeSeries.emphasis.label;
    this.graph.setOption(option);

    this.resizeGraph();
  }
  private reComputePositionFousing() {
    let option = this.graph.getOption() as ECOption;
    let graphSeries = option.series[1] as GraphSeriesOption;
    let treeSeriesOpt = option.series[0] as TreeSeriesOption;
    let treeNodeArray: nodeModelTree[] = [];
    const parent = treeSeriesOpt.data[0] as nodeModelTree;
    if (!parent) {
      return;
    }
    treeNodeArray.push(parent);
    for (let brother of parent.children) {
      treeNodeArray.push(brother);
      for (let child of brother.children) {
        treeNodeArray.push(child);
      }
    }
    this.reComputePosition();
    //const graphDataClone=structuredClone(this.graphData)
    //*在树中的节点
    let newGraphData1 = this.graphData.filter((item) => {
      return item.value[0] && item.value[1];
    });
    newGraphData1.forEach((item) => {
      item.isHideLabel = true;
    });
    //*不在树中的节点
    let newGraphData2: nodeModelGraph[] = this.graphData.filter((item) => {
      if (item.value[0] && item.value[1]) {
        return false;
      }
      //*找链接的节点id
      let linkNodeIds = [];
      for (let link of this.graphLinks) {
        if (link.source == item.id) {
          linkNodeIds.push(link.target);
        } else if (link.target == item.id) {
          linkNodeIds.push(link.source);
        }
      }
      //*链接的节点在不在树中
      for (let nodeId of linkNodeIds) {
        for (let node of treeNodeArray) {
          if (nodeId == node.id) {
            return true;
          }
        }
      }
      return false;
    });
    const labelWidth = 100;
    let row = 0;
    let col = 0;
    for (let i = 0; i < newGraphData2.length; i++) {
      newGraphData2[i].value[0] = labelWidth * col;
      newGraphData2[i].value[1] =
        30 * (row + 1) + (treeSeriesOpt.height as number);
      if ((col + 1) * labelWidth < (treeSeriesOpt.width as number)) {
        col++;
      } else {
        col = 0;
        row++;
      }
    }
    //缩放与平移修正
    //todo 取自treePosition2GraphValue
    const zoom = this.getSeries(0).coordinateSystem.getZoom();
    //const dCenter = this.getCenterOffst();
    const treeSeries = this.getSeries(0);
    const left = treeSeriesOpt.left;
    const top = treeSeriesOpt.top;
    for (let node of newGraphData2) {
      let realPosition = treeSeries.coordinateSystem.dataToPoint([
        node.value[0],
        node.value[1],
      ]);
      realPosition[0] += (left as number) * zoom;
      realPosition[1] += (top as number) * zoom;
      node.value = this.graph.convertFromPixel(
        { gridIndex: 0 },
        realPosition
      ) as unknown as [number, number];
    }
    graphSeries.data = newGraphData2.concat(newGraphData1);
    graphSeries.links = this.graphLinks;
    this.graph.setOption(option);
  }
  public async expandNode(node: nodeModelTree) {
    try {
      await this.expandNodeTry(node);
      node.collapsed = true;
    } catch (e) {
      console.error(e);
      pushErrMsg("TreeAndGraph插件扩展节点出错，请查看控制台");
      this.graph.hideLoading();
    }
  }
  private async expandNodeTry(node: nodeModelTree) {
    this.devConsole(console.time, "expandNode");
    let originBlock = await getBlockById(node.id);
    this.devConsole(console.timeLog, "expandNode", "originBlock");
    if (!originBlock) {
      return;
    }
    //*更新自身
    /*const nodeNew = this.buildNode(originBlock);
    await this.addNodeToTreeDataAndRefresh(
      node.type == "tag" ? this.tagTreeData : this.treeData,
      nodeNew
    );*/
    //*获取blocks
    const [childrenBlocks, refBlocks, defBlocks] = await Promise.all([
      getChildrenBlocks(node.id),
      getRefBlocks(node.id),
      getDefBlocks(node.id),
    ]);
    const tagNodes = this.buildTagNodes(node.tag);
    //*建立队列并异步执行
    let treeQueue = [];
    let graphQueue = [];
    let tagLeaves: nodeModelTree[] = [];
    for (let group of tagNodes) {
      for (let child of group) {
        treeQueue.push(
          this.addNodeToTreeDataAndRefresh(this.tagTreeData, child)
        );
      }
      tagLeaves.push(group[group.length - 1]);
    }

    for (let child of childrenBlocks) {
      let childNode = this.buildNodeWithoutParent(child);
      childNode.parent_id = node.id;
      treeQueue.push(
        this.addNodeToTreeDataAndRefresh(this.treeData, childNode)
      );
    }

    let refNodes: nodeModelTree[] = [];
    for (let child of refBlocks) {
      let childNode = this.buildNode(child);
      treeQueue.push(
        this.addNodeToTreeDataAndRefresh(this.treeData, childNode)
      );
      refNodes.push(childNode);
    }

    let defNodes: nodeModelTree[] = [];
    for (let child of defBlocks) {
      let childNode = this.buildNode(child);
      treeQueue.push(
        this.addNodeToTreeDataAndRefresh(this.treeData, childNode)
      );
      defNodes.push(childNode);
    }
    await Promise.all(treeQueue);
    graphQueue.push(this.addNodesAndEdges(tagLeaves, node, "ref"));
    graphQueue.push(this.addNodesAndEdges(defNodes, node, "def"));
    graphQueue.push(this.addNodesAndEdges(refNodes, node, "ref"));
    await Promise.all(graphQueue);

    //console.log(childrenBlocks, refBlocks, defBlocks);
    /*//*children
    await this.expandChildren(node.id);
    this.devConsole(console.timeLog, "expandNode", "children");
    //*refBlocks
    await this.expandRefOrDef(node, "ref");
    this.devConsole(console.timeLog, "expandNode", "refBlocks");
    //*defBlocks
    await this.expandRefOrDef(node, "def");
    this.devConsole(console.timeLog, "expandNode", "defBlocks");
    //*tags
    await this.expandTag(node);
    this.devConsole(console.timeLog, "expandNode", "tags");*/
    this.reComputePosition();
    this.devConsole(console.timeEnd, "expandNode");
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
  depth?: number;
  //?不可行，会无限clone parent: nodeModel;
  //*以下为兼容nodeModelGraph
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
  isHideLabel?: boolean;
}
export interface ECElementEventParams extends echarts.ECElementEvent {
  data: nodeModelTree | edgeModel | nodeModelGraph;
}
interface labelformatterParams extends CallbackDataParams {
  data: nodeModelTree | edgeModel | nodeModelGraph;
}
export type i18nType = {
  addTopBarIcon: string;
  cancel: string;
  save: string;
  byeMenu: string;
  helloPlugin: string;
  byePlugin: string;
  showDialog: string;
  removedData: string;
  confirmRemove: string;
  name: string;
  hello: {
    makesure: string;
  };
  startNodeError: string;
  prefix: string;
  pluginName: string;
  setting: {
    showParentName: string;
  };
  menu: {
    extendNode: string;
    focusNode: string;
    locateNode: string;
    floatingPannel: string;
  };
  toolbox: {
    myTool1: string;
    myTool2: string;
  };
};
declare global {
  interface Window {
    siyuan: Window_siyuan;
  }
}

type seriesID = "blockTree" | "tagTree" | "blockGraph";
