import { Plugin, getFrontend, getBackend } from "siyuan";
import "./index.scss";
import G6 from "@antv/g6";
import * as sy from "../../siyuanPlugin-common/siyuan-api";
import { NodeConfig, Graph } from "@antv/g6/lib/index";
const STORAGE_NAME = "menu-config";
const DOCK_TYPE = "dock_tab";
declare global {
  interface Window {
    customGraph: { graph: Graph; lastTabWidth: number };
  }
}
export default class PluginSample extends Plugin {
  private isMobile: boolean;

  onload() {
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
        console.log("init");
      },
      update() {
        console.log("update");
      },
      async resize() {
        let container = document.getElementById("container_networkCustom");
        let width = window
          .getComputedStyle(container)
          .getPropertyValue("width");
        let widthNum = parseInt(width);
        const graph = window.customGraph.graph;
        if (widthNum == 0 || !widthNum) {
          //*清除画布
          graph.clear();
        } else {
          //console.log(graph)
          //*改变大小
          const height = window
            .getComputedStyle(container)
            .getPropertyValue("height");
          const heightNum = parseInt(height);
          console.log([heightNum, widthNum]);
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

    console.log(this.i18n.helloPlugin);
  }

  onLayoutReady() {
    this.loadData(STORAGE_NAME);
    console.log(`frontend: ${getFrontend()}; backend: ${getBackend()}`);
  }

  onunload() {
    console.log(this.i18n.byePlugin);
  }
}

async function render() {
  const data = {
    nodes: [
      {
        id: "node1",
        label: "Circle1",
        // x: 150,
        //y: 150,
      },
      {
        id: "node2",
        label: "Circle2",
        //x: 400,
        //y: 150,
      },
    ],
    edges: [
      {
        source: "node1",
        target: "node2",
      },
    ],
  };

  const graph = new G6.Graph({
    container: "container_networkCustom",
    fitView: true,
    height: 600,
    width: 600,
    modes: {
      default: ["zoom-canvas", "drag-canvas"],
    },
    layout: { type: "comboCombined" },
    defaultNode: {
      type: "circle",
      size: [100],
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
      },
    },
  });

  graph.data(data);
  graph.render();
  window.customGraph.graph = graph;
  await reInitGraph();
}
async function reInitGraph() {
  const graph = window.customGraph.graph;
  if (!graph) {
    return;
  }
  const startNodeId = sy.getFocusNodeId();
  if (!startNodeId) {
    return;
  }
  const startBlock = await sy.getBlockById(startNodeId);
  const startNodeModel = buildNode(startBlock);
  //console.log(startNodeModel);
  //*设置初始位置，g6的canvas长宽尺寸是视口尺寸的两倍，故需除以4才能位于视口中心
  let x = graph.getWidth() / 4;
  let y = graph.getHeight() / 4;
  startNodeModel.x = x;
  startNodeModel.y = y;
  graph.changeData({ nodes: [startNodeModel] });
  //graph.focusItem(startNodeId);
}
function buildNode(block: Block) {
  let node: nodeModel = {
    id: block.id,
    box: block.box,
    path: block.path,
    title: block.content,
    blockType: block.type,
    parent: block.parent_id,
    label: buildNodeLabel(block),
  };
  return node;
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
type edgeType = "parent" | "child" | "ref" | "def";
interface nodeModel extends NodeConfig {
  box: Block["box"]; //`json:"box"`
  path: Block["path"]; //   `json:"path"`
  title: Block["content"];
  blockType: Block["type"];
  parent: Block["parent_id"];
}
