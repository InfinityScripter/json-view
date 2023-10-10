import "./jsonview.scss";

import getDataType from "./utils/getDataType";
import { listen, detach, element } from "./utils/dom";

const classes = {
  HIDDEN: "hidden",
  CARET_ICON: "caret-icon",
  CARET_RIGHT: "fa-caret-right",
  CARET_DOWN: "fa-caret-down",
  ICON: "fas",
};
//создаёт шаблон для раскрытого элемента JSON.
function expandedTemplate(params = {}) {
  const { key, size } = params;
  return `
    <div class="line">
      <div class="caret-icon"><i class="fas fa-caret-right"></i></div>
      <div class="json-key">${key}</div>
      <div class="json-size">${size}</div>
    </div>
  `;
}
//для элемента, который не раскрыт.
function notExpandedTemplate(params = {}) {
  const { key, value, type } = params;
  return `
    <div class="line">
      <div class="empty-icon"></div>
      <div class="json-key">${key}</div>
      <div class="json-separator">:</div>
      <div class="json-value json-${type}">${value}</div>
    </div>
  `;
}
//Создаёт контейнерный элемент, в который будут помещены все элементы JSON.
function createContainerElement() {
  const el = element("div");
  el.className = "json-container";
  return el;
}
//Скрывает все дочерние элементы узла node.
function hideNodeChildren(node) {
  node.children.forEach((child) => {
    child.el.classList.add(classes.HIDDEN);
    if (child.isExpanded) {
      hideNodeChildren(child);
    }
  });
}
//Показывает все дочерние элементы узла node.
function showNodeChildren(node) {
  node.children.forEach((child) => {
    child.el.classList.remove(classes.HIDDEN);
    if (child.isExpanded) {
      showNodeChildren(child);
    }
  });
}
//Устанавливает иконку-указатель в положение "вниз" для узла node.
function setCaretIconDown(node) {
  if (node.children.length > 0) {
    const icon = node.el.querySelector("." + classes.ICON);
    if (icon) {
      icon.classList.replace(classes.CARET_RIGHT, classes.CARET_DOWN);
    }
  }
}
//Устанавливает иконку-указатель в положение "вправо" для узла node.
function setCaretIconRight(node) {
  if (node.children.length > 0) {
    const icon = node.el.querySelector("." + classes.ICON);
    if (icon) {
      icon.classList.replace(classes.CARET_DOWN, classes.CARET_RIGHT);
    }
  }
}
//Переключает состояние узла node (раскрыт/скрыт).
export function toggleNode(node) {
  if (node.isExpanded) {
    node.isExpanded = false;
    setCaretIconRight(node);
    hideNodeChildren(node);
  } else {
    node.isExpanded = true;
    setCaretIconDown(node);
    showNodeChildren(node);
  }
}

/**
 * Create node html element
 * @param {object} node
 * @return html element
 */
//Создаёт DOM-элемент для узла node.
function createNodeElement(node) {
  let el = element("div");

  const getSizeString = (node) => {
    const len = node.children.length;
    if (node.type === "array") return `[${len}]`;
    if (node.type === "object") return `{${len}}`;
    return null;
  };

  if (node.children.length > 0) {
    el.innerHTML = expandedTemplate({
      key: node.key,
      size: getSizeString(node),
    });
    const caretEl = el.querySelector("." + classes.CARET_ICON);
    node.dispose = listen(caretEl, "click", () => toggleNode(node));
  } else {
    el.innerHTML = notExpandedTemplate({
      key: node.key,
      value: node.value,
      type: node.value === "{}" ? "object" : typeof node.value,
    });
    const valueEl = el.querySelector(".json-value");
    if (valueEl) {
      valueEl.setAttribute("contenteditable", "true");
      valueEl.addEventListener("input", function (e) {
        node.value = e.target.innerText;
        // Тут можно вызывать функцию для валидации JSON
      });
    }
  }

  const lineEl = el.children[0];

  if (node.parent !== null) {
    lineEl.classList.add(classes.HIDDEN);
  }

  lineEl.style = "margin-left: " + node.depth * 18 + "px;";

  return lineEl;
}

