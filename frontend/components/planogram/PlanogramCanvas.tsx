"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Layer, Line, Rect, Stage, Text } from "react-konva";

import ProductBlock from "@/components/planogram/ProductBlock";
import { usePlanogramStore } from "@/store/planogramStore";

const TIER_LABELS: Record<string, string> = {
  top_level: "Top",
  eye_level: "Eye Level",
  mid_level: "Mid",
  low_level: "Low",
};

const LEFT_GUTTER = 110;
const RIGHT_GUTTER = 24;
const TOP_PADDING = 24;
const BOTTOM_PADDING = 24;

export default function PlanogramCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const planogram = usePlanogramStore((state) => state.planogram);
  const selectedSku = usePlanogramStore((state) => state.selectedProductSku);
  const setSelected = usePlanogramStore((state) => state.setSelected);
  const moveProduct = usePlanogramStore((state) => state.moveProduct);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const update = () => {
      const rect = element.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const planogramJson = planogram?.planogram_json;

  const layout = useMemo(() => {
    if (!planogramJson || size.width === 0) return null;
    const config = planogramJson.shelf_config;
    const shelfWidthCm = config.shelf_width_cm || 180;
    const shelfCount = Math.max(1, config.shelf_count || planogramJson.shelves.length);
    const drawableWidth = Math.max(160, size.width - LEFT_GUTTER - RIGHT_GUTTER);
    const drawableHeight = Math.max(160, size.height - TOP_PADDING - BOTTOM_PADDING);
    const shelfHeightPx = Math.floor(drawableHeight / shelfCount);
    const cmToPx = drawableWidth / shelfWidthCm;
    return { shelfHeightPx, cmToPx, drawableWidth, drawableHeight };
  }, [planogramJson, size.width, size.height]);

  if (!planogramJson) {
    return (
      <div ref={containerRef} className="flex h-full items-center justify-center text-sm text-gray-500">
        Loading planogram...
      </div>
    );
  }

  const sortedShelves = [...planogramJson.shelves].sort((a, b) => a.shelf_number - b.shelf_number);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
      {layout && size.width > 0 ? (
        <Stage
          width={size.width}
          height={size.height}
          onClick={(event) => {
            if (event.target === event.target.getStage()) {
              setSelected(null);
            }
          }}
        >
          <Layer listening={false}>
            <Rect x={0} y={0} width={size.width} height={size.height} fill="#FFFFFF" />

            {sortedShelves.map((shelf, index) => {
              const shelfBottom = TOP_PADDING + (index + 1) * layout.shelfHeightPx - 2;
              return (
                <Line
                  key={`line-${shelf.shelf_number}`}
                  points={[LEFT_GUTTER, shelfBottom, LEFT_GUTTER + layout.drawableWidth, shelfBottom]}
                  stroke="#111827"
                  strokeWidth={1.5}
                />
              );
            })}

            {sortedShelves.map((shelf, index) => {
              const shelfTop = TOP_PADDING + index * layout.shelfHeightPx;
              return (
                <Text
                  key={`label-${shelf.shelf_number}`}
                  x={12}
                  y={shelfTop + 8}
                  text={`Shelf ${shelf.shelf_number}\n${TIER_LABELS[shelf.tier] ?? "Mid"}`}
                  fontSize={11}
                  fill="#6B7280"
                  fontFamily="DM Sans"
                  width={LEFT_GUTTER - 20}
                />
              );
            })}
          </Layer>

          <Layer>
            {sortedShelves.flatMap((shelf, shelfIndex) => {
              const shelfTop = TOP_PADDING + shelfIndex * layout.shelfHeightPx;
              const blockHeight = layout.shelfHeightPx - 8;
              return shelf.products.map((product) => {
                const xPx = LEFT_GUTTER + product.position_x_cm * layout.cmToPx;
                const yPx = shelfTop + 4;
                const widthPx = Math.max(24, product.total_width_cm * layout.cmToPx);
                return (
                  <ProductBlock
                    key={`${shelf.shelf_number}-${product.sku}`}
                    product={product}
                    xPx={xPx}
                    yPx={yPx}
                    widthPx={widthPx}
                    heightPx={blockHeight}
                    isSelected={selectedSku === product.sku}
                    onSelect={() => setSelected(product.sku)}
                    onDragEnd={(event) => {
                      const node = event.target;
                      const newPxX = node.x();
                      const newPxY = node.y();
                      const newPositionXCm = Math.max(0, (newPxX - LEFT_GUTTER) / layout.cmToPx);
                      const targetShelfIndex = Math.min(
                        sortedShelves.length - 1,
                        Math.max(0, Math.floor((newPxY - TOP_PADDING) / layout.shelfHeightPx)),
                      );
                      const targetShelfNumber = sortedShelves[targetShelfIndex].shelf_number;
                      moveProduct(product.sku, shelf.shelf_number, targetShelfNumber, newPositionXCm);
                    }}
                  />
                );
              });
            })}
          </Layer>
        </Stage>
      ) : null}
    </div>
  );
}
