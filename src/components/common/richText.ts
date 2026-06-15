const ALLOWED_TAGS = new Set(["B", "STRONG", "I", "EM", "U", "A", "UL", "OL", "LI", "P", "BR", "SPAN", "DIV"]);
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(["href", "target", "rel"]),
};

const isSafeHref = (value: string) => {
  const href = value.trim().toLowerCase();
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("/") ||
    href.startsWith("#")
  );
};

export const sanitizeRichTextHtml = (html: string) => {
  if (!html) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  if (!root) return "";

  const walk = (node: Element) => {
    [...node.children].forEach((child) => {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        const text = doc.createTextNode(child.textContent || "");
        child.replaceWith(text);
        return;
      }

      [...child.attributes].forEach((attr) => {
        const allowed = ALLOWED_ATTRS[child.tagName];
        const isAllowed = allowed?.has(attr.name) ?? false;
        if (!isAllowed) {
          child.removeAttribute(attr.name);
          return;
        }

        if (child.tagName === "A" && attr.name === "href" && !isSafeHref(attr.value)) {
          child.removeAttribute("href");
        }
      });

      if (child.tagName === "A") {
        const href = child.getAttribute("href");
        if (href && !href.startsWith("#") && !href.startsWith("mailto:") && !href.startsWith("tel:")) {
          child.setAttribute("target", "_blank");
          child.setAttribute("rel", "noopener noreferrer");
        }
      }

      walk(child as Element);
    });
  };

  walk(root);
  return root.innerHTML;
};

export const stripRichTextHtml = (html: string) => {
  if (!html) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html.replace(/<[^>]+>/g, " ");
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
};
