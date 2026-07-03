/**
 * DP Custom Button Card
 * A high-fidelity, advanced Home Assistant Lovelace card converted from custom:button-card templates.
 * Supports glow filters, complex light color maps (including Twinkly blends), climate/fireplace/fan variants, and dynamic CSS rain animations.
 * v2.0.0
 */

// Cache of compiled [[[ ]]] template bodies, keyed by source code, shared across all card instances.
const _templateFnCache = new Map();

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
      card_type: 'standard', // 'standard', 'weather', or 'climate' — NOT `type`, which Home Assistant reserves for `custom:dp-custom-button-card`
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
        icon_align: 'center', // 'center', 'left', or 'right'
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
        // Font sizing parameters
        icon_size_css: 'clamp(18px, 5.5vw, 26px)',
        name_font_css: '14px',
        state_font_css: '12px',
        temp_font_css: 'clamp(20px, 7.0vw, 38px)',
        set_font_css: 'clamp(10px, 2.8vw, 14px)',
        sub_font_css: 'clamp(10px, 2.4vw, 13px)',
        label_font_css: '11px',
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
        // Fireplace defaults
        fireplace_attr: null,
        fireplace_high_states: ['high', 'hi', 'max', 'on_high', 'on hi', '3'],
        fireplace_low_states: ['low', 'lo', 'min', 'on_low', 'on low', '2'],
        fireplace_noheat_states: ['on', '1'],
        fireplace_high_color: '#ff3b3b',
        fireplace_low_color: '#ff3b3b',
        fireplace_noheat_color: '#ff9900',
        fireplace_full_glow: true,
        fireplace_glow_alpha: 0.26,
        flame_enabled: true,
        flame_speed: '2.8s',
        flame_flicker_speed: '1.3s',
        flame_move_y_min: '0%',
        flame_move_y_max: '-4%',
        flame_scale_min: 1,
        flame_scale_max: 0.95,
        flame_flicker_min: 0.92,
        flame_flicker_max: 1.08,
        // Fan defaults
        fan_control_entity: false,
        fan_on_color: 'rgb(34,197,94)',
        fan_off_color: 'var(--secondary-text-color)',
        fan_unavailable_color: 'rgb(255,0,0)',
        fan_speed_labels: { 33: 'Low', 66: 'Medium', 100: 'High' },
        fan_spin_low: '2.3s',
        fan_spin_med: '1.2s',
        fan_spin_high: '.5s',
        fan_low_threshold: 33,
        fan_med_threshold: 66,
        fan_value_attr: 'auto',
        fan_glow_color: '#22c55e',
        fan_glow_alpha: 0.3,
        fan_glow_full: false,
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

    if (entityId && !entity && this._config.card_type !== 'weather') {
      this.shadowRoot.innerHTML = `<ha-card style="color: red; padding: 16px;">Entity not found: ${entityId}</ha-card>`;
      return;
    }

    this.render(entity, hass.states, hass);
  }

  // --- [[[ ]]] Template Engine (original button-card syntax) ---
  _resolveTemplates(value, ctx) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.startsWith('[[[') && trimmed.endsWith(']]]')) {
        const code = trimmed.slice(3, -3);
        let fn = _templateFnCache.get(code);
        if (!fn) {
          try {
            fn = new Function('entity', 'states', 'hass', 'variables', 'user', 'config', code);
          } catch (e) {
            console.error('DP Custom Button Card: template compile error', e, code);
            fn = () => undefined;
          }
          _templateFnCache.set(code, fn);
        }
        try {
          return fn(ctx.entity, ctx.states, ctx.hass, ctx.variables, ctx.user, ctx.config);
        } catch (e) {
          console.error('DP Custom Button Card: template eval error', e, code);
          return undefined;
        }
      }
      return value;
    }
    if (Array.isArray(value)) return value.map((v) => this._resolveTemplates(v, ctx));
    if (value && typeof value === 'object') {
      const out = {};
      for (const k in value) out[k] = this._resolveTemplates(value[k], ctx);
      return out;
    }
    return value;
  }

  // --- Per-element `styles:` override builder (original button-card syntax) ---
  _buildStyleAttr(entries) {
    if (!Array.isArray(entries)) return '';
    const parts = [];
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') continue;
      for (const k in entry) {
        const val = entry[k];
        if (val === null || val === undefined || val === '') continue;
        parts.push(`${k}:${val}`);
      }
    }
    return parts.length ? parts.join(';') + ';' : '';
  }

  render(entity, states, hass) {
    this._entity = entity;
    const rawConfig = this._config;
    const ctx = { entity, states, hass, variables: rawConfig.variables, user: hass && hass.user, config: rawConfig };
    const config = this._resolveTemplates(rawConfig, ctx);
    const vars = config.variables || {};
    const styles = config.styles || {};
    const extraStyles = (typeof config.extra_styles === 'string') ? config.extra_styles : '';
    const styleCard = this._buildStyleAttr(styles.card);
    const styleIcon = this._buildStyleAttr(styles.icon);
    const styleImgCell = this._buildStyleAttr(styles.img_cell);
    const styleEntityPicture = this._buildStyleAttr(styles.entity_picture);
    const styleName = this._buildStyleAttr(styles.name);
    const styleState = this._buildStyleAttr(styles.state);
    const styleLabel = this._buildStyleAttr(styles.label);
    const styleBadge = this._buildStyleAttr(styles.badge);
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

    // --- Determine Image Source (Manual vs Home Assistant Entity Picture Layouts) ---
    const defaultShowPicture = config.card_type !== 'fan';
    const wantPicture = (config.show_entity_picture === undefined) ? defaultShowPicture : !!config.show_entity_picture;
    const resolvedPicture = wantPicture
      ? (config.entity_picture || vars.picture || targetAttrs.entity_picture || null)
      : null;

    // --- Determine Icon ---
    let icon = config.card_type === 'fireplace' ? 'mdi:fire' : config.card_type === 'fan' ? 'mdi:fan' : 'mdi:lightbulb';
    if (config.card_type === 'weather') {
      icon = this._getWeatherIcon(entity, states, vars);
    } else if (config.icon) {
      icon = config.icon;
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
    const fireplaceInfo = this._getFireplaceLevel(entity, vars);
    if (config.card_type === 'climate') {
      const hvacAction = String(targetAttrs.hvac_action || '').toLowerCase();
      const hvacMode = String(targetAttrs.hvac_mode || stateStr || '').toLowerCase();
      const combined = hvacAction || hvacMode;
      if (combined.includes('cool')) iconColor = vars.cool_color;
      else if (combined.includes('heat')) iconColor = vars.heat_color;
      else if (combined.includes('auto')) iconColor = vars.auto_color;
      else if (combined.includes('fan')) iconColor = vars.fan_color;
      else if (combined.includes('dry')) iconColor = vars.dry_color;
    } else if (config.card_type === 'fireplace') {
      if (fireplaceInfo.level) iconColor = fireplaceInfo.color;
    } else if (config.card_type === 'fan') {
      if (stateStr === 'unavailable') iconColor = vars.fan_unavailable_color;
      else if (stateStr === 'on') iconColor = vars.fan_on_color;
      else iconColor = vars.fan_off_color;
    } else if (active || stateStr === 'on') {
      if (vars.icon_color_matches_light === false) {
        iconColor = 'inherit';
      } else {
        iconColor = this._computeActiveColor(targetAttrs, vars, config);
      }
    }

    // --- Subtitle / Label Logic ---
    let subtitleText = '';
    if (config.card_type === 'climate') {
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

    if (config.card_type === 'climate') {
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
    const weatherRainMarkup = (config.card_type === 'weather') ? this._getWeatherRain(vars, states) : '';
    const fireplaceGlowStyle = (config.card_type === 'fireplace') ? this._computeFireplaceGlow(fireplaceInfo, vars) : null;
    const flameAnimation = (config.card_type === 'fireplace') ? this._getFlameAnimation(vars) : 'none';
    const fanGlowStyle = (config.card_type === 'fan') ? this._computeFanGlow(stateStr, vars) : null;
    const fanSpinAnimation = (config.card_type === 'fan') ? this._getFanSpinAnimation(stateStr, targetAttrs, vars) : 'none';
    const fanLabelText = (config.card_type === 'fan') ? this._getFanLabel(targetAttrs, vars) : '';

    // --- CSS Position Translation ---
    let flexAlignment = 'center';
    if (vars.icon_align === 'left') flexAlignment = 'flex-start';
    if (vars.icon_align === 'right') flexAlignment = 'flex-end';

    // --- Compose HTML Grid layouts ---
    let gridLayout = '';
    if (config.card_type === 'climate') {
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

      const labelHiddenClimate = (config.show_label === false || !config.label) ? 'display:none;' : '';
      gridLayout = `
        <div class="grid-container climate">
          <div class="icon-area" style="${styleImgCell}"><ha-icon icon="${icon}" style="${styleIcon}"></ha-icon></div>
          <div class="badge-area" style="${styleBadge}">${vars.badge ? `<span>${vars.badge}</span>` : ''}</div>
          <div class="name-area" style="${styleName}">${config.name || targetAttrs.friendly_name || 'Climate'}</div>
          <div class="temp-area">${curTemp}°</div>
          <div class="footer-area">${setpointMarkup} <span class="sub-footer">${subMarkup}</span></div>
          <div class="label-area" style="${labelHiddenClimate}${styleLabel}">${config.label || ''}</div>
        </div>
      `;
    } else {
      const defaultShowState = config.card_type !== 'fan';
      const showState = (config.show_state === undefined) ? defaultShowState : config.show_state !== false;
      const stateHidden = showState ? '' : 'display:none;';
      let effectiveLabel = config.label;
      if (!effectiveLabel && config.card_type === 'fireplace') effectiveLabel = fireplaceInfo.label;
      if (!effectiveLabel && config.card_type === 'fan') effectiveLabel = fanLabelText;
      const labelHidden = (config.show_label === false || !effectiveLabel) ? 'display:none;' : '';
      gridLayout = `
        <div class="grid-container standard">
          <div class="icon-area" style="${styleImgCell}">
            ${resolvedPicture ? `<img src="${resolvedPicture}" class="entity-img" style="${styleEntityPicture}"/>` : `<ha-icon icon="${icon}" style="${styleIcon}"></ha-icon>`}
          </div>
          <div class="badge-area" style="${styleBadge}">${vars.badge ? `<span>${vars.badge}</span>` : ''}</div>
          <div class="name-area" style="${styleName}">${config.name || (entity ? entity.attributes.friendly_name : 'Button')}</div>
          <div class="state-area" style="${stateHidden}${styleState}">${subtitleText}</div>
          <div class="label-area" style="${labelHidden}${styleLabel}">${effectiveLabel || ''}</div>
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
          grid-template-areas: "i badge" "n n" "s s" "label label";
          grid-template-columns: 1fr auto;
          grid-template-rows: auto auto auto 1fr;
        }
        .grid-container.climate {
          grid-template-areas: "i badge" "n n" "temp temp" "footer footer" "label label";
          grid-template-columns: 1fr auto;
          grid-template-rows: auto auto auto auto auto;
        }
        .label-area {
          grid-area: label; justify-self: center; text-align: center; margin-top: 2px;
          font-size: ${vars.label_font_css}; opacity: 0.85; color: var(--secondary-text-color); z-index: 2;
        }
        .icon-area { 
          grid-area: i; 
          position: relative; 
          z-index: 3; 
          display: flex; 
          justify-content: ${flexAlignment}; 
          align-items: center;
        }
        .entity-img {
          width: ${config.size};
          height: ${config.size};
          border-radius: 8px;
          object-fit: cover;
        }
        ha-icon {
          --mdc-icon-size: ${config.card_type === 'climate' ? vars.icon_size_css : config.size};
          color: ${iconColor};
          filter: ${active ? 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))' : 'none'};
          animation: ${fanSpinAnimation};
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
          font-size: ${vars.name_font_css};
        }
        .state-area { 
          grid-area: s; justify-self: center; text-align: center; margin-top: 2px; 
          font-size: ${vars.state_font_css}; 
          opacity: 0.85; color: var(--secondary-text-color); z-index: 2; 
        }
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
        .fireplace-glow-layer {
          mix-blend-mode: screen; transform-origin: 50% 90%; will-change: transform, filter;
          transition: opacity 0.25s ease;
          background: ${fireplaceGlowStyle ? fireplaceGlowStyle.bg : 'transparent'};
          opacity: ${fireplaceGlowStyle ? fireplaceGlowStyle.opacity : 0};
          animation: ${flameAnimation};
          --rb-mvy0: ${vars.flame_move_y_min};
          --rb-mvy1: ${vars.flame_move_y_max};
          --rb-scy0: ${vars.flame_scale_min};
          --rb-scy1: ${vars.flame_scale_max};
          --rb-fk-min: ${vars.flame_flicker_min};
          --rb-fk-max: ${vars.flame_flicker_max};
        }
        .fan-glow-layer {
          transition: opacity 0.2s ease;
          background: ${fanGlowStyle ? fanGlowStyle.bg : 'transparent'};
          opacity: ${fanGlowStyle ? fanGlowStyle.opacity : 0};
        }
        @keyframes rb_flame_move {
          0%   { transform: translateY(var(--rb-mvy0)) scaleY(var(--rb-scy0)); }
          100% { transform: translateY(var(--rb-mvy1)) scaleY(var(--rb-scy1)); }
        }
        @keyframes rb_flame_flicker {
          0%   { filter: brightness(var(--rb-fk-min)); }
          25%  { filter: brightness(var(--rb-fk-max)); }
          47%  { filter: brightness(var(--rb-fk-min)); }
          62%  { filter: brightness(var(--rb-fk-max)); }
          78%  { filter: brightness(var(--rb-fk-min)); }
          100% { filter: brightness(1); }
        }
        @keyframes rotating {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
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

        /* User-supplied extra_styles (raw CSS) */
        ${extraStyles}
      </style>

      <ha-card id="button-surface" style="--rb-rain-color: ${vars.weather_rain_color};${styleCard}">
        <div class="layer gloss-layer"></div>
        <div class="layer underglow-layer"></div>
        <div class="layer glow-layer" style="${config.card_type === 'weather' && vars.weather_disable_base_glow ? 'display:none;opacity:0;' : ''}"></div>
        ${config.card_type === 'fireplace' ? '<div class="layer fireplace-glow-layer"></div>' : ''}
        ${config.card_type === 'fan' ? '<div class="layer fan-glow-layer"></div>' : ''}
        ${weatherRainMarkup}
        ${gridLayout}
      </ha-card>
    `;

    // --- Tap vs. Hold Detection ---
    // Uses a press-duration timer on pointer events rather than the native 'click'/'contextmenu'
    // events: many touch browsers (notably the HA Companion App's WebView) fire 'contextmenu' on
    // an ordinary tap, which made every tap behave like a hold. pointerdown/pointerup works
    // uniformly for mouse and touch.
    const surface = this.shadowRoot.getElementById('button-surface');
    const holdTime = Number(config.hold_time ?? 500);
    let pressTimer = null;
    let holdFired = false;

    const startPress = () => {
      holdFired = false;
      clearTimeout(pressTimer);
      pressTimer = setTimeout(() => {
        holdFired = true;
        this._handleAction('hold');
      }, holdTime);
    };
    const endPress = () => {
      clearTimeout(pressTimer);
      if (!holdFired) this._handleAction('tap');
    };
    const cancelPress = () => {
      clearTimeout(pressTimer);
    };

    surface.addEventListener('pointerdown', startPress);
    surface.addEventListener('pointerup', endPress);
    surface.addEventListener('pointerleave', cancelPress);
    surface.addEventListener('pointercancel', cancelPress);
    surface.addEventListener('contextmenu', (e) => e.preventDefault());
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

  // --- Fireplace Level Resolver ---
  _getFireplaceLevel(entity, vars) {
    const attrs = (entity && entity.attributes) || {};
    let v;
    if (vars.fireplace_attr && attrs[vars.fireplace_attr] != null) v = attrs[vars.fireplace_attr];
    else if (attrs.preset_mode != null) v = attrs.preset_mode;
    else if (attrs.flame != null) v = attrs.flame;
    else if (attrs.level != null) v = attrs.level;
    else v = (entity && entity.state) || '';
    v = String(v).toLowerCase();

    const hi = (vars.fireplace_high_states || []).map((x) => String(x).toLowerCase());
    const lo = (vars.fireplace_low_states || []).map((x) => String(x).toLowerCase());
    const noheat = (vars.fireplace_noheat_states || []).map((x) => String(x).toLowerCase());

    if (hi.includes(v)) return { level: 'high', color: vars.fireplace_high_color || '#ff3b3b', label: 'High' };
    if (lo.includes(v)) return { level: 'low', color: vars.fireplace_low_color || '#ff3b3b', label: 'Low' };
    if (noheat.includes(v)) return { level: 'noheat', color: vars.fireplace_noheat_color || '#ff9900', label: 'No Heat' };
    return { level: null, color: null, label: '' };
  }

  _computeFireplaceGlow(fireplaceInfo, vars) {
    if (!fireplaceInfo.level) return { bg: 'transparent', opacity: 0 };
    const col = fireplaceInfo.color;
    const radial = `radial-gradient(120% 95% at 50% 88%, ${col}88, transparent 62%)`;
    const full = (vars.fireplace_full_glow === true || String(vars.fireplace_full_glow) === 'true');
    if (full) {
      const alpha = Math.max(0, Math.min(1, Number(vars.fireplace_glow_alpha ?? 0.26)));
      const ah = Math.round(alpha * 255).toString(16).padStart(2, '0');
      const lin = (col.startsWith('#') && col.length === 7)
        ? `linear-gradient(0deg, ${col}${ah}, ${col}${ah})`
        : `linear-gradient(0deg, ${col}, ${col})`;
      return { bg: `${radial}, ${lin}`, opacity: 1 };
    }
    return { bg: radial, opacity: 1 };
  }

  _getFlameAnimation(vars) {
    if (!(vars.flame_enabled === true || String(vars.flame_enabled) === 'true')) return 'none';
    const mv = `rb_flame_move ${vars.flame_speed || '2.8s'} ease-in-out infinite alternate`;
    const fk = `rb_flame_flicker ${vars.flame_flicker_speed || '1.3s'} linear infinite`;
    return `${mv}, ${fk}`;
  }

  // --- Fan Speed Resolver ---
  _getFanPercentage(attrs, vars) {
    const fromWord = (s) => {
      s = String(s || '').toLowerCase();
      if (s === 'off') return 0;
      if (s === 'low') return 33;
      if (s === 'medium' || s === 'med') return 66;
      if (s === 'high' || s === 'max') return 100;
      return NaN;
    };
    const mode = String(vars.fan_value_attr || 'auto');
    if (mode === 'percentage') return Number(attrs.percentage);
    if (mode === 'speed') return fromWord(attrs.speed);
    if (mode === 'preset_mode') return fromWord(attrs.preset_mode);

    const p = Number(attrs.percentage);
    if (!isNaN(p)) return p;
    const bySpeed = fromWord(attrs.speed);
    if (!isNaN(bySpeed)) return bySpeed;
    return fromWord(attrs.preset_mode);
  }

  _getFanLabel(attrs, vars) {
    const p = this._getFanPercentage(attrs, vars);
    if (isNaN(p)) return '—';
    if (p <= 0) return '';
    const map = vars.fan_speed_labels || {};
    const mapped = map[String(p)];
    return mapped ? mapped : `${p}%`;
  }

  _getFanSpinAnimation(stateStr, attrs, vars) {
    if (stateStr !== 'on') return 'none';
    const p = this._getFanPercentage(attrs, vars);
    if (isNaN(p) || p <= 0) return 'none';
    const medT = Number(vars.fan_med_threshold ?? 66);
    if (p >= 100) return `rotating ${vars.fan_spin_high || '.5s'} linear infinite`;
    if (p >= medT) return `rotating ${vars.fan_spin_med || '1.2s'} linear infinite`;
    return `rotating ${vars.fan_spin_low || '2.3s'} linear infinite`;
  }

  _computeFanGlow(stateStr, vars) {
    if (stateStr !== 'on') return { bg: 'transparent', opacity: 0 };
    const col = String(vars.fan_glow_color || '#22c55e').trim();
    const alpha = Math.max(0, Math.min(1, Number(vars.fan_glow_alpha ?? 0.3)));
    const paint = this._withAlpha(col, alpha);
    return { bg: `radial-gradient(120% 90% at 50% 88%, ${paint}, transparent 65%)`, opacity: 1 };
  }

  _withAlpha(c, alpha) {
    if (c.startsWith('rgba(') || c.startsWith('hsla(')) return c;
    let m;
    if ((m = c.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/))) return `rgba(${m[1]},${m[2]},${m[3]},${alpha})`;
    if ((m = c.match(/^hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/))) return `hsla(${m[1]},${m[2]}%,${m[3]}%,${alpha})`;
    if (c[0] === '#') {
      let h = c.slice(1);
      if (h.length === 3) h = h.split('').map((x) => x + x).join('');
      const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    const pct = Math.round(alpha * 100);
    return `color-mix(in srgb, ${c} ${pct}%, transparent)`;
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
    let actionCfg = type === 'tap' ? this._config.tap_action : this._config.hold_action;
    if (!actionCfg && type === 'tap' && this._config.card_type === 'fan') {
      const vars = this._config.variables || {};
      const targetEntityId = vars.fan_control_entity || (this._entity && this._entity.entity_id);
      actionCfg = { action: 'call-service', service: 'fan.toggle', service_data: { entity_id: targetEntityId } };
    }
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
