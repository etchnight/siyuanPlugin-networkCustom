import { Plugin, adaptHotkey, getFrontend, getBackend, IModel } from "siyuan";
import "./index.scss";
import G6 from "@antv/g6";

const STORAGE_NAME = "menu-config";
const DOCK_TYPE = "dock_tab";

export default class PluginSample extends Plugin {
  private customTab: () => IModel;
  private isMobile: boolean;

  onload() {
    this.data[STORAGE_NAME] = { readonlyText: "Readonly" };

    const frontEnd = getFrontend();
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
    // 图标的制作参见帮助文档
    this.addIcons(`
<symbol id="icon_networkCustom" viewBox="0 0 32 32">
<path d="M6.531 12.534l0.93-1.405 3.37 2.233-0.93 1.403zM21.327 17.081l-0.455-1.62 3.891-1.095 0.455 1.62zM9.846 25.401l-1.261-1.115 2.678-3.028 1.263 1.117zM18.686 12.195l-1.459-0.842 1.347-2.333 1.459 0.842zM19.239 22.774l1.285-1.088 2.611 3.085-1.285 1.088z"></path>
<path d="M15.663 23.916c-3.705 0-6.737-3.032-6.737-6.737s3.032-6.737 6.737-6.737 6.737 3.032 6.737 6.737-3.032 6.737-6.737 6.737zM15.663 12.126c-2.863 0-5.053 2.189-5.053 5.053s2.189 5.053 5.053 5.053 5.053-2.189 5.053-5.053-2.358-5.053-5.053-5.053zM5.221 14.147c-1.853 0-3.368-1.516-3.368-3.368s1.516-3.368 3.368-3.368 3.368 1.516 3.368 3.368-1.516 3.368-3.368 3.368zM5.221 9.095c-1.011 0-1.684 0.674-1.684 1.684s0.674 1.684 1.684 1.684 1.684-0.674 1.684-1.684-0.842-1.684-1.684-1.684zM7.916 29.642c-1.853 0-3.368-1.516-3.368-3.368s1.516-3.368 3.368-3.368 3.368 1.516 3.368 3.368-1.516 3.368-3.368 3.368zM7.916 24.589c-1.011 0-1.684 0.674-1.684 1.684s0.674 1.684 1.684 1.684 1.684-0.674 1.684-1.684-0.674-1.684-1.684-1.684zM26.779 18.021c-1.853 0-3.368-1.516-3.368-3.368s1.516-3.368 3.368-3.368 3.368 1.516 3.368 3.368-1.516 3.368-3.368 3.368zM26.779 12.968c-1.011 0-1.684 0.674-1.684 1.684s0.674 1.684 1.684 1.684 1.684-0.674 1.684-1.684-0.674-1.684-1.684-1.684zM20.716 10.947c-2.189 0-4.211-1.853-4.211-4.211s1.853-4.211 4.211-4.211 4.211 1.853 4.211 4.211-1.853 4.211-4.211 4.211zM20.716 4.211c-1.347 0-2.526 1.179-2.526 2.526s1.179 2.526 2.526 2.526 2.526-1.179 2.526-2.526-1.011-2.526-2.526-2.526zM23.411 28.8c-1.347 0-2.526-1.179-2.526-2.526s1.179-2.526 2.526-2.526 2.526 1.179 2.526 2.526-1.179 2.526-2.526 2.526zM23.411 25.432c-0.505 0-0.842 0.337-0.842 0.842s0.337 0.842 0.842 0.842 0.842-0.337 0.842-0.842-0.337-0.842-0.842-0.842z"></path>
</symbol>
`);

    this.addDock({
      config: {
        position: "RightTop",
        size: { width: 200, height: 100 },
        icon: "icon_networkCustom",
        title: "可交互关系图",
      },
      data: {
        text: "This is my custom dock",
      },
      type: DOCK_TYPE,
      init() {
        this.element.innerHTML =
          //html
          `<div class="fn__flex-1 fn__flex-column">
    <div class="block__icons">
        <div class="block__logo">
            <svg><use xlink:href="#iconEmoji"></use></svg>
            Custom Dock
        </div>
        <span class="fn__flex-1 fn__space"></span>
        <span data-type="min" class="block__icon b3-tooltips b3-tooltips__sw" aria-label="Min ${adaptHotkey(
          "⌘W"
        )}"><svg><use xlink:href="#iconMin"></use></svg></span>
    </div>
    <div class="fn__flex-1 plugin-sample__custom-dock">
    <div id='container_networkCustom'></div>
        ${this.data.text}
    </div>
</div>`;
        render();
      },
      destroy() {
        console.log("destroy dock:", DOCK_TYPE);
      },
    });

    const btnaElement = document.createElement("button");
    btnaElement.className = "b3-button b3-button--outline fn__flex-center";
    btnaElement.textContent = "Open";
    btnaElement.addEventListener("click", () => {
      window.open("https://github.com/siyuan-note/plugin-sample");
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
function render() {
  const data = {
    nodes: [
      {
        id: "node1",
        label: "Circle1",
        x: 150,
        y: 150,
      },
      {
        id: "node2",
        label: "Circle2",
        x: 400,
        y: 150,
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
    width: 500,
    height: 500,
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
  console.log("执行了");
  graph.render();
}
