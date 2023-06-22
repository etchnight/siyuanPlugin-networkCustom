import { Plugin, getFrontend, getBackend } from "siyuan";
import "./index.scss";
import G6 from "@antv/g6";
import * as sy from "../../siyuanPlugin-common/siyuan-api";
import {
  NodeConfig,
  EdgeConfig,
  ComboConfig,
  Graph,
  GraphData,
} from "@antv/g6/lib/index";
const STORAGE_NAME = "menu-config";
const DOCK_TYPE = "dock_tab";
//*g6动态添加节点、边、combo总是带来意想不到的问题，目前采用维护model数据重新render的方法
export default class networkCustom extends Plugin {
  //private isMobile: boolean;
  private graph: Graph;
  private lastTabWidth: number;
  private graphData: GraphData;
  onload() {
    let graph = this.graph;
    let lastTabWidth = this.lastTabWidth;
    let graphData = this.graphData;
    this.lastTabWidth = 0;
    //this.data[STORAGE_NAME] = { readonlyText: "Readonly" };
    //const frontEnd = getFrontend();
    //this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
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
        graph = buildGraph();
        //console.log(window.customGraph.i18n.prefix,"init");
      },
      update() {},
      async resize() {
        resizeGraph();
      },
      destroy() {
        graph.destroy();
        console.log("destroy dock:", DOCK_TYPE);
      },
    });
    console.log(this.i18n.prefix, this.i18n.helloPlugin);
    async function resizeGraph() {
      const container = document.getElementById("container_networkCustom");
      const widthNum = container.offsetWidth;
      const heightNum = container.offsetHeight;
      if (widthNum == 0 || !widthNum) {
        //*清除画布
        graph.clear();
      } else {
        //*改变大小
        graph.changeSize(heightNum, widthNum);
        //graph.chan
        if (!graph) {
          //*新建画布，这一步一般不会发生
          graph = buildGraph();
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
      const startNodeModel = buildNode(startBlock);
      startNodeModel.level = 50;
      graphData = {
        nodes: [startNodeModel],
        combos: [],
        edges: [],
      };
      //*设置初始位置，g6的canvas长宽尺寸是视口尺寸的两倍，故需除以4才能位于视口中心
      graph.changeData(graphData);
    }
    function buildGraph() {
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
        //*内置使用concentric总是布局不成功
        //在concentric中，minNodeSpacing: 150, //?这个属性是生效的，但官方文档中并没有它
        layout: {
          type: "comboCombined",
          /*innerLayout: new G6.Layout["radial"]({
            preventOverlap: true,
            strictRadial: false,
            nodeSpacing: (node) => {
              return node.getOutEdges().length * 10 + 10;
            },
            linkDistance: 500,
            //sortBy: "level",
          }),*/
          innerLayout: new G6.Layout["radial"]({
            //minNodeSpacing: 200, //?这个属性是生效的，但官方文档中并没有它
            //sortBy: "level",
            //linkDistance: 200,
          }),
          onLayoutEnd() {
            console.log("布局完成");
          },
        },
        plugins: [NodeContextMenu],
        defaultNode: {
          type: "circle",
          size: [50],
          color: "#5B8FF9",
          style: {
            fill: "#9EC9FF",
            lineWidth: 3,
          },
          labelCfg: {
            style: {
              fill: "#fff",
              fontSize: 12,
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
      graph.get("canvas").set("localRefresh", false);
      return graph;
    }

    function buildNode(block: Block) {
      const parentId = buildNodeParent(block);
      let node: nodeModel = {
        id: block.id,
        box: block.box,
        path: block.path,
        content: block.content,
        blockType: block.type,
        parent: parentId,
        root: block.root_id,
        comboId: "combo-" + block.root_id,
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
    /**
     * 文档node在同名combo中，box无node只有combo
     * 未使用changeData等方法更新图
     * @param block
     * @returns
     */
    async function addCombo(block: Block) {
      /*保留，只在type为文档时添加
      if (block.type != "d") {
        return;
      }*/
      block = await sy.getBlockById(block.root_id);
      let comboId = "combo-" + block.id;
      let comboAdded = graphData.combos.find((value) => [value.id == comboId]);
      //?保留，动态方法
      //let comboAdded = graph.findById(comboId);
      if (comboAdded) {
        return;
      }
      //---comboModel---
      let comboModel: ComboConfig = {
        id: comboId,
        label: buildNodeLabel(block),
      };
      //---parent---
      //*node在不存在comboId对应combo时可以新建成功，但combo不行，故使用parentId2暂存
      const parent = await sy.getParentBlock(block);
      if (parent) {
        comboModel.parentId2 = parent.id;
      }
      graphData.combos.push(comboModel);
      //---child---
      graphData.combos.forEach((child) => {
        if (child.parentId2 == comboId) {
          child.parentId = comboId;
        }
      });
      //?保留，动态方法
      /*
      const parent = await sy.getParentBlock(block);
      if (parent) {
        comboModel.parentId = parent.id;
      }
      //---childIds---
      let childIds = [];
      const childrenNodes = graph.findAll("node", (node) => {
        return node.getModel().comboId2 == comboId;
      });
      for (let child of childrenNodes) {
        childIds.push(child.getID());
      }
      graph.createCombo(comboModel, childIds);*/
    }
    /**
     * node添加到文档combo中，文档combo添加到文档combo或文件夹combo中
     * @param nodeId node或combo的id
     * @returns
     * @deprecated
     */
    function addToCombo(nodeId: string) {
      const item = graph.findById(nodeId);
      const model = item.getModel();
      let parentId = "";
      if (model.type == "node") {
        parentId = model.comboId as string;
      } else if (model.type == "combo") {
        parentId = model.parentId as string;
      }
      if (!parentId) {
        console.log(model, "无parentId");
        return;
      }
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
    /**
     * 没有警告的updateCombo
     */
    function updateCombo(comboId) {
      //graph.updateCombo(comboId);
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
    /**
     * 等待图动画结束，否则容易引发错误
     * @returns
     */
    async function waitGraphAnimate() {
      while (graph.isAnimating()) {
        await sleep(200);
      }
      return;
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
      comboId: string;
      //comboId: Block["root_id"];
      /**
       * 节点层级，初始节点为50，
       * 通过parent和child添加边时会相应增加和减少1
       * 通过ref添加时，会设置为1以使得其在同心圆的最外层
       */
      //
      level: number;
    }
    interface edgeModel extends EdgeConfig {
      refType: edgeType;
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
