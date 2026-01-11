import os
from PIL import Image, ImageOps

def process_sprite(input_path, output_dir, colors):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    try:
        # Load base image and convert to RGBA
        base_img = Image.open(input_path).convert("RGBA")
        
        # 1. Remove Magenta Background
        datas = base_img.getdata()
        newData = []
        bg_color = (255, 0, 255)
        tolerance = 50 

        for item in datas:
             # Check for magenta background
            if (abs(item[0] - bg_color[0]) < tolerance and
                abs(item[1] - bg_color[1]) < tolerance and
                abs(item[2] - bg_color[2]) < tolerance):
                newData.append((0, 0, 0, 0)) # Fully transparent
            else:
                newData.append(item)
        
        base_img.putdata(newData)
        
        # Save base transparent for debugging
        # base_img.save(os.path.join(output_dir, "horse_base.png"))

        # 2. Generate Color Variations
        # We will use "colorize" or "multiply" logic
        # Since base is grayscale:
        # Gray pixels * Color = Tinted Pixel
        
        gray_img = base_img.convert("L") # Create logic mask? No, just use grayscale version
        
        for color_name, color_hex in colors.items():
            # Parse hex
            r = int(color_hex[1:3], 16)
            g = int(color_hex[3:5], 16)
            b = int(color_hex[5:7], 16)
            
            # Create a solid color image
            color_layer = Image.new("RGBA", base_img.size, (r, g, b, 255))
            
            # Composite:
            # We want to keep the black/dark outlines and white parts become colored.
            # Multiply: base * color. White(1.0) * Color = Color. Black(0.0) * Color = Black.
            # This works best for grayscale inputs.
            
            # However, if we just multiply, the transparent area needs to stay transparent.
            
            # Method:
            # 1. Take base image
            # 2. Where alpha > 0, apply multiply
            
            # Let's use ImageChops.multiply
            from PIL import ImageChops
            
            # But multiply expects two images.
            # If base has transparency, we need to be careful.
            
            # Better approach for "Tinting" white/gray sprites:
            # result = base * color
            
            # Separate alpha
            r_c, g_c, b_c, a = base_img.split()
            base_rgb = Image.merge("RGB", (r_c, g_c, b_c))
            
            # Multiply color over base RGB
            # Note: For this to work, the "white" parts of the horse should be white (255).
            # The "gray" shading will become darker shades of the color.
            # The "black" outlines will stay black.
            
            tinted_rgb = ImageChops.multiply(base_rgb, Image.new("RGB", base_img.size, (r, g, b)))
            
            # Merge back with alpha
            final_img = Image.merge("RGBA", (*tinted_rgb.split(), a))
            
            out_name = f"horse_{color_name.lower()}.png"
            final_img.save(os.path.join(output_dir, out_name))
            print(f"Generated {out_name}")

    except Exception as e:
        print(f"Error: {e}")

def main():
    base_sprite = "raw_assets/horse_base.png"
    output_dir = "assets"
    
    # Rainbow Colors (Standard CSS names or Hex)
    # Red, Orange, Yellow, Green, Blue, Indigo, Purple
    colors = {
        "Red": "#FF0000",
        "Orange": "#FF7F00",
        "Yellow": "#FFFF00",
        "Green": "#00FF00",
        "Blue": "#0000FF",
        "Indigo": "#4B0082",
        "Purple": "#9400D3"
    }
    
    process_sprite(base_sprite, output_dir, colors)

if __name__ == "__main__":
    main()
