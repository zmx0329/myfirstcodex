from __future__ import annotations

from io import BytesIO

from PIL import Image, ImageDraw, ImageFont

from ..models.common import LabelPayload, NormalizedBounds, TimePayload
from .utils import clamp, format_time_label, wrap_text


class ImageService:
  """Composes the final artwork (tag + time + coin) on top of the pixel image."""

  def __init__(self) -> None:
    self.font = ImageFont.load_default()

  def compose(self, base_image_bytes: bytes, label: LabelPayload, box_bounds: NormalizedBounds | None) -> bytes:
    base = Image.open(BytesIO(base_image_bytes)).convert("RGBA")
    canvas = base.copy()

    # box_bounds reserved for future alignment between detection框 and标签
    _ = box_bounds

    self._draw_tag(canvas, label)
    self._draw_time_chip(canvas, label.time)
    self._draw_coin(canvas)

    output = BytesIO()
    canvas.save(output, format="PNG")
    return output.getvalue()

  def _draw_tag(self, canvas: Image.Image, label: LabelPayload) -> None:
    draw = ImageDraw.Draw(canvas)
    base_width = 320
    base_height = 210
    scale = clamp(label.tag_scale, 0.6, 2.0)
    tag_width = int(base_width * scale)
    tag_height = int(base_height * scale)

    x_center = clamp(label.tag_position.x_percent, 0.05, 0.95) * canvas.width
    y_center = clamp(label.tag_position.y_percent, 0.05, 0.95) * canvas.height
    x0 = clamp(x_center - tag_width / 2, 0, canvas.width - tag_width)
    y0 = clamp(y_center - tag_height / 2, 0, canvas.height - tag_height)
    x1 = x0 + tag_width
    y1 = y0 + tag_height

    frame_color = (196, 119, 24, 255)
    fill_color = (255, 230, 179, 240)
    divider_color = (180, 104, 16, 255)

    draw.rounded_rectangle([x0, y0, x1, y1], radius=int(12 * scale), fill=fill_color, outline=frame_color, width=3)

    padding = 12 * scale
    text_x = x0 + padding
    current_y = y0 + padding

    draw.text((text_x, current_y), label.name or "未命名物品", fill=frame_color, font=self.font)
    current_y += 18 * scale
    draw.line([(text_x, current_y), (x1 - padding, current_y)], fill=divider_color, width=1)

    current_y += 8 * scale
    draw.text((text_x, current_y), label.category or "类别", fill=(110, 58, 12, 255), font=self.font)
    current_y += 14 * scale
    draw.line([(text_x, current_y), (x1 - padding, current_y)], fill=divider_color, width=3)

    current_y += 10 * scale
    body_width = x1 - padding - text_x
    description = label.description or "在这里写下物品的故事。"
    for line in wrap_text(description, limit=int(body_width / (7 * scale))):
      draw.text((text_x, current_y), line, fill=(92, 50, 10, 255), font=self.font)
      current_y += 14 * scale

    if label.category in ("菜品", "食物"):
      current_y += 6 * scale
      energy_text = f"+{label.energy} 能量"
      health_text = f"+{label.health} 生命值"
      draw.text((text_x, current_y), energy_text, fill=(46, 102, 8, 255), font=self.font)
      draw.text((text_x + body_width * 0.5, current_y), health_text, fill=(141, 26, 26, 255), font=self.font)

  def _draw_time_chip(self, canvas: Image.Image, time: TimePayload) -> None:
    draw = ImageDraw.Draw(canvas)
    margin = 12
    box_width = 180
    box_height = 74

    x1 = canvas.width - margin
    x0 = x1 - box_width
    y0 = margin
    y1 = y0 + box_height

    wood = (206, 162, 112, 235)
    outline = (120, 82, 44, 255)

    draw.rounded_rectangle([x0, y0, x1, y1], radius=10, fill=wood, outline=outline, width=2)

    text_x = x0 + 12
    top_y = y0 + 10
    draw.text((text_x, top_y), f"{time.month}月{time.day}日", fill=(64, 38, 12, 255), font=self.font)
    draw.text((text_x, top_y + 18), format_time_label(time.hour, time.minute), fill=(64, 38, 12, 255), font=self.font)

    center_x = x1 - 36
    center_y = y0 + box_height / 2
    radius = 24
    draw.ellipse([center_x - radius, center_y - radius, center_x + radius, center_y + radius], outline=outline, fill=(239, 211, 170, 255), width=2)

    minute_angle = (time.minute / 60) * 360
    hour_angle = ((time.hour % 12) / 12) * 360 + (time.minute / 60) * 30
    self._draw_hand(draw, center_x, center_y, radius * 0.9, minute_angle, outline)
    self._draw_hand(draw, center_x, center_y, radius * 0.65, hour_angle, outline)
    draw.ellipse([center_x - 2, center_y - 2, center_x + 2, center_y + 2], fill=outline)

  def _draw_hand(self, draw: ImageDraw.ImageDraw, cx: float, cy: float, length: float, angle_deg: float, color: tuple[int, int, int, int]) -> None:
    import math

    radians = math.radians(angle_deg - 90)  # start from top
    x = cx + length * math.cos(radians)
    y = cy + length * math.sin(radians)
    draw.line([(cx, cy), (x, y)], fill=color, width=2)

  def _draw_coin(self, canvas: Image.Image) -> None:
    draw = ImageDraw.Draw(canvas)
    box_width = 140
    box_height = 32
    margin = 12
    top_offset = margin + 74 + 10

    x1 = canvas.width - margin
    x0 = x1 - box_width
    y0 = top_offset
    y1 = y0 + box_height

    fill = (234, 188, 76, 240)
    outline = (162, 108, 28, 255)

    draw.rounded_rectangle([x0, y0, x1, y1], radius=8, fill=fill, outline=outline, width=2)
    draw.text((x0 + 12, y0 + 8), "88888888", fill=(84, 52, 10, 255), font=self.font)
