"use client";

import type Konva from "konva";
import { useMemo } from "react";
import { Group, Rect, Text } from "react-konva";

import type { PlanogramProduct } from "@/types/planogram";

interface ProductBlockProps {
  product: PlanogramProduct;
  xPx: number;
  yPx: number;
  widthPx: number;
  heightPx: number;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => void;
}

const isDark = (hex: string): boolean => {
  const cleaned = (hex || "").replace("#", "");
  if (cleaned.length !== 6) return false;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 140;
};

export default function ProductBlock({
  product,
  xPx,
  yPx,
  widthPx,
  heightPx,
  isSelected,
  onSelect,
  onDragEnd,
}: ProductBlockProps) {
  const textColor = useMemo(
    () => (isDark(product.color_hex) ? "#FFFFFF" : "#111827"),
    [product.color_hex],
  );

  return (
    <Group x={xPx} y={yPx} draggable onClick={onSelect} onTap={onSelect} onDragEnd={onDragEnd}>
      <Rect
        width={widthPx}
        height={heightPx}
        fill={product.color_hex}
        stroke="#111827"
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={3}
      />
      <Text
        x={6}
        y={6}
        text={product.sku}
        fontSize={11}
        fill={textColor}
        fontFamily="DM Sans"
        width={Math.max(20, widthPx - 12)}
        ellipsis
        wrap="none"
      />
      <Text
        x={6}
        y={22}
        text={product.name}
        fontSize={11}
        fill={textColor}
        fontFamily="DM Sans"
        width={Math.max(20, widthPx - 12)}
        ellipsis
        wrap="none"
      />
      {product.facing_count > 1 ? (
        <Text
          x={Math.max(0, widthPx - 28)}
          y={Math.max(0, heightPx - 16)}
          text={`x${product.facing_count}`}
          fontSize={11}
          fill={textColor}
          fontFamily="DM Sans"
          align="right"
          width={24}
        />
      ) : null}
    </Group>
  );
}
