// Measure against the same A4 typography used for display/print. Rows in two-column
// layouts stay together; oversized rows split their text and repeat section headings.
export function paginateCv(doc, root) {
  // Print CSS hides the measurement tree. Never paginate a zero-sized tree;
  // font loading callbacks can arrive while the print dialog is opening.
  if (!root || root.clientHeight < 500) return null;
  const sections = doc.sections
    .map((section, index) => ({
      ...section,
      originalIndex: index,
      start: 0,
      end: section.body.length,
    }))
    .filter((section) => section.visible);
  const available = root.clientHeight - (2 * doc.margin * 96) / 25.4;
  const headerHeight = root.querySelector(".cv-paper-header").getBoundingClientRect().height + 22;
  const nodes = [...root.querySelectorAll(".cv-paper-section")];
  const pages = [{ header: true, sections: [] }];
  let remaining = available - headerHeight;
  function newPage() {
    pages.push({ header: false, sections: [] });
    remaining = available;
  }
  function measure(section, text) {
    const source = nodes.find((node) => node.dataset.sectionId === section.id);
    const clone = source.cloneNode(true);
    clone.style.position = "absolute";
    clone.style.width = `${source.getBoundingClientRect().width}px`;
    clone.querySelector(".cv-paper-body").textContent = text || " ";
    root.append(clone);
    const height = clone.getBoundingClientRect().height;
    clone.remove();
    return height;
  }
  const rows = [];
  for (let i = 0; i < sections.length; ) {
    const wide = doc.layout === "one-column" || (doc.layout === "two-column" && i === 0);
    rows.push(sections.slice(i, i + (wide ? 1 : 2)));
    i += wide ? 1 : 2;
  }
  for (const row of rows) {
    let rest = row.map((section, column) => ({
      ...section,
      column: row.length === 1 && doc.layout === "two-column" ? "1 / -1" : column + 1,
    }));
    while (rest.length) {
      let height = Math.max(...rest.map((section) => measure(section, section.body)));
      if (
        height + 1 > remaining &&
        remaining < available &&
        (height <= available || remaining < 120)
      ) {
        newPage();
        continue;
      }
      const chunks = [],
        next = [];
      for (const section of rest) {
        let length = section.body.length;
        if (measure(section, section.body) > remaining - 1) {
          let low = 1,
            high = length;
          while (low < high) {
            const mid = Math.ceil((low + high) / 2);
            if (measure(section, section.body.slice(0, mid)) <= remaining - 1) low = mid;
            else high = mid - 1;
          }
          length = low;
          const boundary = section.body.slice(0, length).search(/\s+\S*$/);
          if (boundary > 0) length = boundary + 1;
        }
        chunks.push({
          ...section,
          body: section.body.slice(0, length),
          end: section.start + length,
        });
        if (length < section.body.length)
          next.push({
            ...section,
            body: section.body.slice(length),
            start: section.start + length,
          });
      }
      pages.at(-1).sections.push(...chunks);
      height = Math.max(...chunks.map((section) => measure(section, section.body)));
      remaining -= height + 22;
      rest = next;
      if (rest.length) newPage();
    }
  }
  return pages;
}
