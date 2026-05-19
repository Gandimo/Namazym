from PIL import Image

def analyze_image(path):
    try:
        img = Image.open(path).convert("RGBA")
        print(f"File: {path}")
        print(f"Size: {img.size}")
        
        # Check corner pixels
        w, h = img.size
        corners = [
            (0, 0), (w-1, 0), (0, h-1), (w-1, h-1)
        ]
        for c in corners:
            print(f"Corner {c}: {img.getpixel(c)}")
            
        # Get some center pixels
        print(f"Center pixel: {img.getpixel((w//2, h//2))}")
        
        # Count non-white/black pixels to check color diversity
        colors = img.getcolors(maxcolors=w*h)
        if colors:
            print(f"Unique colors: len={len(colors)}")
            # show top 5 colors
            colors.sort(key=lambda x: x[0], reverse=True)
            print("Top 5 colors:")
            for count, color in colors[:5]:
                print(f"  {count}: {color}")
        else:
            print("Too many colors to count easily, which means it's a real color image.")
            
    except Exception as e:
        print(f"Error: {e}")

analyze_image('src/namazym/assets/hero/hero-sunrise-mosque-clean-fallback.png')
analyze_image('src/namazym/assets/hero/hero-sunrise-mosque-3d-transparent.png')
