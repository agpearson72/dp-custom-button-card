/**
 * DP Custom Button Card
 * A high-fidelity, advanced Home Assistant Lovelace card converted from custom:button-card templates.
 * Supports glow filters, complex light color maps (including Twinkly blends), climate variants, and dynamic CSS rain animations.
 */

class DPCustomButtonCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.entity && !config.weather_condition_entity) {
      throw new Error("You must define an entity.");
    }
    this._config = {
      type: 'standard', // 'standard', 'weather', or 'climate'
      aspect_ratio: '1/1',
      size: '28px',
      ...config,
      variables: {
        accent: 'var(--accent-color)',
        picture: null,
        subtitle: '',
        badge: '',
        show_state_dot: false,
        icon_name: null,
        icon_on: null,
        icon_off: null,
        glow_for_non_lights: true,
        glow_non_light_color: 'var(--accent-color)',
        glow_non_light_opacity: 0.35,
        glow_active_states: 'on,open,opening,closing,playing,heating,cooling',
        glow_origin_x: 50,
        glow_origin_y: 88,
        glow_radius_x: 120,
        glow_radius_y: 90,
        glow_falloff: 65,
        twinkly_members: [],
        twinkly_multi_mode: 'blend',
        icon_color_matches_light: true,
        show_gloss: false,
        // Weather defaults
        weather_icon: '',
        weather_condition_entity: '',
        weather_precip_entity: '',
        weather_fallback_icon: 'mdi:weather-partly-cloudy',
        weather_use_daynight: true,
        weather_rain_enabled: false,
        weather_rain_entity: '',
        weather_rain_color: '#4fc3f7',
        weather_puddle_height: 6,
        weather_rain_drops: 16,
        weather_rain_speed: 1.2,
        weather_disable_base_glow: true,
        // Climate defaults
        ambient_sensor: null,
        show_setpoint: true,
        show_humidity: false,
        show_mode: false,
        heat_color: '#ff7a3d',
        cool_color: '#3b82f6',
        auto_color: '#a855f7',
        fan_color: '#22c55e',
        dry_color: '#f59e0b',
        idle_color: 'rgba(255,255,255,0.06)',
        off_color: 'rgba(255,255,255,0.04)',
        unavailable_color: '#777',
        bg_tint_alpha: 0.18,
        icon_size_css: 'clamp(18px, 5.5vw, 26px)',
        name_font_css: 'clamp(12px, 3.2vw, 16px)',
        temp_font_css: 'clamp(20px, 7.0vw, 38px)',
        set_font_css: 'clamp(10px, 2.8vw, 14px)',
        sub_font_css: 'clamp(10px, 2.4vw, 13px)',
        ...(config.variables || {})
      },
      twinkly_effect_map: {
        carnival: '#ff7a3d',
        rainbowvortex: '#a855f7',
        rainbowpetri: '#ec4899',
        plasma: '#f472b6',
        '3d flag': '#60a5fa',
        'us bounce': '#ef4444',
        'usa flag': '#ef4444',
        'vertical flag': '#ef4444',
        'unicorn sun': '#f9a8d4',
        glow: '#ffd166',
        'bright twinkle': '#cfe8ff',
        ...(config.twinkly_effect_map || {})
      },
      twinkly_effect_palettes: {
        carnival: ['#ff4d4d', '#ffd166', '#32d17d', '#6aa8ff', '#a855f7'],
        rainbowvortex: ['#ff4d4d', '#ff9900', '#ffee55', '#32d17d', '#6aa8ff', '#7c3aed', '#ec4899'],
        rainbowpetri: ['#f472b6', '#ec4899', '#a855f7', '#6aa8ff'],
        plasma: ['#ff79c6', '#f472b6', '#e879f9'],
        '3d flag': ['#ef4444', '#ffffff', '#3b82f6'],
        'us bounce': ['#ef4444', '#ffffff', '#3b82f6'],
        'usa flag': ['#ef4444', '#ffffff', '#3b82f6'],
        'vertical flag': ['#ef4444', '#ffffff', '#3b82f6'],
        'unicorn sun': ['#f9a8d4', '#ffd7a0', '#cfe8ff'],
        glow: ['#ffd166', '#fff2cc'],
        'bright twinkle': ['#cfe8ff', '#ffffff'],
        ...(config.twinkly_effect_palettes || {})
      }
    };
  }

  set hass(hass) {
    this._hass = hass;
    const entityId = this._config.entity;
    const entity = entityId ? hass.states[entityId] : null;

    if (entityId && !entity && this._config.type !== 'weather') {
      this.shadowRoot.innerHTML = `<ha-card style="color: red; padding: 16px;">Entity not found: ${entityId}</ha-card>`;
      return;
    }

    this.render(entity, hass.states);
  }

  render(entity, states) {
    const config = this._config;
    const vars = config.variables;
    const stateStr = entity ? entity.state : '';
    const active = entity && ['on', 'open', 'playing'].includes(stateStr);

    // --- Dynamic Target Attribute Sourcing (Twinkly Groups / Self) ---
    let targetAttrs = (entity && entity.attributes) ? entity.attributes : {};
    let fallbackList = [];
    if (Array.isArray(vars.twinkly_members) && vars.twinkly_members.length) {
      fallbackList = vars.twinkly_members;
    } else if (Array.isArray(targetAttrs.entity_id)) {
      fallbackList = targetAttrs.entity_id;
    } else if (entity && entity.entity_id) {
      fallbackList = [entity.entity_id];
    }
    for (let i = 0; i < fallbackList.length; i++) {
      let st = states[fallbackList[i]];
      if (st && st.state === 'on') {
        targetAttrs = st.attributes || {};
        break;
      }
    }

    // --- Determine Icon ---
    let icon = 'mdi:lightbulb';
    if (config.type === 'weather') {
      icon = this._getWeatherIcon(entity, states, vars);
    } else {
      if (vars.icon_name) icon = vars.icon_name;
      else if (vars.icon_on || vars.icon_off) {
        const isActive = ['on', 'open', 'playing', 'heating', 'cooling'].includes(stateStr);
        if (isActive && vars.icon_on) icon = vars.icon_on;
        else if (!isActive && vars.icon_off) icon = vars.icon_off;
      } else if (targetAttrs.icon) {
        icon = targetAttrs.icon;
      }
    }

    // --- Determine Icon Color ---
    let iconColor = 'var(--secondary-text-color)';
    if (config.type === 'climate') {
      const hvacAction = String(targetAttrs.hvac_action || '').toLowerCase();
      const hvacMode = String(targetAttrs.hvac_mode || stateStr || '').toLowerCase();
      const combined = hvacAction || hvacMode;
      if (combined.includes('cool')) iconColor = vars.cool_color;
      else if (combined.includes('heat')) iconColor = vars.heat_color;
      else if (combined.includes('auto')) iconColor = vars.auto_color;
      else if (combined.includes('fan')) iconColor = vars.fan_color;
      else if (combined.includes('dry')) iconColor = vars.dry_color;
    } else if (active || stateStr === 'on') {
      if (vars.icon_color_matches_light === false) {
        iconColor = 'inherit';
      } else {
        iconColor = this._computeActiveColor(targetAttrs, vars, config);
      }
    }

    // --- Subtitle / Label Logic ---
    let subtitleText = '';
    if (config.type === 'climate') {
      // Logic for footers/subtitles handled structurally
    } else {
      if (vars.subtitle) subtitleText = vars.subtitle;
      else if (entity) {
        if (targetAttrs.brightness != null) {
          subtitleText = `${Math.round(targetAttrs.brightness / 2.54)}%`;
        } else {
          subtitleText = stateStr === 'on' ? 'On' : stateStr === 'off' ? 'Off' : stateStr.charAt(0).toUpperCase() + stateStr.slice(1);
        }
      }
    }

    // --- Box Shadow Calculation ---
    const boxShadow = active
      ? '12px 12px 24px rgba(0,0,0,0.35), -12px -12px 24px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -8px 16px rgba(255,255,255,0.06)'
      : '8px 8px 16px rgba(0,0,0,0.28), -8px -8px 16px rgba(255,255,255,0.06), inset 0 -6px 12px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.35)';

    // --- Gradients and Borders based on Variant State ---
    let cardBackground = 'var(--ha-card-background, var(--card-background-color))';
    let cardBorder = '1px solid rgba(255,255,255,0.06)';

    if (config.type === 'climate') {
      const hvacAction = String(targetAttrs.hvac_action || '').toLowerCase();
      const hvacMode = String(targetAttrs.hvac_mode || stateStr || '').toLowerCase();
      const s = hvacAction || hvacMode;
      let clr = vars.idle_color;
      if (s.includes('cool')) clr = vars.cool_color;
      else if (s.includes('heat')) clr = vars.heat_color;
      else if (s.includes('auto')) clr = vars.auto_color;
      else if (s.includes('fan')) clr = vars.fan_color;
      else if (s.includes('dry')) clr = vars.dry_color;
      else if (s === 'off') clr = vars.off_color;
      else if (s === 'unavailable') clr = vars.unavailable_color;

      const alpha = Math.max(0, Math.min(1, Number(vars.bg_tint_alpha)));
      let tint = clr;
      if (String(clr).startsWith('#') && clr.length === 7) {
        tint = clr + Math.round(alpha * 255).toString(16).padStart(2, '0');
      }
      cardBackground = `linear-gradient(0deg, ${tint}, transparent 70%), var(--ha-card-background, var(--card-background-color))`;
    } else if (['on', 'open'].includes(stateStr)) {
      cardBackground = `linear-gradient(145deg, ${vars.accent}1A, var(--ha-card-background, var(--card-background-color)))`;
      cardBorder = `1px solid ${vars.accent}66`;
    }

    // --- Core Dynamic Layers (Glows & Special Effects) ---
    const underGlowStyle = this._computeUnderGlow(targetAttrs, vars, config, active);
    const glowStyle = this._computeGlow(entity, targetAttrs, vars, config, stateStr);
    const weatherRainMarkup = (config.type === 'weather') ? this._getWeatherRain(vars, states) : '';

    // --- Compose HTML Grid layouts ---
    let gridLayout = '';
    if (config.type === 'climate') {
      let curTemp = targetAttrs.current_temperature || '--';
      if (vars.ambient_sensor && states[vars.ambient_sensor]) {
        curTemp = states[vars.ambient_sensor].state;
      }
      let setpointMarkup = '';
      if (vars.show_setpoint && targetAttrs.temperature != null) {
        setpointMarkup = `<span class="setpoint">· Target ${targetAttrs.temperature}°</span>`;
      }
      let subMarkup = '';
      if (vars.show_humidity && targetAttrs.current_humidity != null) {
        subMarkup = `RH ${targetAttrs.current_humidity}%`;
      } else if (vars.show_mode) {
        subMarkup = stateStr.toUpperCase();
      }

      gridLayout = `
        <div class="grid-container climate">
          <div class="icon-area"><ha-icon icon="${icon}"></ha-icon></div>
          <div class="badge-area">${vars.badge ? `<span>${vars.badge}</span>` : ''}</div>
          <div class="name-area">${config.name || targetAttrs.friendly_name || 'Climate'}</div>
          <div class="temp-area">${curTemp}°</div>
          <div class="footer-area">${setpointMarkup} <span class="sub-footer">${subMarkup}</span></div>
        </div>
      `;
    } else {
      gridLayout = `
        <div class="grid-container standard">
          <div class="icon-area">
            ${vars.picture ? `<img src="${vars.picture}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;"/>` : `<ha-icon icon="${icon}"></ha-icon>`}
          </div>
          <div class="badge-area">${vars.badge ? `<span>${vars.badge}</span>` : ''}</div>
          <div class="name-area">${config.name || (entity ? entity.attributes.friendly_name : 'Button')}</div>
          <div class="state-area">${subtitleText}</div>
          <div class="indicator-area" style="${vars.show_state_dot ? '' : 'display:none;'}"></div>
        </div>
      `;
    }

    // --- Final Shadow DOM Write ---
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          aspect-ratio: ${config.aspect_ratio};
        }
        ha-card {
          position: relative;
          width: 100%;
          height: 100%;
          padding: 10px;
          border-radius: 22px;
          border: ${cardBorder};
          background: ${cardBackground};
          box-shadow: ${boxShadow};
          transition: box-shadow 0.25s ease, transform 0.08s ease;
          overflow: hidden;
          box-sizing: border-box;
          cursor: pointer;
          user-select: none;
        }
        ha-card:active {
          transform: scale(0.97);
        }
        .grid-container {
          display: grid;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
        }
        .grid-container.standard {
          grid-template-areas: "i badge" "n n" "s s" "l l";
          grid-template-columns: 1fr auto;
          grid-template-rows: auto auto auto 1fr;
        }
        .grid-container.climate {
          grid-template-areas: "i badge" "n n" "temp temp" "footer footer";
          grid-template-columns: 1fr auto;
          grid-template-rows: auto auto auto auto;
        }
        .icon-area { grid-area: i; position: relative; z-index: 3; display: block; opacity: 1; }
        ha-icon {
          --mdc-icon-size: ${config.type === 'climate' ? vars.icon_size_css : config.size};
          color: ${iconColor};
          filter: ${active ? 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))' : 'none'};
        }
        .badge-area {
          grid-area: badge; align-self: start; justify-self: end;
          background: ${vars.badge ? 'var(--accent-color)' : 'transparent'};
          color: var(--text-primary-color, white); border-radius: 999px;
          min-width: 22px; height: 22px; line-height: 22px; text-align: center;
          font-size: 0.75em; box-shadow: 0 2px 6px rgba(0,0,0,0.35); padding: 0 6px;
          display: ${vars.badge ? 'block' : 'none'}; z-index: 4;
        }
        .name-area {
          grid-area: n; margin-top: 8px; font-weight: 400; justify-self: center; text-align: center;
          color: var(--primary-text-color); z-index: 2;
          font-size: ${config.type === 'climate' ? vars.name_font_css : 'inherit'};
        }
        .state-area { grid-area: s; justify-self: center; text-align: center; margin-top: 2px; font-size: 0.82em; opacity: 0.85; color: var(--secondary-text-color); z-index: 2; }
        .temp-area { grid-area: temp; font-size: ${vars.temp_font_css}; line-height: 1; font-weight: 700; letter-spacing: -0.5px; color: var(--primary-text-color); align-self: center; justify-self: center; z-index: 3; }
        .footer-area { grid-area: footer; font-size: ${vars.set_font_css}; opacity: 0.9; color: var(--secondary-text-color); justify-self: center; text-align: center; z-index: 3; }
        .sub-footer { font-size: ${vars.sub_font_css}; block; }
        .indicator-area {
          position: absolute; right: 10px; bottom: 10px; width: 4px; height: 4px; border-radius: 50%;
          box-shadow: 0 0 0 2px var(--ha-card-background, var(--card-background-color));
          background: ${active ? '#2ecc71' : '#ff4d4d'}; z-index: 5;
        }
        
        /* Layer Styling */
        .layer { position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 0; }
        .gloss-layer {
          mix-blend-mode: screen; display: ${vars.show_gloss ? 'block' : 'none'};
          background: linear-gradient(180deg, rgba(255,255,255,${vars.gloss_top_opacity ?? 0.18}) 0%, rgba(255,255,255,${vars.gloss_mid_opacity ?? 0.06}) ${vars.gloss_mid_stop ?? 25}%, transparent ${vars.gloss_break_stop ?? 46}%);
        }
        .underglow-layer {
          background: ${underGlowStyle.bg}; opacity: ${underGlowStyle.opacity}; transition: opacity 0.25s ease;
        }
        .glow-layer {
          background: ${glowStyle.bg}; opacity: ${glowStyle.opacity}; transition: opacity 0.25s ease;
        }

        /* Rain Animation Overlay Engine */
        .rb-rain { position: absolute; inset: 0; border-radius: inherit; pointer-events: none; overflow: hidden; z-index: 0; }
        .rb-puddle {
          position: absolute; left: 0; right: 0; bottom: 0; height: var(--puddle-h, 12%); filter: blur(.6px); z-index: 0;
          background: radial-gradient(60% 140% at 50% 130%, color-mix(in srgb, var(--rb-rain-color, ${vars.weather_rain_color}) 60%, transparent) 0%, transparent 75%), linear-gradient(to top, color-mix(in srgb, var(--rb-rain-color, ${vars.weather_rain_color}) 35%, transparent) 0%, transparent 100%);
        }
        .rb-drop {
          position: absolute; left: var(--x); top: -12%; width: 2px; --drop-h: 12%; height: var(--drop-h); border-radius: 2px; background: var(--rb-rain-color, ${vars.weather_rain_color}); opacity: .9; z-index: 2;
          animation: rb-fall-top var(--dur, 1.1s) linear var(--delay, 0s) infinite;
        }
        .rb-ripple {
          position: absolute; top: calc(100% - var(--puddle-h, 12%)); left: var(--x); transform: translate(-50%, 0); width: 0; height: 0; border-radius: 999px; opacity: 0; mix-blend-mode: screen; z-index: 3;
          border: 2px solid color-mix(in srgb, var(--rb-rain-color, ${vars.weather_rain_color}) 70%, transparent);
          filter: drop-shadow(0 0 2px color-mix(in srgb, var(--rb-rain-color, ${vars.weather_rain_color}) 60%, transparent));
          animation: rb-ring var(--dur, 1.1s) ease-out var(--delay, 0s) infinite;
        }
        @keyframes rb-fall-top {
          0%   { top: -12%; opacity: .5; }
          85%  { opacity: .95; }
          100% { top: calc(100% - var(--puddle-h, 12%) - var(--drop-h, 12%)); }
        }
        @keyframes rb-ring {
          0%   { opacity: .35; width: 8px; height: 4px; }
          70%  { opacity: .20; }
          100% { opacity: 0; width: 28px; height: 12px; }
        }
      </style>
      
      <ha-card id="button-surface" style="--rb-rain-color: ${vars.weather_rain_color}">
        <div class="layer gloss-layer"></div>
        <div class="layer underglow-layer"></div>
        <div class="layer glow-layer" style="${config.type === 'weather' && vars.weather_disable_base_glow ? 'display:none;opacity:0;' : ''}"></div>
        ${weatherRainMarkup}
        ${gridLayout}
      </ha-card>
    `;

    // Click triggers
    this.shadowRoot.getElementById('button-surface').addEventListener('click', (e) => this._handleAction('tap'));
    this.shadowRoot.getElementById('button-surface').addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this._handleAction('hold');
    });
  }

  // --- Dynamic Color Calculators ---
  _computeActiveColor(attrs, vars, config) {
    const eff = (attrs.effect || attrs.movie || attrs.playlist);
    if (eff) {
      const raw = String(eff).toLowerCase().replace(/^\d+\s+/, '');
      const map = config.twinkly_effect_map || {};
      for (let k in map) { if (raw.indexOf(k) !== -1) return map[k]; }
    }
    if (Array.isArray(attrs.rgb_color)) {
      return `rgb(${attrs.rgb_color.join(',')})`;
    }
    if (Array.isArray(attrs.hs_color)) {
      let l = 55;
      if (attrs.brightness != null) l = Math.max(35, Math.min(65, 30 + (attrs.brightness / 255) * 35));
      return `hsl(${Math.round(attrs.hs_color[0] || 0)}, ${Math.round(attrs.hs_color[1] || 0)}%, ${Math.round(l)}%)`;
    }
    if (attrs.color_temp_kelvin != null) {
      const k = Math.max(2000, Math.min(6500, attrs.color_temp_kelvin));
      const t = (k - 2000) / (6500 - 2000);
      return `hsl(${Math.round(25 + t * (210 - 25))}, 100%, 56%)`;
    }
    return vars.accent || 'var(--accent-color)';
  }

  _computeUnderGlow(attrs, vars, config, active) {
    const ox = vars.glow_origin_x, oy = vars.glow_origin_y;
    const makeGrad = (col) => `radial-gradient(120% 85% at ${ox}% ${oy}%, ${col}, transparent 80%)`;
    
    const eff = (attrs.effect || attrs.movie || attrs.playlist);
    if (eff) {
      const raw = String(eff).toLowerCase().replace(/^\d+\s+/, '');
      const map = config.twinkly_effect_map || {};
      for (let k in map) { if (raw.indexOf(k) !== -1) return { bg: makeGrad(String(map[k]) + '33'), opacity: active ? 1 : 0 }; }
    }
    if (Array.isArray(attrs.rgb_color)) return { bg: makeGrad(`rgba(${attrs.rgb_color.join(',')},0.18)`), opacity: active ? 1 : 0 };
    if (Array.isArray(attrs.hs_color)) return { bg: makeGrad(`hsla(${Math.round(attrs.hs_color[0] || 0)},${Math.round(attrs.hs_color[1] || 0)}%,55%,0.18)`), opacity: active ? 1 : 0 };
    if (attrs.color_temp_kelvin != null) {
      const k = Math.max(2000, Math.min(6500, attrs.color_temp_kelvin));
      const t = (k - 2000) / (6500 - 2000);
      return { bg: makeGrad(`hsla(${Math.round(25 + t * (210 - 25))},100%,56%,0.18)`), opacity: active ? 1 : 0 };
    }
    return { bg: makeGrad(String(vars.accent || 'var(--accent-color)') + '33'), opacity: active ? 1 : 0 };
  }

  _computeGlow(entity, attrs, vars, config, stateStr) {
    const ox = vars.glow_origin_x, oy = vars.glow_origin_y;
    const rx = vars.glow_radius_x, ry = vars.glow_radius_y;
    const fall = vars.glow_falloff;
    const makeGrad = (stops) => `radial-gradient(${rx}% ${ry}% at ${ox}% ${oy}%, ${stops}, transparent ${fall}%)`;

    // Palette blending logic
    const eff = (attrs.effect || attrs.movie || attrs.playlist);
    if (eff && String(vars.twinkly_multi_mode).toLowerCase() === 'blend') {
      const raw = String(eff).toLowerCase().replace(/^\d+\s+/, '');
      const pals = config.twinkly_effect_palettes || {};
      let pal = null;
      for (let key in pals) { if (raw.indexOf(key) !== -1) { pal = pals[key]; break; } }
      if (Array.isArray(pal) && pal.length) {
        const parts = [];
        for (let j = 0; j < pal.length; j++) {
          let c = String(pal[j]);
          if (c.startsWith('#') && c.length === 7) c += '88';
          let pct = 12 + Math.round(j * (48 / Math.max(1, pal.length - 1)));
          parts.push(`${c} ${pct}%`);
        }
        return { bg: makeGrad(parts.join(', ')), opacity: 1 };
      }
    }

    // Explicit solid targets
    if (Array.isArray(attrs.rgb_color)) return { bg: makeGrad(`rgba(${attrs.rgb_color.join(',')},0.35)`), opacity: 1 };
    if (Array.isArray(attrs.hs_color)) return { bg: makeGrad(`hsla(${Math.round(attrs.hs_color[0] || 0)},${Math.round(attrs.hs_color[1] || 0)}%,55%,0.35)`), opacity: 1 };
    if (attrs.color_temp_kelvin != null) {
      const k = Math.max(2000, Math.min(6500, attrs.color_temp_kelvin));
      const t = (k - 2000) / (6500 - 2000);
      return { bg: makeGrad(`hsla(${Math.round(25 + t * (210 - 25))},100%,56%,0.35)`), opacity: 1 };
    }

    // Fallbacks
    const s = stateStr.toLowerCase();
    const list = String(vars.glow_active_states || '').split(',').map(x => x.trim().toLowerCase());
    if (!list.includes(s)) return { bg: 'transparent', opacity: 0 };

    const id0 = String(entity?.entity_id || '').toLowerCase();
    const isLightish = id0.startsWith('light.') || (Array.isArray(attrs.entity_id) && attrs.entity_id.join(',').includes('light.'));
    if (!isLightish && vars.glow_for_non_lights) {
      return { bg: makeGrad(String(vars.glow_non_light_color)), opacity: Number(vars.glow_non_light_opacity) };
    }

    return { bg: makeGrad(String(vars.accent)), opacity: 1 };
  }

  // --- Rain Generator Overlay Engine ---
  _getWeatherRain(vars, states) {
    const checkActive = () => {
      if (vars.weather_rain_enabled) return true;
      const id = (vars.weather_rain_entity || '').trim();
      if (!id || !states[id]) return false;
      const v = String(states[id].state).toLowerCase();
      const n = parseFloat(v);
      if (!isNaN(n)) return n > 0;
      return ['on', 'wet', 'raining', 'rain', 'true', 'detected'].includes(v);
    };

    if (!checkActive()) return '';

    const N = Math.max(4, Math.min(40, Number(vars.weather_rain_drops ?? 16)));
    const H = Math.max(4, Math.min(25, Number(vars.weather_puddle_height ?? 12)));
    const SPD = Math.max(0.6, Number(vars.weather_rain_speed ?? 1.1));

    const parts = [];
    parts.push(`<div class="rb-puddle" style="--puddle-h:${H}%"></div>`);
    for (let i = 0; i < N; i++) {
      const x = Math.round(Math.random() * 96 + 2);
      const d = (SPD * (0.6 + Math.random() * 0.9)).toFixed(2);
      const delay = (i * (SPD / N)).toFixed(2);
      parts.push(`<span class="rb-drop" style="--x:${x}%;--dur:${d}s;--delay:${delay}s;"></span>`);
      parts.push(`<span class="rb-ripple" style="--x:${x}%;--dur:${d}s;--delay:${delay}s;--puddle-h:${H}%"></span>`);
    }
    return `<div class="rb-rain">${parts.join('')}</div>`;
  }

  // --- Day / Night Synonyms Vector Maps ---
  _getWeatherIcon(entity, states, vars) {
    if (vars.weather_icon) return vars.weather_icon;
    const condId = vars.weather_condition_entity || (entity?.entity_id?.startsWith('weather.') ? entity.entity_id : '');
    const condRaw = condId ? String(states[condId]?.state || '').toLowerCase() : '';
    const cond = condRaw.replace('_', '-').replace(/\s+/g, '-');
    const prId = String(vars.weather_precip_entity || '');
    const pr = prId ? Number(states[prId]?.state) : NaN;
    const isNight = !!vars.weather_use_daynight && (states['sun.sun']?.state === 'below_horizon');

    const dayMap = {
      'sunny': 'mdi:weather-sunny', 'clear': 'mdi:weather-sunny', 'partlycloudy': 'mdi:weather-partly-cloudy',
      'partly-cloudy': 'mdi:weather-partly-cloudy', 'mostlycloudy': 'mdi:weather-partly-cloudy', 'cloudy': 'mdi:weather-cloudy',
      'overcast': 'mdi:weather-cloudy', 'fog': 'mdi:weather-fog', 'mist': 'mdi:weather-fog', 'haze': 'mdi:weather-hazy',
      'hazy': 'mdi:weather-hazy', 'wind': 'mdi:weather-windy', 'windy': 'mdi:weather-windy', 'breezy': 'mdi:weather-windy',
      'rain': 'mdi:weather-rainy', 'rainy': 'mdi:weather-rainy', 'pouring': 'mdi:weather-pouring', 'showers': 'mdi:weather-rainy',
      'drizzle': 'mdi:weather-rainy', 'lightning': 'mdi:weather-lightning', 'thunderstorm': 'mdi:weather-lightning',
      'lightning-rainy': 'mdi:weather-lightning-rainy', 'storm': 'mdi:weather-lightning', 'snow': 'mdi:weather-snowy',
      'snowy': 'mdi:weather-snowy', 'snowy-rainy': 'mdi:weather-snowy-rainy', 'sleet': 'mdi:weather-snowy-rainy',
      'hail': 'mdi:weather-hail', 'tornado': 'mdi:weather-tornado', 'hurricane': 'mdi:weather-hurricane', 'exceptional': 'mdi:alert-circle-outline'
    };

    const map = isNight ? { ...dayMap, 'sunny': 'mdi:weather-night', 'clear': 'mdi:weather-night', 'clear-night': 'mdi:weather-night', 'partlycloudy': 'mdi:weather-night-partly-cloudy', 'partly-cloudy': 'mdi:weather-night-partly-cloudy' } : dayMap;

    if (!cond && !isNaN(pr) && pr > 0) return pr > 8 ? 'mdi:weather-pouring' : 'mdi:weather-rainy';
    if (map[cond]) return map[cond];
    if (cond.includes('clear')) return isNight ? 'mdi:weather-night' : 'mdi:weather-sunny';
    if (/(partly.?cloud|mostly.?cloud)/.test(cond)) return isNight ? 'mdi:weather-night-partly-cloudy' : 'mdi:weather-partly-cloudy';
    if (/(shower|drizzle)/.test(cond)) return 'mdi:weather-rainy';
    if (/(lightning|thunder|storm)/.test(cond)) return (!isNaN(pr) && pr > 0) ? 'mdi:weather-lightning-rainy' : 'mdi:weather-lightning';
    if (/(snow|sleet)/.test(cond)) return 'mdi:weather-snowy';
    if (/hail/.test(cond)) return 'mdi:weather-hail';
    if (/(fog|mist|haze|smoke)/.test(cond)) return 'mdi:weather-fog';
    if (/(wind|breez)/.test(cond)) return 'mdi:weather-windy';
    if (/overcast|cloud/.test(cond)) return 'mdi:weather-cloudy';

    return vars.weather_fallback_icon;
  }

  // --- Home Assistant Action Router Dispatcher ---
  _handleAction(type) {
    const actionCfg = type === 'tap' ? this._config.tap_action : this._config.hold_action;
    const action = actionCfg?.action || (type === 'tap' ? 'toggle' : 'more-info');
    
    // Trigger standard haptics feedback if configured
    const hapticType = actionCfg?.haptic || (type === 'tap' ? 'light' : 'medium');
    const hapticEvent = new CustomEvent('haptic', { detail: hapticType, bubbles: true, composed: true });
    this.dispatchEvent(hapticEvent);

    if (action === 'none') return;

    const event = new CustomEvent('hass-action', {
      detail: {
        config: this._config,
        action: action
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  getCardSize() { return 2; }
}

customElements.define('dp-custom-button-card', DPCustomButtonCard);

// Lovelace Custom Card Previewer registry injection block
window.customCards = window.customCards || [];
window.customCards.push({
  type: "dp-custom-button-card",
  name: "DP Custom Button Card",
  preview: true,
  description: "Advanced UI Component matching realistic lighting, climate variants, and wet physics."
});