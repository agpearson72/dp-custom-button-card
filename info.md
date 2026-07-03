## Realistic Button Card Templates

Neumorphic button card templates with dynamic color-reactive glow effects for Home Assistant dashboards.

### What's Included

- **realistic_button** — Base template with neumorphic styling, color-matched glow, Twinkly palette support, badges, and state dots
- **realistic_button_weather** — Animated rain drops, puddle ripples, and automatic day/night weather icons
- **realistic_button_climate** — Large temperature display, setpoint/humidity footer, HVAC-action color tinting
- **realistic_button_fireplace** — Animated flame glow with flicker and high/low/no-heat detection
- **realistic_button_fan** — Speed-based spin animation with percentage labels

### Requirements

- [custom:button-card](https://github.com/custom-cards/button-card) (install via HACS)

### Quick Start

After installation, add to your dashboard:

```yaml
button_card_templates: !include realistic_button_templates.yaml
```

Then use any template:

```yaml
type: custom:button-card
entity: light.living_room
template: realistic_button
name: Living Room
```
