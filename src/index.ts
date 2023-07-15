import { Plugin, getFrontend, getBackend } from "siyuan";
import "./index.scss";
import { echartsGraph, i18nType } from "./graph";
const STORAGE_NAME = "menu-config";
const DOCK_TYPE = "dock_tab";
export default class networkCustom extends Plugin {
  //private isMobile: boolean;
  onload() {
    // 图标
    if (!document.getElementById("icon_networkCustom")) {
      this.addIcons(`
      <symbol id="icon_networkCustom" viewBox="0 0 32 32">
      <path d="M6.531 12.534l0.93-1.405 3.37 2.233-0.93 1.403zM21.327 17.081l-0.455-1.62 3.891-1.095 0.455 1.62zM9.846 25.401l-1.261-1.115 2.678-3.028 1.263 1.117zM18.686 12.195l-1.459-0.842 1.347-2.333 1.459 0.842zM19.239 22.774l1.285-1.088 2.611 3.085-1.285 1.088z"></path>
      <path d="M15.663 23.916c-3.705 0-6.737-3.032-6.737-6.737s3.032-6.737 6.737-6.737 6.737 3.032 6.737 6.737-3.032 6.737-6.737 6.737zM15.663 12.126c-2.863 0-5.053 2.189-5.053 5.053s2.189 5.053 5.053 5.053 5.053-2.189 5.053-5.053-2.358-5.053-5.053-5.053zM5.221 14.147c-1.853 0-3.368-1.516-3.368-3.368s1.516-3.368 3.368-3.368 3.368 1.516 3.368 3.368-1.516 3.368-3.368 3.368zM5.221 9.095c-1.011 0-1.684 0.674-1.684 1.684s0.674 1.684 1.684 1.684 1.684-0.674 1.684-1.684-0.842-1.684-1.684-1.684zM7.916 29.642c-1.853 0-3.368-1.516-3.368-3.368s1.516-3.368 3.368-3.368 3.368 1.516 3.368 3.368-1.516 3.368-3.368 3.368zM7.916 24.589c-1.011 0-1.684 0.674-1.684 1.684s0.674 1.684 1.684 1.684 1.684-0.674 1.684-1.684-0.674-1.684-1.684-1.684zM26.779 18.021c-1.853 0-3.368-1.516-3.368-3.368s1.516-3.368 3.368-3.368 3.368 1.516 3.368 3.368-1.516 3.368-3.368 3.368zM26.779 12.968c-1.011 0-1.684 0.674-1.684 1.684s0.674 1.684 1.684 1.684 1.684-0.674 1.684-1.684-0.674-1.684-1.684-1.684zM20.716 10.947c-2.189 0-4.211-1.853-4.211-4.211s1.853-4.211 4.211-4.211 4.211 1.853 4.211 4.211-1.853 4.211-4.211 4.211zM20.716 4.211c-1.347 0-2.526 1.179-2.526 2.526s1.179 2.526 2.526 2.526 2.526-1.179 2.526-2.526-1.011-2.526-2.526-2.526zM23.411 28.8c-1.347 0-2.526-1.179-2.526-2.526s1.179-2.526 2.526-2.526 2.526 1.179 2.526 2.526-1.179 2.526-2.526 2.526zM23.411 25.432c-0.505 0-0.842 0.337-0.842 0.842s0.337 0.842 0.842 0.842 0.842-0.337 0.842-0.842-0.337-0.842-0.842-0.842z"></path>
      </symbol>
      `);
    }
    const eGraph = new echartsGraph(this.i18n as i18nType, this.app, this);
    let lastTabWidth = 0;
    const i18n = this.i18n;
    //@ts-ignore
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
        const container = document.getElementById("container_networkCustom");
        lastTabWidth = container.offsetWidth;
        eGraph.initGraph(container, 500, 500);
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
        if (lastTabWidth == widthNum) {
          return;
        }
        if (widthNum == 0 || !widthNum) {
          //*清除画布
          if (eGraph.graph) {
            eGraph.graph.clear();
          }
        } else {
          if (lastTabWidth == 0) {
            //*重绘
            eGraph.resizeGraph(widthNum, heightNum);
            eGraph.reInitGraph(widthNum, heightNum);
            await eGraph.reInitData();
          } else {
            //*改变大小
            eGraph.resizeGraph(widthNum, heightNum);
            if(!eGraph.isFocusing){
              eGraph.reInitGraph(widthNum, heightNum);
              eGraph.reComputePosition();
            }
          }
        }
        lastTabWidth = widthNum || 0;
      },
      destroy() {
        eGraph.graph.dispose();
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
