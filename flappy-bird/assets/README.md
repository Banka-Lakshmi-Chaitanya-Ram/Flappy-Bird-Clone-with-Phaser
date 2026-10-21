# Flappy Bird Assets Documentation

This directory contains the graphical assets used by the Phaser 3 Flappy Bird clone game.

## Asset Roster

| Asset File | Resolution | Description | Origin |
|------------|------------|-------------|--------|
| `bird.png` | 17 × 12 px | Red/yellow pixel-art flappy bird sprite | Codédex tutorial assets |
| `background.png` | 900 × 504 px | Daytime city skyline with clouds and green hills | Codédex tutorial assets |
| `ground.png` | 932 × 66 px | Ground/road platform surface with repeating pattern | Codédex tutorial assets |
| `pipe.png` | 32 × 500 px | Green retro arcade obstacle column | Codédex tutorial assets |
| `road.png` | 932 × 66 px | Exact copy of `ground.png` for tutorial cross-compatibility | Codédex tutorial assets |
| `column.png` | 32 × 500 px | Exact copy of `pipe.png` for tutorial cross-compatibility | Codédex tutorial assets |

## Replacing Assets
To customize the game appearance with your own custom sprites:
1. Replace `bird.png` with any PNG image (recommended dimensions: ~17x12 to 34x24 px).
2. Replace `pipe.png` with your desired vertical obstacle sprite (recommended width: 32 to 52 px).
3. Replace `background.png` with any landscape background graphic (recommended height: ≥ 500 px).
4. Replace `ground.png` with any repeating ground tile (recommended height: ~60 to 70 px).

All textures are automatically loaded locally by Phaser 3 from `assets/` relative to the game directory.
