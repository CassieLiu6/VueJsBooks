function Compiler(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const rootElement = doc.body.firstChild;

  function compileElement(element) {
    const obj = {
      tag: element.tagName.toLowerCase(),
      children: []
    };

    for (const childNode of element.childNodes) {
      if (childNode.nodeType === Node.ELEMENT_NODE) {
        obj.children.push(compileElement(childNode));
      } else if (childNode.nodeType === Node.TEXT_NODE) {
        const textContent = childNode.textContent.trim();
        if (textContent !== '') {
          obj.children.push(textContent);
        }
      }
    }

    return obj;
  }

  return compileElement(rootElement);
}