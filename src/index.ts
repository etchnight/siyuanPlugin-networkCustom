import { Plugin, getFrontend, getBackend, Menu } from "siyuan";
import "./index.scss";
import * as sy from "../../siyuanPlugin-common/siyuan-api";
//---eacharts---
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import {
  TreeChart,
  TreeSeriesOption,
  GraphChart,
  GraphSeriesOption,
} from "echarts/charts";
//*源文件未导出，需修改
import { TreeSeriesNodeItemOption } from "echarts/types/dist/shared";
echarts.use([TreeChart, GraphChart, CanvasRenderer]);
//------
const STORAGE_NAME = "menu-config";
const DOCK_TYPE = "dock_tab";
export default class networkCustom extends Plugin {
  //private isMobile: boolean;
  private graph: echarts.ECharts;
  private lastTabWidth: number;
  private treeData: nodeModel[];
  private graphData: GraphSeriesOption["data"];
  private tagTreeData: TreeSeriesOption["data"];
  private graphOption: ECOption;
  onload() {
    let graph = this.graph;
    let lastTabWidth = this.lastTabWidth;
    let graphData = this.graphData;
    this.lastTabWidth = 0;
    let treeData = this.treeData;
    treeData = [];
    let tagTreeData = this.tagTreeData;
    let graphOption = this.graphOption;
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
      if (!graph) {
        return;
      }
      const startNodeId = sy.getFocusNodeId();
      if (!startNodeId) {
        sy.pushErrMsg(this.i18n.prefix + this.i18n.startNodeError);
        return;
      }
      const startBlock = await sy.getBlockById(startNodeId);
      const startNodeModel = await buildNode(startBlock);
      await addNodeToTreeData(startNodeModel);
      graphOption = {
        series: [
          {
            type: "tree",
            id: "blockTree",
            data: treeData,
            label: {
              show: true,
              color: "#F0FFFF",
              textShadowColor: "#000000",
            },
          },
        ],
      };
      graph.setOption(graphOption);
      graph.on("contextmenu", (params) => {
        graphContextMenu(params);
      });
      //https://github.com/apache/echarts/issues/5614
      let model = graph.getModel();
      let series = model.getSeriesByIndex(0);
      let info = series.getData();
      console.log("info", info);
    }
    function graphContextMenu(params: echarts.ECElementEvent) {
      const menu = new Menu("graphMenu", () => {
        console.log("menu");
      });
      menu.addItem({
        icon: "",
        label: "展开节点",
        click: () => {
          console.log(params);
        },
      });
      menu.open({
        x: params.event.event.clientX + 5,
        y: params.event.event.clientY + 5,
      });
    }
    async function buildNode(block: Block) {
      let node: nodeModel = { ...block, children: [] };
      node.name = buildNodeLabel(block);
      const parentBlock = await sy.getParentBlock(block);
      if (parentBlock) {
        node.parent_id = parentBlock.id;
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
    /**
     * @param otherType other的类型，如ref为origin引用的块
     */
    function buildEdge(
      origin: nodeModel,
      other: nodeModel,
      otherType: edgeType,
      label?: string
    ) {
      let link: edgeModel = {
        refType: "ref",
      };
      switch (otherType) {
        case "parent":
        case "child":
          link.refType = "child";
          break;
        default:
          link.refType = "ref";
      }
      switch (otherType) {
        case "def":
        case "parent":
          link.source = other.id;
          link.target = origin.id;
          break;
        case "child":
        case "ref":
          link.source = origin.id;
          link.target = other.id;
          break;
      }
      if (label) {
        link.label = label;
      }
      link.id = `${link.source}-${link.target}-${link.refType}`; //*在此显式的声明id是为了明确什么样的link算重复
      return link;
    }
    async function addNodeToTreeData(node: nodeModel) {
      //*node为box
      if (!node.type && node.id) {
        let added = treeData.find((child) => {
          return child.id == node.id;
        });
        if (!added) {
          treeData.push(node);
          return;
        }
        return;
      }
      //*查找parent
      let parent = findTreeDataById(treeData, node.parent_id);
      if (parent) {
        //*添加node
        let added = parent.children.find((child) => {
          return child.id == node.id;
        });
        if (!added) {
          parent.children.push(node);
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
    function findTreeDataById(children: nodeModel[], id: string) {
      for (let child of children) {
        if (child.id == id) {
          return child;
        }
        return findTreeDataById(child.children, id);
      }
    }
    async function addNodesAndEdges(
      otherBlocks: Block[],
      origin: nodeModel,
      othersType: edgeType
    ) {
      console.group("addNodesAndEdges:", origin.label, othersType);
      if (otherBlocks.length == 0) {
        console.groupEnd();
        return;
      }
      for (let otherBlock of otherBlocks) {
        let other = buildNode(otherBlock);
        let nodeAdded = graphData.nodes.find((value) => {
          return value.id == other.id;
        });
        //?保留，动态方法
        //let nodeAdded = graph.findById(other.id);
        if (!nodeAdded) {
          await addCombo(otherBlock);
          graphData.nodes.push(other);
          //?保留，动态方法
          //graph.addItem("node", other);
          //graph.layout();
          //graph.updateComboTree(other.id, other.comboId);
        }
        let edge = buildEdge(origin, other, othersType);
        if (!edge.target && !edge.source) {
          console.log(edge);
          continue;
        }
        let edgeAdded = graphData.edges.find((value) => {
          return value.id == edge.id;
        });
        //?保留，动态方法
        //let edgeAdded = graph.findById(edge.id);
        if (!edgeAdded) {
          //*更新节点level
          switch (edge.refType) {
            case "child":
              graphData.nodes.find((value) => {
                return value.id == other.id;
              }).level = origin.level - 1;
              //?保留，动态方法
              //graph.updateItem(other.id, {level: origin.level - 1,});
              break;
            case "parent":
              graphData.nodes.find((value) => {
                return value.id == other.id;
              }).level = origin.level + 1;
              //?保留，动态方法
              //graph.updateItem(other.id, {level: origin.level + 1,});
              break;
          }
          graphData.edges.push(edge);
          //?保留，动态方法
          //graph.addItem("edge", edge);
          //graph.updateCombo(other.comboId);
          //graph.layout();
        }
      }
      console.log(graphData);
      await waitGraphAnimate();
      graph.changeData(graphData);
      console.log(graph.getNodes());
      console.log(graph.getCombos());
      console.log(graph.getEdges());
      console.groupEnd();
    }

    async function expandNode(node: nodeModel) {
      let originBlock = await sy.getBlockById(node.id);
      if (!originBlock) {
        return;
      }
      let ParentBlock = await sy.getParentBlock(originBlock);
      if (ParentBlock) {
        await addNodesAndEdges([ParentBlock], node, "parent");
      }
      const ChildrenBlocks = await sy.getChildrenBlocks(node.id);
      await addNodesAndEdges(ChildrenBlocks, node, "child");
      const DefBlocks = await sy.getDefBlocks(node.id);
      await addNodesAndEdges(DefBlocks, node, "def");
      const RefBlocks = await sy.getRefBlocks(node.id);
      await addNodesAndEdges(RefBlocks, node, "ref");
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
type ECOption = echarts.ComposeOption<TreeSeriesOption | GraphSeriesOption>;
type edgeType = "parent" | "child" | "ref" | "def";
interface nodeModel extends TreeSeriesNodeItemOption {
  //extends Block
  id: BlockId;
  parent_id?: BlockId; //?会改变
  root_id: DocumentId;
  hash: string;
  box: string;
  path: string;
  hpath: string;
  name: string; //?会改变
  alias: string;
  memo: string;
  tag: string;
  content: string;
  fcontent?: string;
  markdown: string;
  length: number;
  type: BlockType;
  subtype: BlockSubType;
  ial?: { [key: string]: string };
  sort: number;
  created: string;
  updated: string;
  children: nodeModel[]; //?
}
interface edgeModel {
  refType: edgeType;
}
