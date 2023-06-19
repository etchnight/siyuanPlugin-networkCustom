import { Plugin, getFrontend, getBackend } from "siyuan";
import "./index.scss";
import G6 from "@antv/g6";
import * as sy from "../../siyuanPlugin-common/siyuan-api";
import {
  NodeConfig,
  EdgeConfig,
  ComboConfig,
  Graph,
  INode,
  ICombo,
} from "@antv/g6/lib/index";
const STORAGE_NAME = "menu-config";
const DOCK_TYPE = "dock_tab";
declare global {
  interface Window {
    customGraph: { graph: Graph; lastTabWidth: number; i18n: any };
  }
}
export default class networkCustom extends Plugin {
  private isMobile: boolean;

  onload() {
    window.customGraph = { graph: undefined, lastTabWidth: 0, i18n: this.i18n };
    this.data[STORAGE_NAME] = { readonlyText: "Readonly" };
    const frontEnd = getFrontend();
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
    // 图标的制作参见帮助文档
    if (!document.getElementById("icon_networkCustom")) {
      this.addIcons(`
      <symbol id="icon_networkCustom" viewBox="0 0 32 32">
      <path d="M6.531 12.534l0.93-1.405 3.37 2.233-0.93 1.403zM21.327 17.081l-0.455-1.62 3.891-1.095 0.455 1.62zM9.846 25.401l-1.261-1.115 2.678-3.028 1.263 1.117zM18.686 12.195l-1.459-0.842 1.347-2.333 1.459 0.842zM19.239 22.774l1.285-1.088 2.611 3.085-1.285 1.088z"></path>
      <path d="M15.663 23.916c-3.705 0-6.737-3.032-6.737-6.737s3.032-6.737 6.737-6.737 6.737 3.032 6.737 6.737-3.032 6.737-6.737 6.737zM15.663 12.126c-2.863 0-5.053 2.189-5.053 5.053s2.189 5.053 5.053 5.053 5.053-2.189 5.053-5.053-2.358-5.053-5.053-5.053zM5.221 14.147c-1.853 0-3.368-1.516-3.368-3.368s1.516-3.368 3.368-3.368 3.368 1.516 3.368 3.368-1.516 3.368-3.368 3.368zM5.221 9.095c-1.011 0-1.684 0.674-1.684 1.684s0.674 1.684 1.684 1.684 1.684-0.674 1.684-1.684-0.842-1.684-1.684-1.684zM7.916 29.642c-1.853 0-3.368-1.516-3.368-3.368s1.516-3.368 3.368-3.368 3.368 1.516 3.368 3.368-1.516 3.368-3.368 3.368zM7.916 24.589c-1.011 0-1.684 0.674-1.684 1.684s0.674 1.684 1.684 1.684 1.684-0.674 1.684-1.684-0.674-1.684-1.684-1.684zM26.779 18.021c-1.853 0-3.368-1.516-3.368-3.368s1.516-3.368 3.368-3.368 3.368 1.516 3.368 3.368-1.516 3.368-3.368 3.368zM26.779 12.968c-1.011 0-1.684 0.674-1.684 1.684s0.674 1.684 1.684 1.684 1.684-0.674 1.684-1.684-0.674-1.684-1.684-1.684zM20.716 10.947c-2.189 0-4.211-1.853-4.211-4.211s1.853-4.211 4.211-4.211 4.211 1.853 4.211 4.211-1.853 4.211-4.211 4.211zM20.716 4.211c-1.347 0-2.526 1.179-2.526 2.526s1.179 2.526 2.526 2.526 2.526-1.179 2.526-2.526-1.011-2.526-2.526-2.526zM23.411 28.8c-1.347 0-2.526-1.179-2.526-2.526s1.179-2.526 2.526-2.526 2.526 1.179 2.526 2.526-1.179 2.526-2.526 2.526zM23.411 25.432c-0.505 0-0.842 0.337-0.842 0.842s0.337 0.842 0.842 0.842 0.842-0.337 0.842-0.842-0.337-0.842-0.842-0.842z"></path>
      </symbol>
      `);
    }

    this.addDock({
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
      init() {
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
        render();
        //console.log(window.customGraph.i18n.prefix,"init");
      },
      update() {},
      async resize() {
        const container = document.getElementById("container_networkCustom");
        const widthNum = container.offsetWidth;
        const heightNum = container.offsetHeight;
        const graph = window.customGraph.graph;
        if (widthNum == 0 || !widthNum) {
          //*清除画布
          graph.clear();
        } else {
          //*改变大小
          /*const height = window
            .getComputedStyle(container)
            .getPropertyValue("height");
          const heightNum = parseInt(height);*/
          graph.changeSize(heightNum, widthNum);
          //graph.fitView(20);
          if (!graph) {
            //*新建画布，这一步一般不会发生
            render();
          } else if (window.customGraph.lastTabWidth == 0) {
            //*重绘
            await reInitGraph();
          }
        }
        window.customGraph.lastTabWidth = widthNum || 0;
      },
      destroy() {
        const graph = window.customGraph.graph;
        graph.destroy();
        console.log("destroy dock:", DOCK_TYPE);
      },
    });

    console.log(this.i18n.prefix, this.i18n.helloPlugin);
  }

