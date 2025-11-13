#!/usr/bin/env python3
"""
Simple Icon Generator for Chrome Extension
Creates placeholder icons using PIL/Pillow
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
except ImportError:
    print("❌ Pillow library not found.")
    print("Install it with: pip3 install Pillow")
    print("\nAlternatively, open icons/generate-icons.html in your browser")
    exit(1)

def create_icon(size):
    """Create a simple gradient icon with stock chart symbol"""
    # Create image with transparency
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw circle background with gradient (simplified - use solid color)
    center = size // 2
    radius = int(size * 0.47)

    # Purple gradient background (using solid color for simplicity)
    for i in range(radius, 0, -1):
        alpha = int(255 * (i / radius))
        color = (102, 126, 234, alpha)  # Purple color
        draw.ellipse([center-i, center-i, center+i, center+i], fill=color)

    # Draw simple stock chart line
    scale = size / 128
    points = [
        (int(25*scale), int(75*scale)),
        (int(45*scale), int(60*scale)),
        (int(65*scale), int(45*scale)),
        (int(85*scale), int(35*scale)),
        (int(103*scale), int(30*scale))
    ]

    # Draw line chart
    line_width = max(2, int(3 * scale))
    draw.line(points, fill=(72, 187, 120, 255), width=line_width)

    # Draw points
    point_radius = max(2, int(3 * scale))
    for x, y in points[1:3]:
        draw.ellipse([x-point_radius, y-point_radius, x+point_radius, y+point_radius],
                     fill=(255, 255, 255, 255))

    # Draw arrow
    arrow_y = int(85 * scale)
    arrow_width = max(2, int(3 * scale))
    draw.line([(int(70*scale), arrow_y), (int(90*scale), arrow_y)],
              fill=(255, 255, 255, 255), width=arrow_width)

    # Arrow head
    arrow_size = max(3, int(5 * scale))
    draw.polygon([
        (int(90*scale), arrow_y),
        (int(85*scale), arrow_y - arrow_size),
        (int(85*scale), arrow_y + arrow_size)
    ], fill=(255, 255, 255, 255))

    return img

def main():
    sizes = [16, 32, 48, 128]
    script_dir = os.path.dirname(os.path.abspath(__file__))

    print("📦 Generating extension icons...\n")

    for size in sizes:
        icon = create_icon(size)
        filepath = os.path.join(script_dir, f'icon{size}.png')
        icon.save(filepath, 'PNG')
        print(f"✓ Created icon{size}.png")

    print("\n✅ All icons generated successfully!")

if __name__ == '__main__':
    main()