/**
 * Recursively traverse Tree object
 * @param {Object} node
 * @param {Callback} callback
 */
//Обходит дерево узлов, начиная с node, и применяет к каждому узлу функцию callback.
export function traverse(node, callback) {
  callback(node);
  if (node.children.length > 0) {
    node.children.forEach((child) => {
      traverse(child, callback);
    });
  }
}

/**
 * Create node object
 * @param {object} opt options
 * @return {object}
 */
//Создаёт новый узел с опциями opt.
function createNode(opt = {}) {
  const isEmptyObject = (value) => {
    return getDataType(value) === "object" && Object.keys(value).length === 0;
  };

  let value = opt.hasOwnProperty("value") ? opt.value : null;

  if (isEmptyObject(value)) {
    value = "{}";
  }

  return {
    key: opt.key || null,
    parent: opt.parent || null,
    value: value,
    isExpanded: opt.isExpanded || false,
    type: opt.type || null,
    children: opt.children || [],
    el: opt.el || null,
    depth: opt.depth || 0,
    dispose: null,
  };
}

/**
 * Create subnode for node
 * @param {object} Json data
 * @param {object} node
 */
//Создаёт дочерний узел для node с данными data.
function createSubnode(data, node) {
  if (typeof data === "object") {
    for (let key in data) {
      const child = createNode({
        value: data[key],
        key: key,
        depth: node.depth + 1,
        type: getDataType(data[key]),
        parent: node,
      });
      node.children.push(child);
      createSubnode(data[key], child);
    }
  }
}
//Возвращает объект JSON из данных data.
function getJsonObject(data) {
  return typeof data === "string" ? JSON.parse(data) : data;
}

/**
 * Create tree
 * @param {object | string} jsonData
 * @return {object}
 */
//Создаёт дерево узлов из данных JSON.
export function create(jsonData) {
  const parsedData = getJsonObject(jsonData);
  const rootNode = createNode({
    value: parsedData,
    key: getDataType(parsedData),
    type: getDataType(parsedData),
  });
  createSubnode(parsedData, rootNode);
  return rootNode;
}

/**
 * Render JSON string into DOM container
 * @param {string | object} jsonData
 * @param {htmlElement} targetElement
 * @return {object} tree
 */
//Отображает JSON данные в указанном DOM элементе.
export function renderJSON(jsonData, targetElement) {
  const parsedData = getJsonObject(jsonData);
  const tree = createTree(parsedData);
  render(tree, targetElement);
  return tree;
}

/**
 * Render tree into DOM container
 * @param {object} tree
 * @param {htmlElement} targetElement
 */
//Отображает уже созданное дерево узлов в указанном DOM элементе.
export function render(tree, targetElement) {
  const containerEl = createContainerElement();

  traverse(tree, function (node) {
    node.el = createNodeElement(node);
    containerEl.appendChild(node.el);
  });

  targetElement.appendChild(containerEl);
}
//Раскрывает узел node и все его дочерние узлы.
export function expand(node) {
  traverse(node, function (child) {
    child.el.classList.remove(classes.HIDDEN);
    child.isExpanded = true;
    setCaretIconDown(child);
  });
}
//Скрывает узел node и все его дочерние узлы.
export function collapse(node) {
  traverse(node, function (child) {
    child.isExpanded = false;
    if (child.depth > node.depth) child.el.classList.add(classes.HIDDEN);
    setCaretIconRight(child);
  });
}
//Удаляет дерево узлов и освобождает ресурсы.
export function destroy(tree) {
  traverse(tree, (node) => {
    if (node.dispose) {
      node.dispose();
    }
  });
  detach(tree.el.parentNode);
}

/**
 * Export public interface
 */
export default {
  toggleNode,
  render,
  create,
  renderJSON,
  expand,
  collapse,
  traverse,
  destroy,
};
