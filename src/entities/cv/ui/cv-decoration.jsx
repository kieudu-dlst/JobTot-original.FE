import { useRef } from "react";
import { cvImageUrl } from "../api/cv-api";
import { decorationLayer, moveDecoration, resizeDecoration } from "../model/decoration";

export function CvDecoration({ image, selected, onSelect, onChange, onInteractionChange }) {
  const gesture = useRef(null);
  const position = {
    left: `${image.x}mm`,
    top: `${image.y}mm`,
    width: `${image.width}mm`,
    height: `${image.height}mm`,
  };
  function start(event, resize = false) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.focus();
    onSelect(image.id);
    gesture.current = {
      image: { ...image },
      x: event.clientX,
      y: event.clientY,
      resize,
      scale: event.currentTarget.closest(".cv-sheet").getBoundingClientRect().width / 210,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    onInteractionChange?.(true);
  }
  function move(event) {
    const initial = gesture.current;
    if (!initial) return;
    const dx = (event.clientX - initial.x) / initial.scale;
    const dy = (event.clientY - initial.y) / initial.scale;
    onChange(
      initial.resize
        ? resizeDecoration(initial.image, dx, dy)
        : moveDecoration(initial.image, dx, dy),
    );
  }
  function end() {
    if (!gesture.current) return;
    gesture.current = null;
    onInteractionChange?.(false);
  }
  return (
    <>
      <img
        className="cv-decoration-image"
        style={{
          ...position,
          opacity: image.opacity,
          zIndex: decorationLayer(image.zIndex),
        }}
        src={cvImageUrl(image.url)}
        alt=""
        draggable={false}
      />
      {onChange && (
        <div
          className={`cv-decoration-hit ${selected ? "cv-decoration-selected" : ""}`}
          style={{ ...position, zIndex: selected ? 50 : decorationLayer(image.zIndex) }}
          role="button"
          tabIndex={0}
          aria-label="Chọn và di chuyển ảnh trang trí"
          aria-pressed={selected}
          onFocus={() => onSelect(image.id)}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onLostPointerCapture={end}
          onKeyDown={(event) => {
            const amount = event.shiftKey ? 5 : 1;
            const delta = {
              ArrowLeft: [-amount, 0],
              ArrowRight: [amount, 0],
              ArrowUp: [0, -amount],
              ArrowDown: [0, amount],
            }[event.key];
            if (delta) {
              event.preventDefault();
              onChange(moveDecoration(image, ...delta));
            }
          }}
        >
          {selected && (
            <button
              type="button"
              className="cv-decoration-resize"
              aria-label="Thay đổi kích thước ảnh, giữ tỷ lệ"
              onPointerDown={(event) => start(event, true)}
              onPointerMove={(event) => {
                event.stopPropagation();
                move(event);
              }}
              onPointerUp={end}
              onPointerCancel={end}
              onLostPointerCapture={end}
              onKeyDown={(event) => {
                if (["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp"].includes(event.key)) {
                  event.preventDefault();
                  event.stopPropagation();
                  const amount =
                    (event.shiftKey ? 5 : 1) *
                    (["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1);
                  onChange(resizeDecoration(image, amount, (amount * image.height) / image.width));
                }
              }}
            />
          )}
        </div>
      )}
    </>
  );
}
