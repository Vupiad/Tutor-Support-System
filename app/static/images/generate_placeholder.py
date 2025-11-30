"""
Generate a placeholder image for HCMUT building on login page.
This script creates a simple blue placeholder image.
Replace this with an actual HCMUT building photo for production.
"""

import os
from PIL import Image, ImageDraw, ImageFont

def create_placeholder_image(filename='hcmut_building.png', width=800, height=600):
    """
    Create a placeholder image with HCMUT branding colors.
    
    Args:
        filename: Output filename (should be .png)
        width: Image width in pixels
        height: Image height in pixels
    """
    # Create a new image with HCMUT blue gradient-like background
    img = Image.new('RGB', (width, height), color=(102, 126, 234))
    draw = ImageDraw.Draw(img)
    
    # Add some decorative elements
    # Draw a lighter rectangle in center
    rect_left = width // 4
    rect_top = height // 4
    rect_right = width - width // 4
    rect_bottom = height - height // 4
    
    draw.rectangle([rect_left, rect_top, rect_right, rect_bottom], fill=(118, 75, 162))
    
    # Add text
    try:
        # Try to use a larger font if available
        font = ImageFont.truetype("arial.ttf", 40)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    # Draw placeholder text
    text = "HCMUT BUILDING"
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    
    x = (width - text_width) // 2
    y = (height - text_height) // 2
    
    draw.text((x, y), text, fill=(255, 255, 255), font=font)
    
    # Add subtext
    try:
        font_small = ImageFont.truetype("arial.ttf", 20)
    except:
        font_small = ImageFont.load_default()
    
    subtext = "Replace with actual building image"
    sub_bbox = draw.textbbox((0, 0), subtext, font=font_small)
    sub_width = sub_bbox[2] - sub_bbox[0]
    
    sub_x = (width - sub_width) // 2
    sub_y = y + text_height + 20
    
    draw.text((sub_x, sub_y), subtext, fill=(200, 200, 200), font=font_small)
    
    # Save the image
    img.save(filename)
    print(f"✓ Placeholder image created: {filename}")
    print(f"  Dimensions: {width}x{height}px")
    print(f"  Replace this with an actual HCMUT building photo for production use.")


if __name__ == '__main__':
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, 'hcmut_building.png')
    
    # Create placeholder if it doesn't exist
    if not os.path.exists(output_path):
        try:
            create_placeholder_image(output_path)
        except ImportError:
            print("Error: PIL (Pillow) not installed.")
            print("Install it with: pip install Pillow")
            print("\nAlternatively, manually add an image file:")
            print(f"  - Save an HCMUT building image as: {output_path}")
            print("  - Supported formats: PNG, JPG")
            print("  - Recommended size: 800x600px or larger")
    else:
        print(f"Image already exists: {output_path}")
