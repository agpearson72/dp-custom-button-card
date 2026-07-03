# DP Custom Button Card

A high-fidelity, neumorphic Lovelace card for [Home Assistant](https://www.home-assistant.io/) with dynamic color-reactive glow, Twinkly effect/palette blending, animated weather effects, climate-aware tinting, an animated fireplace flame glow, and a fan-speed spin animation.

Unlike the original `custom:button-card` template project this was converted from, DP Custom Button Card is a **standalone custom card** (`custom:dp-custom-button-card`) — no `custom:button-card` dependency, no YAML templates, no build step. Just one JS file.

## Card Types

| `card_type` | Description |
|---|---|
| `standard` (default) | Neumorphic button with dynamic glow, icon/picture, badge, state dot, and Twinkly-aware color matching |
| `weather` | Adds animated rain drops, puddle/ripple effects, and automatic day/night icon switching |
| `climate` | Large temperature readout, setpoint/humidity/mode footer, and HVAC-action color tinting |
| `fireplace` | Animated flame glow with flicker, and high/low/no-heat state detection |
| `fan` | Speed-based icon spin animation with percentage/speed labels |

## Prerequisites

- [Home Assistant](https://www.home-assistant.io/) with the Lovelace UI
- [HACS](https://hacs.xyz/) (optional — manual installation is also supported)

## Installation

### Via HACS

1. Open HACS in your Home Assistant instance
2. Click the **⋮** menu (top right) → **Custom repositories**
3. Add this repository URL:
   ```
   https://github.com/agpearson72/dp-custom-button-card
   ```
4. Find **DP Custom Button Card** in the HACS store and click **Download**
5. Go to **Settings → Dashboards → ⋮ → Resources** and confirm `dp-custom-button-card.js` was added automatically as a **JavaScript Module**. If it wasn't, add it manually:
   - URL: `/hacsfiles/dp-custom-button-card/dp-custom-button-card.js`
   - Type: **JavaScript Module**
6. Refresh your browser (hard refresh, e.g. Ctrl+Shift+R)

### Manual Installation

1. Download `dist/dp-custom-button-card.js` from the latest release
2. Copy it to `config/www/dp-custom-button-card.js`
3. Add it as a resource in **Settings → Dashboards → ⋮ → Resources**:
   - URL: `/local/dp-custom-button-card.js`
   - Type: **JavaScript Module**
4. Refresh your browser

## Quick Start

```yaml
type: custom:dp-custom-button-card
entity: light.living_room
name: Living Room
```

### Weather Card

```yaml
type: custom:dp-custom-button-card
card_type: weather
entity: weather.home
name: Weather
variables:
  weather_condition_entity: weather.home
  weather_rain_entity: sensor.rain_gauge
```

### Climate / Thermostat Card

```yaml
type: custom:dp-custom-button-card
card_type: climate
entity: climate.living_room
name: Thermostat
variables:
  show_setpoint: true
  show_humidity: true
```

> **Why `card_type` and not `type`?** Home Assistant reserves the top-level `type: custom:dp-custom-button-card` key to select the custom element itself, and passes your whole config — including that literal string — into the card. So the card can't reuse `type` internally for its own `standard`/`weather`/`climate`/`fireplace`/`fan` variant; it uses `card_type` instead.

### Fireplace Card

```yaml
type: custom:dp-custom-button-card
card_type: fireplace
entity: switch.fireplace
name: Fireplace
```

The flame glow and label ("High"/"Low"/"No Heat") are driven by matching the entity's state (or `fireplace_attr`/`preset_mode`/`flame`/`level` attribute) against `fireplace_high_states`/`fireplace_low_states`/`fireplace_noheat_states`.

### Fan Card

```yaml
type: custom:dp-custom-button-card
card_type: fan
entity: fan.bedroom
name: Bedroom Fan
```

By default, fan cards hide the entity picture and state row and show a speed label instead (percentage, or a mapped label from `fan_speed_labels`), and tapping calls `fan.toggle` on the entity (or `fan_control_entity`, if set) unless you supply your own `tap_action`.

## Configuration Reference

### Top-Level Options

| Option | Default | Description |
|---|---|---|
| `entity` | *(required, unless `weather_condition_entity` is set)* | Entity ID to render |
| `card_type` | `standard` | Card variant: `standard`, `weather`, `climate`, `fireplace`, or `fan` (not to be confused with Lovelace's own `type: custom:dp-custom-button-card`) |
| `name` | entity's `friendly_name` | Title text |
| `label` | `''` | Small caption text under the main content |
| `show_label` | `true` | Show/hide the `label` |
| `show_state` | `true` | Show/hide the state/subtitle row (`standard` type only) |
| `show_entity_picture` | `true` | Whether to resolve and show an entity picture |
| `entity_picture` | *(from entity)* | Force a specific picture URL |
| `icon` | *(auto)* | Force a specific icon |
| `aspect_ratio` | `1/1` | Card aspect ratio |
| `size` | `28px` | Icon/picture size (standard & weather) |
| `tap_action` | `{ action: 'toggle' }` | Action on tap — dispatched as a standard `hass-action` event |
| `hold_action` | `{ action: 'more-info' }` | Action on hold |
| `hold_time` | `500` | Milliseconds the button must be pressed before it counts as a hold instead of a tap |
| `variables` | *(see below)* | Card-specific variables |
| `twinkly_effect_map` | *(see below)* | Map of Twinkly effect name → solid glow color |
| `twinkly_effect_palettes` | *(see below)* | Map of Twinkly effect name → multi-color palette array |
| `styles` | `{}` | Per-element CSS overrides (see [Style Overrides](#style-overrides)) |
| `extra_styles` | `''` | Raw CSS injected into the card's `<style>` block |

Any string value anywhere in the config (including inside `variables`) may be a `[[[ ]]]` JS template, evaluated with `entity`, `states`, `hass`, `variables`, `user`, and `config` in scope — the same convention used by `custom:button-card`:

```yaml
variables:
  badge: "[[[ return states['sensor.open_windows'].state > 0 ? states['sensor.open_windows'].state : '' ]]]"
```

### `variables` — Base (all types)

| Variable | Default | Description |
|---|---|---|
| `accent` | `var(--accent-color)` | Accent color for glow and active states |
| `picture` | `null` | Entity picture URL |
| `subtitle` | `''` | Static state-row text (overrides auto-generated text) |
| `badge` | `''` | Badge text shown in the top-right corner |
| `show_state_dot` | `false` | Show a colored status indicator dot |
| `icon_name` | `null` | Force a specific icon (overrides entity icon) |
| `icon_on` / `icon_off` | `null` | Icons for active/inactive states |
| `icon_align` | `center` | Icon horizontal alignment: `center`, `left`, or `right` |
| `icon_color_matches_light` | `true` | Match icon color to a light's RGB/HS/color-temp |
| `show_gloss` | `false` | Show a top gloss highlight layer |
| `glow_for_non_lights` | `true` | Show glow for non-light entities when active |
| `glow_non_light_color` | `var(--accent-color)` | Glow color for non-light entities |
| `glow_non_light_opacity` | `0.35` | Glow opacity for non-light entities |
| `glow_active_states` | `on,open,opening,closing,playing,heating,cooling` | Comma-separated states that activate the glow |
| `glow_origin_x` / `glow_origin_y` | `50` / `88` | Glow radial gradient origin (%) |
| `glow_radius_x` / `glow_radius_y` | `120` / `90` | Glow radial gradient radius (%) |
| `glow_falloff` | `65` | Glow fade-out distance (%) |
| `twinkly_members` | `[]` | Entity IDs to check for Twinkly group color/effect detection |
| `twinkly_multi_mode` | `blend` | How to render multi-color palettes (`blend`) |
| `icon_size_css` | `clamp(18px, 5.5vw, 26px)` | Icon size (climate type) |
| `name_font_css` | `14px` | Name font size |
| `state_font_css` | `12px` | State/subtitle font size |
| `label_font_css` | `11px` | Label font size |
| `temp_font_css` | `clamp(20px, 7.0vw, 38px)` | Temperature readout font size (climate) |
| `set_font_css` | `clamp(10px, 2.8vw, 14px)` | Setpoint/footer font size (climate) |
| `sub_font_css` | `clamp(10px, 2.4vw, 13px)` | Sub-footer font size (climate) |

### `variables` — `weather` Type

| Variable | Default | Description |
|---|---|---|
| `weather_icon` | `''` | Force a specific weather icon |
| `weather_condition_entity` | `''` | Entity ID to read the weather condition from |
| `weather_precip_entity` | `''` | Precipitation sensor entity ID (used as icon fallback) |
| `weather_fallback_icon` | `mdi:weather-partly-cloudy` | Fallback icon when condition can't be resolved |
| `weather_use_daynight` | `true` | Switch icons for day/night based on `sun.sun` |
| `weather_rain_enabled` | `false` | Force the rain animation on |
| `weather_rain_entity` | `''` | Entity that triggers rain when active/numeric > 0 |
| `weather_rain_color` | `#4fc3f7` | Rain drop and puddle color |
| `weather_puddle_height` | `6` | Puddle height (%) |
| `weather_rain_drops` | `16` | Number of rain drops |
| `weather_rain_speed` | `1.2` | Rain animation speed multiplier |
| `weather_disable_base_glow` | `true` | Hide the base glow layer for weather cards |

### `variables` — `climate` Type

| Variable | Default | Description |
|---|---|---|
| `ambient_sensor` | `null` | Separate temperature sensor entity ID (overrides `current_temperature`) |
| `show_setpoint` | `true` | Show target temperature in the footer |
| `show_humidity` | `false` | Show humidity in the footer |
| `show_mode` | `false` | Show the HVAC state in the footer (only if `show_humidity` is off) |
| `heat_color` | `#ff7a3d` | Tint/icon color while heating |
| `cool_color` | `#3b82f6` | Tint/icon color while cooling |
| `auto_color` | `#a855f7` | Tint/icon color in auto mode |
| `fan_color` | `#22c55e` | Tint/icon color in fan mode |
| `dry_color` | `#f59e0b` | Tint/icon color in dry mode |
| `idle_color` | `rgba(255,255,255,0.06)` | Background tint when idle |
| `off_color` | `rgba(255,255,255,0.04)` | Background tint when off |
| `unavailable_color` | `#777` | Background tint when unavailable |
| `bg_tint_alpha` | `0.18` | Background tint opacity |

### `variables` — `fireplace` Type

| Variable | Default | Description |
|---|---|---|
| `fireplace_attr` | `null` | Attribute to read the flame level from (falls back to `preset_mode`, `flame`, `level`, then entity state) |
| `fireplace_high_states` | `[high, hi, max, on_high, on hi, 3]` | Values considered "High" |
| `fireplace_low_states` | `[low, lo, min, on_low, on low, 2]` | Values considered "Low" |
| `fireplace_noheat_states` | `[on, 1]` | Values considered "No Heat" (flame visible, no heat output) |
| `fireplace_high_color` | `#ff3b3b` | Icon/glow color for "High" |
| `fireplace_low_color` | `#ff3b3b` | Icon/glow color for "Low" |
| `fireplace_noheat_color` | `#ff9900` | Icon/glow color for "No Heat" |
| `fireplace_full_glow` | `true` | Layer a flat background tint under the moving flame glow |
| `fireplace_glow_alpha` | `0.26` | Opacity of the flat background tint (when `fireplace_full_glow` is on) |
| `flame_enabled` | `true` | Enable the flame move/flicker animation |
| `flame_speed` | `2.8s` | Flame movement animation duration |
| `flame_flicker_speed` | `1.3s` | Flame flicker animation duration |
| `flame_move_y_min` / `flame_move_y_max` | `0%` / `-4%` | Vertical translation range of the flame animation |
| `flame_scale_min` / `flame_scale_max` | `1` / `0.95` | Vertical scale range of the flame animation |
| `flame_flicker_min` / `flame_flicker_max` | `0.92` / `1.08` | Brightness range of the flicker animation |

### `variables` — `fan` Type

| Variable | Default | Description |
|---|---|---|
| `fan_control_entity` | `false` | Override entity ID used for the tap-to-toggle action (defaults to `entity`) |
| `fan_on_color` | `rgb(34,197,94)` | Icon color when on |
| `fan_off_color` | `var(--secondary-text-color)` | Icon color when off |
| `fan_unavailable_color` | `rgb(255,0,0)` | Icon color when unavailable |
| `fan_speed_labels` | `{33: Low, 66: Medium, 100: High}` | Map of percentage → label shown in place of the raw `%` |
| `fan_spin_low` / `fan_spin_med` / `fan_spin_high` | `2.3s` / `1.2s` / `.5s` | Icon spin duration at low/medium/high speed |
| `fan_low_threshold` / `fan_med_threshold` | `33` / `66` | Percentage thresholds for low/medium speed tiers |
| `fan_value_attr` | `auto` | Attribute to read speed from: `auto`, `percentage`, `speed`, or `preset_mode` |
| `fan_glow_color` | `#22c55e` | Glow color while on |
| `fan_glow_alpha` | `0.3` | Glow opacity while on |

By default `show_entity_picture` is `false` and `show_state` is `false` for `fan` cards (override either explicitly if you want them back).

### Twinkly Effect Color Maps

`twinkly_effect_map` and `twinkly_effect_palettes` are **top-level config keys** (not under `variables`). Supplying either merges your entries on top of the built-in defaults (`carnival`, `rainbowvortex`, `rainbowpetri`, `plasma`, `3d flag`, `us bounce`, `usa flag`, `vertical flag`, `unicorn sun`, `glow`, `bright twinkle`):

```yaml
type: custom:dp-custom-button-card
entity: light.twinkly_tree
variables:
  twinkly_members:
    - light.twinkly_tree
twinkly_effect_map:
  my_custom_effect: "#ff0000"
twinkly_effect_palettes:
  my_custom_effect: ["#ff0000", "#00ff00", "#0000ff"]
```

The active entity's (or any `twinkly_members` entity's) `effect`/`movie`/`playlist` attribute is matched against these maps (case-insensitive substring match) to color the glow. `twinkly_effect_map` drives the solid under-glow; `twinkly_effect_palettes` drives the multi-color blended glow when `twinkly_multi_mode: blend`.

### Style Overrides

`styles` follows the same shape as `custom:button-card`'s `styles:` block — each key is an array of single-property objects applied as inline CSS to that element:

```yaml
styles:
  card:
    - border-radius: 12px
  name:
    - font-weight: bold
    - color: white
```

Supported keys: `card`, `icon`, `img_cell`, `entity_picture`, `name`, `state`, `label`, `badge`.

## Layout Tips

These cards look best in a grid layout:

```yaml
type: grid
columns: 3
square: true
cards:
  - type: custom:dp-custom-button-card
    entity: light.kitchen
    name: Kitchen
  - type: custom:dp-custom-button-card
    entity: light.bedroom
    name: Bedroom
  - type: custom:dp-custom-button-card
    entity: switch.tv
    name: TV
    icon: mdi:television
```

## Development

`dist/dp-custom-button-card.js` is the entire card — there is no build step or template source file. Edit it directly and bump the version comment at the top of the file.

### Project Structure

```
├── dist/
│   └── dp-custom-button-card.js   ← the card (hand-edited, no build step)
└── hacs.json                      ← HACS manifest
```

## Troubleshooting

**"Custom element doesn't exist: dp-custom-button-card"**

1. Confirm the resource is registered under **Settings → Dashboards → ⋮ → Resources** with type **JavaScript Module**
2. Hard-refresh your browser (Ctrl+Shift+R) to bypass cached JS
3. Check the browser console (F12) for template compile/eval errors logged as `DP Custom Button Card: ...`

**Weather rain not animating?**

Make sure `weather_rain_entity` points to an entity whose state is a positive number, or one of `on`/`wet`/`raining`/`rain`/`true`/`detected` — or set `weather_rain_enabled: true` to force it on.
