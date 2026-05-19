from PIL import Image

img = Image.open('fajr_extracted_1.png').convert('RGBA')
w, h = img.size

corners = [
    (0, 0),
    (w-1, 0),
    (0, h-1),
    (w-1, h-1)
]

print(f"Dimensions: {w}x{h}")
for i, c in enumerate(corners):
    r,g,b,a = img.getpixel(c)
    print(f"Corner {i}: R={r} G={g} B={b} A={a}")