  onLayoutReady() {
    this.loadData(STORAGE_NAME);
    console.log(`frontend: ${getFrontend()}; backend: ${getBackend()}`);
  }

  onunload() {
    console.log(this.i18n.prefix, this.i18n.byePlugin);
  }
}

async function render() {
  const data = {
    nodes: [
      {
        id: "node1",
        label: "示例节点1",
      },
      {
        id: "node2",
        label: "示例节点2",
      },
    ],
    edges: [
      {
        source: "node1",
        target: "node2",
      },
    ],
  };
  const NodeContextMenu = new G6.Menu({
    getContent(evt) {
      return `
      <div class='customGraphContextMenu'>
        <div itemName='expandNode'>展开节点</div>
      </div>`;
    },
    handleMenuClick: async (target, item) => {
      let itemName = target.getAttribute("itemName");
      let nodeModel = item.getModel() as nodeModel;
      switch (itemName) {
        case "expandNode":
          await expandNode(nodeModel);
      }
      //console.log(target, item);
    },
    offsetX: 16 + 10,
    offsetY: 0,
    itemTypes: ["node"],
  });
  const graph = new G6.Graph({
    container: "container_networkCustom",
    fitView: true,
    height: 600,
    width: 600,
    animate: true,
    groupByTypes: false,
    modes: {
      default: ["zoom-canvas", "drag-canvas"],
    },
    layout: {
      type: "comboCombined",
      innerLayout: new G6.Layout["concentric"]({
        preventOverlap: true,
        minNodeSpacing: 100,//?这个属性是生效的，但官方文档中并没有他
        sortBy: "level",
      }),
    },
    plugins: [NodeContextMenu],
    defaultNode: {
      type: "circle",
      //size: [100],
      color: "#5B8FF9",
      style: {
        fill: "#9EC9FF",
        lineWidth: 3,
      },
      labelCfg: {
        style: {
          fill: "#fff",
          fontSize: 20,
        },
      },
    },
    defaultEdge: {
      style: {
        stroke: "#e2e2e2",
        endArrow: true,
      },
    },
    defaultCombo: {
      type: "circle",
      style: {
        fill: "#steelblue",
        fillOpacity: 0.5,
      },
    },
  });

  graph.data(data);
  graph.render();
  window.customGraph.graph = graph;
  graph.get("canvas").set("localRefresh", false);
}
async function reInitGraph() {
  const graph = window.customGraph.graph;
  if (!graph) {
    return;
  }
  const startNodeId = sy.getFocusNodeId();
  if (!startNodeId) {
    sy.pushErrMsg(
      window.customGraph.i18n.prefix + window.customGraph.i18n.startNodeError
    );
    return;
  }
  const startBlock = await sy.getBlockById(startNodeId);
  const startNodeModel = buildNode(startBlock);
  startNodeModel.level = 20;
  //console.log(startNodeModel);
  //*设置初始位置，g6的canvas长宽尺寸是视口尺寸的两倍，故需除以4才能位于视口中心
  //let x = graph.getWidth() / 4;
  //let y = graph.getHeight() / 4;
  //startNodeModel.x = x;
  //startNodeModel.y = y;
  let combosModel = [
    {
      id: "combo1",
      label: "combo1",
    },
  ];
  //combosModel = [];
  graph.changeData({
    nodes: [startNodeModel],
    combos: combosModel,
  });
  //graph.focusItem(startNodeId);
}
function buildNode(block: Block) {
  let node: nodeModel = {
    id: block.id,
    box: block.box,
    path: block.path,
    content: block.content,
    blockType: block.type,
    parent: buildNodeParent(block),
    root: block.root_id,
    //?直接指定comboId会带来意想不到的问题，在后序中直接添加到相应combo
    //comboId: (block.root_id || block.box) + "-combo",
    comboId: "combo1",
    label: buildNodeLabel(block),
    level: 1,
  };
  return node;
}
//todo 文档的parent需要单独处理
function buildNodeParent(block: Block) {
  return block.parent_id;
}
function buildNodeLabel(block: Block): string {
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
function addCombo(block: Block) {
  //*添加自身
  if (block.type != "d") {
    return;
  }
  //console.group("addCombo");
  const graph = window.customGraph.graph;
  let comboId = block.id + "-combo";
  let comboAdded = graph.findById(comboId);
  if (comboAdded) {
    return;
  }
  //---comboModel---
  let comboModel: ComboConfig = {
    id: comboId,
    parent: buildNodeParent(block),
    label: buildNodeLabel(block),
  };
  //---childIds---
  let childIds = [];
  const childrenNodes = graph.findAll("node", (node) => {
    return node.getModel().root == block.id;
  });
  for (let child of childrenNodes) {
    childIds.push(child.getID());
  }
  graph.createCombo(comboModel, childIds);
  console.log(comboModel, childIds);
  const parentCombo = graph.find("combo", (combo) => {
    return combo.getModel().parentId == comboId;
  });
  //*添加父级
  /*
    comboId = parentId + "-combo";
    comboAdded = graph.findById(comboId);
    if (!comboAdded) {
      if (block.parent_id) {
        block = await sy.getBlockById(block.parent_id);
        addCombo(block); //!递归
      } else {
        let notebook = await sy.getNotebookConf(block.box);
        comboModel = {
          id: comboId,
          label: notebook.name,
        };
        graph.addItem("combo", comboModel);
        console.log("combo", comboModel);
      }
    }*/

  //console.groupEnd();
  //graph.layout();
}
/**
 *
 * @param nodeId node或combo的id
 * @returns
 */
function addToCombo(nodeId: string) {
  //console.log("开始addToCombo");
  const graph = window.customGraph.graph;
  const item = graph.findById(nodeId);
  const model = item.getModel();
  let parentId = "";
  if (model.type == "node") {
    parentId = model.root as string;
  } else if (model.type == "combo") {
    parentId = model.parent as string;
  }
  if (!parentId) {
    console.log(model, "无parentId");
    return;
  }
  parentId = parentId + "-combo";
  let parentCombo = graph.findById(parentId);
  if (!parentCombo) {
    console.log(model, "未创建combo");
    return;
  }
  console.log("准备移动至combo", model.label);
  graph.updateComboTree(nodeId, parentId);
  console.log("已移动至combo", model.label);
}
async function addNodesAndEdges(
  otherBlocks: Block[],
  origin: nodeModel,
  othersType: edgeType
): Promise<edgeModel[]> {
  if (otherBlocks.length == 0) {
    return [];
  }
  //console.group("添加边和节点");
  const graph = window.customGraph.graph;
  for (let otherBlock of otherBlocks) {
    await sleep(200);
    let other = buildNode(otherBlock);
    let nodeAdded = graph.findById(other.id);
    if (!nodeAdded) {
      graph.addItem("node", other);
      //graph.updateComboTree(other.id, "combo1");
      //graph.layout();
      //addCombo(otherBlock);
      //addToCombo(otherBlock.id);
      //console.log("添加节点", other);
    }
    let edge = buildEdge(origin, other, othersType);
    if (!edge.id) {
      continue;
    }
    let edgeAdded = graph.findById(edge.id);
    if (!edgeAdded) {
      graph.addItem("edge", edge);
      //console.log("添加边", edge);
      //*更新节点level
      switch (edge.refType) {
        case "child":
          graph.updateItem(other.id, {
            level: origin.level - 1,
          });
          break;
        case "parent":
          graph.updateItem(other.id, {
            level: origin.level + 1,
          });
          break;
      }
    }
  }
  //console.groupEnd();
  console.log(graph.getNodes());
  console.log(graph.getCombos());
  console.log(graph.getEdges());
  //graph.updateCombos();
  //const data = graph.save();
  //graph.read(data);
  graph.layout();
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
type edgeType = "parent" | "child" | "ref" | "def";
interface nodeModel extends NodeConfig {
  box: Block["box"]; //`json:"box"`
  path: Block["path"]; //   `json:"path"`
  content: Block["content"];
  blockType: Block["type"];
  parent: Block["parent_id"];
  root: Block["root_id"];
  //comboId: Block["root_id"];
  /**
   * 节点层级，初始节点为20，
   * 通过parent和child添加边时会相应增加和减少1
   * 通过ref添加时，会设置为1以使得其在同心圆的最外层
   */
  //
  level: number;
}
interface edgeModel extends EdgeConfig {
  refType: edgeType;
}
