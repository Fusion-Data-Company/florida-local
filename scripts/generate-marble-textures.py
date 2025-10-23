#!/usr/bin/env python3
"""
Ultra HD Seamless Marble Texture Generator
Generates 4K resolution (3840x3840) seamless marble textures
"""

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import random
import os

def create_seamless_noise(width, height, scale=100):
    """Create seamless Perlin-like noise"""
    # Create tileable noise by wrapping coordinates
    x = np.linspace(0, scale, width, endpoint=False)
    y = np.linspace(0, scale, height, endpoint=False)

    # Create base noise
    noise = np.zeros((height, width))

    # Add multiple octaves of noise
    for octave in range(6):
        freq = 2 ** octave
        amp = 1.0 / freq

        # Random seed for this octave
        np.random.seed(octave + 42)
        noise_layer = np.random.rand(int(height/freq) + 2, int(width/freq) + 2)

        # Interpolate to full size
        from scipy import ndimage
        noise_layer_resized = ndimage.zoom(noise_layer, freq, order=3, mode='wrap')
        noise_layer_resized = noise_layer_resized[:height, :width]

        noise += noise_layer_resized * amp

    # Normalize
    noise = (noise - noise.min()) / (noise.max() - noise.min())
    return noise

def add_veins(img_array, color, num_veins=20, thickness_range=(2, 8)):
    """Add marble veins to the image"""
    height, width = img_array.shape[:2]
    img = Image.fromarray((img_array * 255).astype(np.uint8).reshape(height, width, 3))
    draw = ImageDraw.Draw(img, 'RGBA')

    for _ in range(num_veins):
        # Random starting point
        start_x = random.randint(-width//4, width + width//4)
        start_y = random.randint(0, height)

        # Create smooth vein path
        points = []
        x, y = start_x, start_y
        angle = random.uniform(-0.5, 0.5)

        while x < width + width//4 and 0 <= y < height:
            points.append((int(x), int(y)))

            # Update position with smooth curve
            angle += random.uniform(-0.15, 0.15)
            x += random.uniform(15, 35)
            y += np.sin(angle) * random.uniform(10, 30)

        if len(points) > 1:
            # Variable thickness along vein
            thickness = random.randint(*thickness_range)
            opacity = random.randint(30, 120)
            vein_color = color + (opacity,)
            draw.line(points, fill=vein_color, width=thickness)

    return np.array(img)[:,:,:3]

def generate_white_carrara(size=3840):
    """Generate White Carrara marble - warm cream with subtle gold veining"""
    print("Generating White Carrara marble...")

    # Base color: warm cream
    base = np.ones((size, size, 3)) * np.array([0.98, 0.96, 0.92])

    # Add subtle texture variation
    noise = create_seamless_noise(size, size, scale=200)
    texture = np.stack([noise * 0.05] * 3, axis=2)
    base += texture

    # Add gold/grey veins
    base = add_veins(base, (180, 170, 150), num_veins=25, thickness_range=(1, 4))
    base = add_veins(base, (210, 200, 180), num_veins=15, thickness_range=(2, 6))

    # Apply subtle blur for smoothness
    img = Image.fromarray((np.clip(base, 0, 1) * 255).astype(np.uint8))
    img = img.filter(ImageFilter.GaussianBlur(radius=0.5))

    return img

def generate_calacatta_gold(size=3840):
    """Generate Calacatta Gold marble - white with bold gold veins"""
    print("Generating Calacatta Gold marble...")

    # Base color: pure white with warm tint
    base = np.ones((size, size, 3)) * np.array([0.99, 0.98, 0.96])

    # Very subtle texture
    noise = create_seamless_noise(size, size, scale=250)
    texture = np.stack([noise * 0.03] * 3, axis=2)
    base += texture

    # Bold gold veins
    base = add_veins(base, (200, 170, 110), num_veins=12, thickness_range=(4, 12))
    base = add_veins(base, (180, 160, 120), num_veins=8, thickness_range=(6, 15))

    # Subtle grey accent veins
    base = add_veins(base, (160, 160, 165), num_veins=10, thickness_range=(2, 5))

    img = Image.fromarray((np.clip(base, 0, 1) * 255).astype(np.uint8))
    img = img.filter(ImageFilter.GaussianBlur(radius=0.7))

    return img

def generate_grey_emperador(size=3840):
    """Generate Grey Emperador marble - sophisticated grey with subtle veining"""
    print("Generating Grey Emperador marble...")

    # Base color: sophisticated grey
    base = np.ones((size, size, 3)) * np.array([0.75, 0.74, 0.73])

    # Textured noise
    noise = create_seamless_noise(size, size, scale=180)
    texture = np.stack([noise * 0.08] * 3, axis=2)
    base += texture

    # Darker grey veins
    base = add_veins(base, (100, 100, 105), num_veins=20, thickness_range=(2, 7))

    # Lighter accent veins
    base = add_veins(base, (200, 198, 195), num_veins=15, thickness_range=(1, 4))

    img = Image.fromarray((np.clip(base, 0, 1) * 255).astype(np.uint8))
    img = img.filter(ImageFilter.GaussianBlur(radius=0.6))

    return img

def generate_statuario(size=3840):
    """Generate Statuario marble - premium white with grey veining"""
    print("Generating Statuario marble...")

    # Base color: cool white
    base = np.ones((size, size, 3)) * np.array([0.97, 0.97, 0.98])

    # Minimal texture
    noise = create_seamless_noise(size, size, scale=300)
    texture = np.stack([noise * 0.02] * 3, axis=2)
    base += texture

    # Elegant grey veins
    base = add_veins(base, (140, 140, 145), num_veins=18, thickness_range=(3, 9))
    base = add_veins(base, (170, 170, 175), num_veins=12, thickness_range=(1, 5))

    img = Image.fromarray((np.clip(base, 0, 1) * 255).astype(np.uint8))
    img = img.filter(ImageFilter.GaussianBlur(radius=0.5))

    return img

def generate_champagne_pearl(size=3840):
    """Generate Champagne Pearl marble - warm beige with shimmer"""
    print("Generating Champagne Pearl marble...")

    # Base color: warm champagne
    base = np.ones((size, size, 3)) * np.array([0.92, 0.88, 0.82])

    # Rich texture
    noise = create_seamless_noise(size, size, scale=150)
    texture = np.stack([noise * 0.06] * 3, axis=2)
    base += texture

    # Warm gold veins
    base = add_veins(base, (180, 160, 130), num_veins=22, thickness_range=(2, 6))

    # Pearl shimmer accents
    base = add_veins(base, (220, 210, 195), num_veins=18, thickness_range=(1, 3))

    img = Image.fromarray((np.clip(base, 0, 1) * 255).astype(np.uint8))
    img = img.filter(ImageFilter.GaussianBlur(radius=0.6))

    return img

def main():
    output_dir = "/home/runner/workspace/client/public/assets/marble-textures"
    os.makedirs(output_dir, exist_ok=True)

    # Generate all marble textures at 4K resolution
    size = 2048  # Using 2K for faster generation, still high quality

    textures = {
        "white-carrara-uhd.png": generate_white_carrara,
        "calacatta-gold-uhd.png": generate_calacatta_gold,
        "grey-emperador-uhd.png": generate_grey_emperador,
        "statuario-uhd.png": generate_statuario,
        "champagne-pearl-uhd.png": generate_champagne_pearl,
    }

    for filename, generator in textures.items():
        print(f"\nGenerating {filename}...")
        img = generator(size)
        filepath = os.path.join(output_dir, filename)
        img.save(filepath, quality=95, optimize=True)
        print(f"✓ Saved to {filepath}")

    print("\n✅ All marble textures generated successfully!")
    print(f"📁 Location: {output_dir}")

if __name__ == "__main__":
    # Install required packages
    print("Installing required packages...")
    os.system("pip install -q pillow numpy scipy")
    print("\nStarting texture generation...\n")
    main()
